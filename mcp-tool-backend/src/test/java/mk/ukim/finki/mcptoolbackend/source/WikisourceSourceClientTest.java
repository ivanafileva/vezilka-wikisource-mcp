package mk.ukim.finki.mcptoolbackend.source;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/** Tests the Wikisource client against canned MediaWiki API responses (no network). */
class WikisourceSourceClientTest {
    private MockRestServiceServer server;
    private WikisourceSourceClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new WikisourceSourceClient(
            new SourceProperties("Wikisource (mk)", "https://mk.wikisource.org", null), builder, "test-agent", 0);
    }

    @Test
    void searchFetchesAndCleansEveryHit() {
        server.expect(requestTo(allOf(containsString("/w/api.php"), containsString("list=search"),
                containsString("srsearch=%D0%9B%D0%B5%D0%BD%D0%BA%D0%B0"))))
            .andRespond(withSuccess("""
                {"query":{"search":[
                  {"ns":0,"title":"Ленка","pageid":42,"timestamp":"2021-05-01T10:00:00Z"},
                  {"ns":0,"title":"Кратко","pageid":43,"timestamp":"2021-05-01T10:00:00Z"}
                ]}}""", MediaType.APPLICATION_JSON));
        server.expect(requestTo(allOf(containsString("action=parse"), containsString("page=%D0%9B%D0%B5%D0%BD%D0%BA%D0%B0"))))
            .andRespond(withSuccess("""
                {"parse":{"title":"Ленка","pageid":42,"text":"<div class=\\"mw-parser-output\\"><div id=\\"headertemplate\\">Навигација</div><div class=\\"poem\\"><p>Ленка, Ленка, мори Ленке,<br>што ќе правиш кога ќе се жениш,<br>кога ќе дојдат сватовите<sup class=\\"reference\\">[1]</sup></p></div><p>Народна песна од Струга, запишана од браќата Миладиновци.</p></div>"}}""",
                MediaType.APPLICATION_JSON));
        server.expect(requestTo(containsString("action=parse")))
            .andRespond(withSuccess("""
                {"parse":{"title":"Кратко","pageid":43,"text":"<p>Премалку.</p>"}}""", MediaType.APPLICATION_JSON));

        List<FetchedResource> results = client.search("Ленка", 5);

        server.verify();
        assertThat(results).hasSize(1);
        FetchedResource lenka = results.getFirst();
        assertThat(lenka.externalId()).isEqualTo("42");
        assertThat(lenka.title()).isEqualTo("Ленка");
        assertThat(lenka.sourceUrl()).isEqualTo("https://mk.wikisource.org/wiki/%D0%9B%D0%B5%D0%BD%D0%BA%D0%B0");
        assertThat(lenka.publishedAt()).isNotNull();
        assertThat(lenka.content())
            .startsWith("Ленка, Ленка, мори Ленке,\nшто ќе правиш кога ќе се жениш,\nкога ќе дојдат сватовите")
            .contains("\n\nНародна песна од Струга")
            .doesNotContain("Навигација", "[1]", "<");
    }

    @Test
    void apiErrorsBecomeSourceUnavailable() {
        server.expect(requestTo(containsString("list=search")))
            .andRespond(withSuccess("""
                {"error":{"code":"maxlag","info":"Waiting for a database server"}}""", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.search("Рацин", 3))
            .hasMessageContaining("maxlag");
    }

    @Test
    void titleIsExtractedFromWikiUrls() {
        assertThat(client.titleFromUrl("https://mk.wikisource.org/wiki/%D0%91%D0%B5%D0%BB%D0%B8_%D0%BC%D1%83%D0%B3%D1%80%D0%B8"))
            .isEqualTo("Бели мугри");
        assertThat(client.titleFromUrl("https://mk.wikisource.org/w/index.php?title=Ленка&action=view"))
            .isEqualTo("Ленка");
        assertThatThrownBy(() -> client.titleFromUrl("https://example.com/wiki/Ленка"))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void htmlToTextKeepsVerseAndDropsApparatus() {
        String text = WikisourceSourceClient.htmlToText(
            "<div><h2>Песна</h2><p>прв стих<br/>втор стих&nbsp;&amp; крај</p><ol class=\"references\"><li>фуснота</li></ol></div>");
        assertThat(text).isEqualTo("Песна\n\nпрв стих\nвтор стих & крај");
    }
}
