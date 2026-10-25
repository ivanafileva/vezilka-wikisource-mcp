package mk.ukim.finki.mcptoolbackend.repository;

import jakarta.transaction.Transactional;
import java.util.List;
import mk.ukim.finki.mcptoolbackend.config.JpaConfig;
import mk.ukim.finki.mcptoolbackend.model.domain.Resource;
import mk.ukim.finki.mcptoolbackend.model.domain.SearchRun;
import mk.ukim.finki.mcptoolbackend.model.enums.SearchStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests for search runs (real Postgres via Testcontainers, schema
 * migrated by Flyway), following the {@link UserRepositoryTest} pattern.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(JpaConfig.class)
@Transactional
@Testcontainers
public class SearchRunRepositoryTest {
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

    @Autowired
    private SearchRunRepository searchRunRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    private SearchRun saveRun(String query, SearchStatus status) throws InterruptedException {
        SearchRun run = new SearchRun(query);
        run.setStatus(status);
        SearchRun saved = searchRunRepository.saveAndFlush(run);
        // Make sure the auditing timestamps differ.
        Thread.sleep(5);
        return saved;
    }

    @Test
    void testFindAllByOrderByCreatedAtDesc() throws InterruptedException {
        saveRun("Рацин", SearchStatus.COMPLETED);
        saveRun("народни песни", SearchStatus.COMPLETED);
        saveRun("Охрид", SearchStatus.FAILED);

        List<SearchRun> runs = searchRunRepository.findAllByOrderByCreatedAtDesc();

        assertThat(runs)
            .extracting(SearchRun::getQuery)
            .containsExactly("Охрид", "народни песни", "Рацин");
    }

    @Test
    void testFindAllByStatus() throws InterruptedException {
        saveRun("Рацин", SearchStatus.COMPLETED);
        saveRun("Миладиновци", SearchStatus.RUNNING);
        saveRun("Охрид", SearchStatus.FAILED);

        assertThat(searchRunRepository.findAllByStatus(SearchStatus.COMPLETED))
            .extracting(SearchRun::getQuery)
            .containsExactly("Рацин");
        assertThat(searchRunRepository.findAllByStatus(SearchStatus.PENDING)).isEmpty();
    }

    @Test
    void testResourcesAreStoredWithTheirRun() throws InterruptedException {
        SearchRun run = saveRun("Бели мугри", SearchStatus.COMPLETED);
        Resource resource = new Resource(run, "123", "Бели мугри", "Ленка, Ленка...",
            "https://mk.wikisource.org/wiki/%D0%91%D0%B5%D0%BB%D0%B8_%D0%BC%D1%83%D0%B3%D1%80%D0%B8");
        resource.setMacedonianConfidence(0.95);
        resourceRepository.saveAndFlush(resource);

        List<Resource> resources = resourceRepository.findAllBySearchRunId(run.getId());

        assertThat(resources).hasSize(1);
        assertThat(resources.getFirst().getTitle()).isEqualTo("Бели мугри");
        assertThat(resourceRepository.countByAnalysisIsNotNull()).isZero();
        assertThat(resourceRepository.countByDonationBatchIsNotNull()).isZero();
    }
}
