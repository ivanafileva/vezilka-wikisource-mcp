package mk.ukim.finki.mcptoolbackend.source;

import com.fasterxml.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import mk.ukim.finki.mcptoolbackend.model.exception.SourceUnavailableException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.parser.Parser;
import org.jsoup.safety.Safelist;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;

/**
 * {@link SourceClient} for <a href="https://mk.wikisource.org">Викизвор</a>
 * (Macedonian Wikisource) — a free library of public-domain and openly
 * licensed Macedonian texts (folk poetry, Racin, the Miladinov brothers,
 * Prličev, historical documents...), which makes its content safe to donate to
 * doniraj.vezilka.ai.
 *
 * <p>Uses the public MediaWiki Action API (no key required):</p>
 * <ul>
 *   <li>{@code action=query&list=search} — full-text search over the main
 *       (content) namespace;</li>
 *   <li>{@code action=parse&prop=text} — the rendered HTML of a page, cleaned
 *       to plain text with jsoup (headers, footnotes, navigation and licence
 *       boxes removed; verse line breaks preserved).</li>
 * </ul>
 *
 * <p>Follows the Wikimedia API etiquette: a descriptive {@code User-Agent},
 * serial requests with a small delay, and {@code maxlag}.</p>
 */
@Slf4j
@Component
public class WikisourceSourceClient implements SourceClient {
    static final int MIN_CONTENT_CHARS = 80;
    private static final int MAX_SEARCH_LIMIT = 50;
    private static final int MAIN_NAMESPACE = 0;

    /** Elements that are navigation, apparatus or licensing, not the text itself. */
    private static final String NON_CONTENT_SELECTORS = String.join(", ",
        "style", "script", "noscript",
        "sup.reference", ".reference", ".references", ".mw-references-wrap", ".mw-cite-backlink",
        ".mw-editsection", ".noprint", ".ws-noexport", ".metadata", ".navbox", ".catlinks",
        "#headertemplate", ".headertemplate", ".ws-header", ".header_notes",
        ".licenseContainer", ".licence", ".license", ".ambox",
        "#toc", ".toc", ".pagenum", ".ws-pagenum", ".mw-empty-elt"
    );

    private static final String BLOCK_ELEMENTS = "p, div, li, dd, dt, tr, h1, h2, h3, h4, h5, h6, blockquote, pre, center";

    private final SourceProperties sourceProperties;
    private final RestClient restClient;
    private final long requestDelayMs;

    public WikisourceSourceClient(SourceProperties sourceProperties,
                                  RestClient.Builder restClientBuilder,
                                  @Value("${source.user-agent:VezilkaMcpTool/1.0 (FINKI EMC student project)}") String userAgent,
                                  @Value("${source.request-delay-ms:200}") long requestDelayMs) {
        this.sourceProperties = sourceProperties;
        this.requestDelayMs = requestDelayMs;
        this.restClient = restClientBuilder
            .baseUrl(stripTrailingSlash(sourceProperties.baseUrl()))
            .defaultHeader(HttpHeaders.USER_AGENT, userAgent)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    @Override
    public List<FetchedResource> search(String query, int limit) {
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("Барањето за пребарување не смее да биде празно.");
        }
        int wanted = Math.max(1, limit);
        // Over-fetch a little: some hits are index/disambiguation pages without real text.
        int searchLimit = Math.min(MAX_SEARCH_LIMIT, wanted * 2);

        JsonNode response = callApi(Map.of(
            "action", "query",
            "list", "search",
            "srsearch", query.strip(),
            "srnamespace", String.valueOf(MAIN_NAMESPACE),
            "srlimit", String.valueOf(searchLimit),
            "srprop", "timestamp|wordcount"
        ));

        List<FetchedResource> results = new ArrayList<>();
        for (JsonNode hit : response.path("query").path("search")) {
            if (results.size() >= wanted) {
                break;
            }
            String title = hit.path("title").asText();
            try {
                pause();
                FetchedResource resource = fetchByTitle(title, parseTimestamp(hit.path("timestamp").asText(null)));
                if (resource.content().length() >= MIN_CONTENT_CHARS) {
                    results.add(resource);
                } else {
                    log.debug("Skipping '{}': only {} characters of text", title, resource.content().length());
                }
            } catch (SourceUnavailableException e) {
                // One broken page should not fail the whole search.
                log.warn("Skipping '{}': {}", title, e.getMessage());
            }
        }
        log.info("Wikisource search '{}' returned {} resource(s)", query, results.size());
        return results;
    }

    @Override
    public FetchedResource fetch(String url) {
        return fetchByTitle(titleFromUrl(url), null);
    }

