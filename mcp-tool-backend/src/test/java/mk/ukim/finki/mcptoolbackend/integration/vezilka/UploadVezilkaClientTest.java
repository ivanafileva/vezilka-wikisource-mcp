package mk.ukim.finki.mcptoolbackend.integration.vezilka;

import mk.ukim.finki.mcptoolbackend.model.enums.DonationStatus;
import mk.ukim.finki.mcptoolbackend.model.exception.VezilkaIntegrationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.headerDoesNotExist;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/** Tests the doniraj.vezilka.ai upload client against a mocked Vezilka (no network). */
class UploadVezilkaClientTest {
    private static final TextDonationRequest DONATION = new TextDonationRequest(
        "Коста Солев Рацин/ Војната и перспективите", "Втората империјалистичка војна влезе у својата трета година.",
        "https://mk.wikisource.org/wiki/Коста_Солев_Рацин/_Војната_и_перспективите");

    private MockRestServiceServer server;
    private UploadVezilkaClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new UploadVezilkaClient(new VezilkaProperties("https://doniraj.vezilka.ai", null), builder,
            "/api/donations/raw-text/", "test-agent");
    }

    @Test
    void uploadsTheTextAsAWordFileAndKeepsVezilkasId() {
        server.expect(requestTo("https://doniraj.vezilka.ai/api/donations/raw-text/"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header("Content-Type", containsString("multipart/form-data")))
            .andExpect(headerDoesNotExist("Authorization"))
            .andExpect(content().string(containsString("name=\"files\"")))
            .andExpect(content().string(containsString(".docx\"")))
            .andExpect(content().string(containsString("wordprocessingml.document")))
            .andRespond(withSuccess("""
                {"id": 1234, "fileCount": 1, "awarded_points": 0}""", MediaType.APPLICATION_JSON));

        DonationReceipt receipt = client.submitTextDonation(DONATION);

        server.verify();
        assertThat(receipt.reference()).isEqualTo("VZ-RAW-1234");
        assertThat(client.checkStatus(receipt.reference())).isEqualTo(DonationStatus.SUBMITTED);
    }

    @Test
    void theAnonymousDailyLimitIsReportedInMacedonian() {
        server.expect(requestTo("https://doniraj.vezilka.ai/api/donations/raw-text/"))
            .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"code\":\"anon_daily_limit\"}"));

        assertThatThrownBy(() -> client.submitTextDonation(DONATION))
            .isInstanceOf(VezilkaIntegrationException.class)
            .hasMessageContaining("анонимни донации");
    }

    @Test
    void aResponseWithoutAnIdIsAnError() {
        server.expect(requestTo("https://doniraj.vezilka.ai/api/donations/raw-text/"))
            .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.submitTextDonation(DONATION))
            .isInstanceOf(VezilkaIntegrationException.class)
            .hasMessageContaining("референца");
    }

    @Test
    void emptyTextIsNeverSent() {
        assertThatThrownBy(() -> client.submitTextDonation(new TextDonationRequest("Празно", "  ", null)))
            .isInstanceOf(VezilkaIntegrationException.class);
        server.verify();
    }

    @Test
    void fileNamesAreReadableAndSafe() {
        assertThat(UploadVezilkaClient.fileName("Коста Солев Рацин/ За куражот"))
            .startsWith("Kosta-Solev-Racin-Za-kurazhot-")
            .endsWith(".docx")
            .doesNotContain("/", " ");
        assertThat(UploadVezilkaClient.fileName(null)).startsWith("donacija-");
    }
}
