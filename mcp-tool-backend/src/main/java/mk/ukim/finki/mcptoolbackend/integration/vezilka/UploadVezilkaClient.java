package mk.ukim.finki.mcptoolbackend.integration.vezilka;

import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import mk.ukim.finki.mcptoolbackend.model.enums.DonationStatus;
import mk.ukim.finki.mcptoolbackend.model.exception.VezilkaIntegrationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * {@link VezilkaClient} that uploads every donation to doniraj.vezilka.ai
 * ({@code vezilka.mode=upload}).
 *
 * <p>It does exactly what the site's own "Донирај текст" form does: each text
 * (with the provenance header the outbox uses) becomes a Word document that is
 * POSTed as multipart field {@code files} to {@code /api/donations/raw-text/}.
 * Uploads are anonymous - the site's login needs a reCAPTCHA, so a server
 * cannot log in - and Vezilka limits anonymous uploads per day (HTTP 429
 * {@code anon_daily_limit}). The response carries Vezilka's donation id, which
 * is stored as the reference.</p>
 *
 * <p>Vezilka offers no endpoint to look a donation up again, so
 * {@link #checkStatus} reports uploaded donations as SUBMITTED.</p>
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "vezilka.mode", havingValue = "upload")
public class UploadVezilkaClient implements VezilkaClient {
    /** Prefix of the references this client stores, followed by Vezilka's donation id. */
    static final String REFERENCE_PREFIX = "VZ-RAW-";
    private static final MediaType DOCX =
        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    private final RestClient restClient;
    private final String uploadPath;

    public UploadVezilkaClient(VezilkaProperties vezilkaProperties,
                               RestClient.Builder restClientBuilder,
                               @Value("${vezilka.upload.path:/api/donations/raw-text/}") String uploadPath,
                               @Value("${vezilka.user-agent:VezilkaMcpTool/1.0 (FINKI EMC 2026 student project)}") String userAgent) {
        this.uploadPath = uploadPath;
        this.restClient = restClientBuilder
            .baseUrl(vezilkaProperties.baseUrl())
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader(HttpHeaders.USER_AGENT, userAgent)
            .build();
    }

    @Override
    public DonationReceipt submitTextDonation(TextDonationRequest request) {
        if (request.content() == null || request.content().isBlank()) {
            throw new VezilkaIntegrationException("Не може да се донира празен текст.");
        }

        byte[] document;
        try {
            document = DocxWriter.toBytes(OutboxVezilkaClient.render(request), OutboxVezilkaClient.HEADER_LINES);
        } catch (IOException e) {
            throw new VezilkaIntegrationException("Документот за донација не можеше да се подготви.", e);
        }
        String fileName = fileName(request.title());

        HttpHeaders partHeaders = new HttpHeaders();
        partHeaders.setContentType(DOCX);
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("files", new HttpEntity<>(new NamedBytes(document, fileName), partHeaders));

        ResponseEntity<JsonNode> response;
        try {
            response = restClient.post()
                .uri(uploadPath)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(form)
                .retrieve()
                .toEntity(JsonNode.class);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 429) {
                throw new VezilkaIntegrationException(
                    "Везилка го ограничи бројот на анонимни донации за денес. Обидете се повторно утре.", e);
            }
            throw new VezilkaIntegrationException("Везилка ја одби донацијата (HTTP %d): %s".formatted(
                e.getStatusCode().value(), e.getResponseBodyAsString()), e);
        } catch (RestClientException e) {
            throw new VezilkaIntegrationException("Испраќањето на донацијата до Везилка не успеа: " + e.getMessage(), e);
        }

        JsonNode body = response.getBody();
        String id = body == null ? "" : body.path("id").asText("");
        if (id.isBlank()) {
            throw new VezilkaIntegrationException("Везилка не врати референца за донацијата.");
        }
        log.info("Uploaded donation '{}' to Vezilka as {} (donation id {}, {} file(s))",
            request.title(), fileName, id, body.path("fileCount").asInt(1));
        return new DonationReceipt(REFERENCE_PREFIX + id, "Испратено на doniraj.vezilka.ai (донација " + id + ")");
    }

    @Override
    public DonationStatus checkStatus(String vezilkaReference) {
        return vezilkaReference != null && vezilkaReference.startsWith(REFERENCE_PREFIX)
            ? DonationStatus.SUBMITTED
            : DonationStatus.FAILED;
    }

    /** Macedonian Cyrillic to Latin, for ASCII-only upload file names. */
    private static final Map<Character, String> LATIN = Map.ofEntries(
        Map.entry('а', "a"), Map.entry('б', "b"), Map.entry('в', "v"), Map.entry('г', "g"), Map.entry('д', "d"),
        Map.entry('ѓ', "gj"), Map.entry('е', "e"), Map.entry('ж', "zh"), Map.entry('з', "z"), Map.entry('ѕ', "dz"),
        Map.entry('и', "i"), Map.entry('ј', "j"), Map.entry('к', "k"), Map.entry('л', "l"), Map.entry('љ', "lj"),
        Map.entry('м', "m"), Map.entry('н', "n"), Map.entry('њ', "nj"), Map.entry('о', "o"), Map.entry('п', "p"),
        Map.entry('р', "r"), Map.entry('с', "s"), Map.entry('т', "t"), Map.entry('ќ', "kj"), Map.entry('у', "u"),
        Map.entry('ф', "f"), Map.entry('х', "h"), Map.entry('ц', "c"), Map.entry('ч', "ch"), Map.entry('џ', "dj"),
        Map.entry('ш', "sh"));

    /** A readable ASCII file name from the title, e.g. "Kosta-Solev-Racin-Vojnata-20261025-1a2b3c4d.docx". */
    static String fileName(String title) {
        StringBuilder latin = new StringBuilder();
        for (char c : (title == null ? "" : title).toCharArray()) {
            String l = LATIN.get(Character.toLowerCase(c));
            if (l == null) {
                latin.append(c);
            } else {
                latin.append(Character.isUpperCase(c) ? Character.toUpperCase(l.charAt(0)) + l.substring(1) : l);
            }
        }
        String base = latin.toString().replaceAll("[^A-Za-z0-9]+", "-").replaceAll("(^-+|-+$)", "");
        if (base.length() > 60) {
            base = base.substring(0, 60).replaceAll("-+$", "");
        }
        String suffix = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + UUID.randomUUID().toString().substring(0, 8);
        return (base.isEmpty() ? "donacija" : base) + "-" + suffix + ".docx";
    }

    /** In-memory file content with a file name, as multipart file parts need one. */
    private static final class NamedBytes extends ByteArrayResource {
        private final String fileName;

        NamedBytes(byte[] bytes, String fileName) {
            super(bytes);
            this.fileName = fileName;
        }

        @Override
        public String getFilename() {
            return fileName;
        }
    }
}