    private FetchedResource fetchByTitle(String title, LocalDateTime publishedAt) {
        JsonNode response = callApi(Map.of(
            "action", "parse",
            "page", title,
            "prop", "text",
            "redirects", "1",
            "disableeditsection", "1",
            "disabletoc", "1",
            "disablelimitreport", "1"
        ));
        JsonNode parse = response.path("parse");
        String resolvedTitle = parse.path("title").asText(title);
        return new FetchedResource(
            parse.path("pageid").asText(null),
            resolvedTitle,
            htmlToText(parse.path("text").asText("")),
            pageUrl(resolvedTitle),
            publishedAt
        );
    }

    private JsonNode callApi(Map<String, String> params) {
        UriComponentsBuilder template = UriComponentsBuilder.fromPath("/w/api.php")
            .queryParam("format", "json")
            .queryParam("formatversion", "2")
            .queryParam("maxlag", "5");
        params.keySet().forEach(key -> template.queryParam(key, "{" + key + "}"));
        String uriTemplate = template.build().toUriString();

        JsonNode body;
        try {
            body = restClient.get()
                .uri(uriTemplate, params)
                .retrieve()
                .body(JsonNode.class);
        } catch (RestClientException e) {
            throw new SourceUnavailableException("%s не е достапен: %s".formatted(sourceProperties.name(), e.getMessage()), e);
        }
        if (body == null) {
            throw new SourceUnavailableException("Празен одговор од " + sourceProperties.name() + ".");
        }
        if (body.has("error")) {
            JsonNode error = body.path("error");
            throw new SourceUnavailableException("Грешка во API на %s „%s“: %s".formatted(
                sourceProperties.name(), error.path("code").asText(), error.path("info").asText()));
        }
        return body;
    }

    /** Accepts {@code https://mk.wikisource.org/wiki/Title} and {@code .../w/index.php?title=Title} URLs. */
    String titleFromUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("URL-адресата не смее да биде празна.");
        }
        UriComponents uri = UriComponentsBuilder.fromUriString(url.strip()).build();
        String expectedHost = UriComponentsBuilder.fromUriString(sourceProperties.baseUrl()).build().getHost();
        if (uri.getHost() == null || !uri.getHost().equalsIgnoreCase(expectedHost)) {
            throw new IllegalArgumentException("Поддржани се само URL-адреси од %s (%s).".formatted(sourceProperties.name(), expectedHost));
        }
        String path = uri.getPath() == null ? "" : uri.getPath();
        String rawTitle;
        if (path.startsWith("/wiki/") && path.length() > "/wiki/".length()) {
            rawTitle = path.substring("/wiki/".length());
        } else if (uri.getQueryParams().getFirst("title") != null) {
            rawTitle = uri.getQueryParams().getFirst("title");
        } else {
            throw new IllegalArgumentException("Во URL-адресата не е пронајден наслов на страница: " + url);
        }
        return UriUtils.decode(rawTitle, StandardCharsets.UTF_8).replace('_', ' ');
    }

    String pageUrl(String title) {
        return stripTrailingSlash(sourceProperties.baseUrl()) + "/wiki/"
            + UriUtils.encodePath(title.replace(' ', '_'), StandardCharsets.UTF_8);
    }

    /**
     * Converts the rendered page HTML into clean plain text: removes
     * non-content elements, keeps paragraph and verse line breaks, unescapes
     * entities and normalises whitespace.
     */
    static String htmlToText(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }
        Document document = Jsoup.parse(html);
        document.outputSettings(new Document.OutputSettings().prettyPrint(false));
        document.select(NON_CONTENT_SELECTORS).remove();
        document.select("br").after("\\n");
        document.select(BLOCK_ELEMENTS).before("\\n\\n");

        String withMarkers = document.body().html();
        String stripped = Jsoup.clean(withMarkers, "", Safelist.none(), new Document.OutputSettings().prettyPrint(false));
        String text = Parser.unescapeEntities(stripped, false).replace("\\n", "\n");

        StringBuilder normalised = new StringBuilder();
        for (String line : text.split("\n", -1)) {
            normalised.append(line.replace(' ', ' ').replaceAll("[ \\t]+", " ").strip()).append('\n');
        }
        return normalised.toString().replaceAll("\n{3,}", "\n\n").strip();
    }

    private static LocalDateTime parseTimestamp(String timestamp) {
        if (timestamp == null || timestamp.isBlank()) {
            return null;
        }
        try {
            return OffsetDateTime.parse(timestamp).atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private void pause() {
        if (requestDelayMs <= 0) {
            return;
        }
        try {
            Thread.sleep(requestDelayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new SourceUnavailableException("Преземањето од " + sourceProperties.name() + " беше прекинато.", e);
        }
    }

    private static String stripTrailingSlash(String url) {
        return url != null && url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
