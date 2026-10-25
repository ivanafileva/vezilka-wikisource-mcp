package mk.ukim.finki.mcptoolbackend.service;

import java.util.List;
import mk.ukim.finki.mcptoolbackend.integration.vezilka.DonationReceipt;
import mk.ukim.finki.mcptoolbackend.integration.vezilka.TextDonationRequest;
import mk.ukim.finki.mcptoolbackend.integration.vezilka.VezilkaClient;
import mk.ukim.finki.mcptoolbackend.model.domain.DonationBatch;
import mk.ukim.finki.mcptoolbackend.model.domain.Resource;
import mk.ukim.finki.mcptoolbackend.model.domain.SearchRun;
import mk.ukim.finki.mcptoolbackend.model.enums.DonationStatus;
import mk.ukim.finki.mcptoolbackend.model.enums.SearchStatus;
import mk.ukim.finki.mcptoolbackend.model.exception.InvalidDonationStateException;
import mk.ukim.finki.mcptoolbackend.model.exception.VezilkaIntegrationException;
import mk.ukim.finki.mcptoolbackend.repository.DonationBatchRepository;
import mk.ukim.finki.mcptoolbackend.repository.ResourceRepository;
import mk.ukim.finki.mcptoolbackend.repository.SearchRunRepository;
import mk.ukim.finki.mcptoolbackend.service.domain.DonationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Integration test of the donation workflow (create -> approve -> submit ->
 * status refresh) against a real Postgres, with the {@link VezilkaClient}
 * replaced by a Mockito mock.
 */
@SpringBootTest
@Testcontainers
public class DonationServiceIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("mcptool_test")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @MockitoBean
    private VezilkaClient vezilkaClient;

    @Autowired
    private DonationService donationService;

    @Autowired
    private SearchRunRepository searchRunRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private DonationBatchRepository donationBatchRepository;

    @AfterEach
    void cleanUp() {
        resourceRepository.deleteAll();
        donationBatchRepository.deleteAll();
        searchRunRepository.deleteAll();
    }

    private List<Long> createResources(String... titles) {
        SearchRun run = new SearchRun("Рацин");
        run.setStatus(SearchStatus.COMPLETED);
        run = searchRunRepository.save(run);
        SearchRun savedRun = run;
        return java.util.Arrays.stream(titles)
            .map(title -> resourceRepository.save(new Resource(savedRun, null, title,
                "Македонски текст од Викизвор: " + title, "https://mk.wikisource.org/wiki/" + title)).getId())
            .toList();
    }

    @Test
    void testDonationWorkflow() {
        List<Long> resourceIds = createResources("Бели мугри", "Ленка");
        when(vezilkaClient.submitTextDonation(any(TextDonationRequest.class)))
            .thenReturn(new DonationReceipt("VZ-1", null), new DonationReceipt("VZ-2", null));

        DonationBatch draft = donationService.create(resourceIds);
        assertThat(draft.getStatus()).isEqualTo(DonationStatus.DRAFT);
        assertThat(resourceRepository.countByDonationBatchIsNotNull()).isEqualTo(2);

        DonationBatch approved = donationService.approve(draft.getId());
        assertThat(approved.getStatus()).isEqualTo(DonationStatus.APPROVED);

        DonationBatch submitted = donationService.submit(draft.getId());
        assertThat(submitted.getStatus()).isEqualTo(DonationStatus.SUBMITTED);
        assertThat(submitted.getVezilkaReference()).isEqualTo("VZ-1,VZ-2");
        assertThat(submitted.getSubmittedAt()).isNotNull();
        verify(vezilkaClient, times(2)).submitTextDonation(any(TextDonationRequest.class));

        when(vezilkaClient.checkStatus(anyString())).thenReturn(DonationStatus.ACCEPTED);
        donationService.refreshSubmittedStatuses();
        assertThat(donationBatchRepository.findById(draft.getId()).orElseThrow().getStatus())
            .isEqualTo(DonationStatus.ACCEPTED);
    }

    @Test
    void testIllegalTransitionsAreRejected() {
        List<Long> resourceIds = createResources("Ленка");
        DonationBatch draft = donationService.create(resourceIds);

        // DRAFT cannot be submitted directly.
        assertThatThrownBy(() -> donationService.submit(draft.getId()))
            .isInstanceOf(InvalidDonationStateException.class);

        // A resource cannot be in two batches.
        assertThatThrownBy(() -> donationService.create(resourceIds))
            .isInstanceOf(InvalidDonationStateException.class);

        donationService.approve(draft.getId());
        assertThatThrownBy(() -> donationService.approve(draft.getId()))
            .isInstanceOf(InvalidDonationStateException.class);
    }

    @Test
    void testVezilkaFailureMarksBatchFailed() {
        List<Long> resourceIds = createResources("Ленка");
        when(vezilkaClient.submitTextDonation(any(TextDonationRequest.class)))
            .thenThrow(new VezilkaIntegrationException("Vezilka is down"));

        DonationBatch draft = donationService.create(resourceIds);
        donationService.approve(draft.getId());

        assertThatThrownBy(() -> donationService.submit(draft.getId()))
            .isInstanceOf(VezilkaIntegrationException.class);
        assertThat(donationBatchRepository.findById(draft.getId()).orElseThrow().getStatus())
            .isEqualTo(DonationStatus.FAILED);
    }
}
