package mk.ukim.finki.mcptoolbackend.integration.vezilka;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import mk.ukim.finki.mcptoolbackend.model.enums.DonationStatus;
import mk.ukim.finki.mcptoolbackend.model.exception.VezilkaIntegrationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * {@link VezilkaClient} for an HTTP API ({@code vezilka.mode=http}).
 *
 * <p>doniraj.vezilka.ai does not publish an API yet, so the endpoint paths are
 * configurable ({@code vezilka.http.submit-path},
 * {@code vezilka.http.status-path}) and must be confirmed with the Vezilka
 * team (contact@vezilka.ai). Expected contract:</p>
 * <pre>
 * POST {base-url}{submit-path}   Authorization: Bearer {api-key}
 *   {"title", "content", "sourceUrl", "language": "mk", "type": "text"}
 *   -> {"reference" | "id", "message"?}
 * GET  {base-url}{status-path}   ({reference} is substituted)
 *   -> {"status": "SUBMITTED" | "ACCEPTED" | "REJECTED" | ...}
 * </pre>
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "vezilka.mode", havingValue = "http")
public class HttpVezilkaClient implements VezilkaClient {
    private final VezilkaProperties vezilkaProperties;
    private final RestClient restClient;
    private final String submitPath;
    private final String statusPath;

    public HttpVezilkaClient(VezilkaProperties vezilkaProperties,
                             RestClient.Builder restClientBuilder,
                             @Value("${vezilka.http.submit-path:/api/donations/text}") String submitPath,
                             @Value("${vezilka.http.status-path:/api/donations/{reference}}") String statusPath) {
        this.vezilkaProperties = vezilkaProperties;
        this.submitPath = submitPath;
        this.statusPath = statusPath;
        this.restClient = restClientBuilder
            .baseUrl(vezilkaProperties.baseUrl())
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    @Override
    public DonationReceipt submitTextDonation(TextDonationRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("title", request.title());
        body.put("content", request.content());
        body.put("sourceUrl", request.sourceUrl());
        body.put("language", "mk");
        body.put("type", "text");

        JsonNode response;
        try {
            response = restClient.post()
                .uri(submitPath)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + requireApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
        } catch (RestClientException e) {
            throw new VezilkaIntegrationException("Испраќањето на донацијата до Везилка не успеа: " + e.getMessage(), e);
        }

        String reference = response == null ? null : response.path("reference").asText(response.path("id").asText(null));
        if (reference == null || reference.isBlank()) {
            throw new VezilkaIntegrationException("Везилка не врати референца за донацијата.");
        }
        log.info("Submitted donation '{}' to Vezilka, reference {}", request.title(), reference);
        return new DonationReceipt(reference, response.path("message").asText(null));
    }

    @Override
    public DonationStatus checkStatus(String vezilkaReference) {
        JsonNode response;
        try {
            response = restClient.get()
                .uri(statusPath, Map.of("reference", vezilkaReference))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + requireApiKey())
                .retrieve()
                .body(JsonNode.class);
        } catch (RestClientException e) {
            throw new VezilkaIntegrationException("Проверката на донацијата %s не успеа: %s".formatted(vezilkaReference, e.getMessage()), e);
        }
        String status = response == null ? "" : response.path("status").asText("");
        try {
            return DonationStatus.valueOf(status.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            // Unknown / in-progress states keep the batch SUBMITTED.
            return DonationStatus.SUBMITTED;
        }
    }

    private String requireApiKey() {
        if (vezilkaProperties.apiKey() == null || vezilkaProperties.apiKey().isBlank()) {
            throw new VezilkaIntegrationException("VEZILKA_API_KEY не е поставен (потребен е за vezilka.mode=http).");
        }
        return vezilkaProperties.apiKey();
    }
}
