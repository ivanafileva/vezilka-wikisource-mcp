package mk.ukim.finki.mcptoolbackend.service.domain.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import mk.ukim.finki.mcptoolbackend.analysis.LanguageDetector;
import mk.ukim.finki.mcptoolbackend.analysis.MacedonianText;
import mk.ukim.finki.mcptoolbackend.model.domain.Resource;
import mk.ukim.finki.mcptoolbackend.model.domain.SearchRun;
import mk.ukim.finki.mcptoolbackend.model.enums.SearchStatus;
import mk.ukim.finki.mcptoolbackend.model.exception.SearchRunNotFoundException;
import mk.ukim.finki.mcptoolbackend.repository.ResourceRepository;
import mk.ukim.finki.mcptoolbackend.repository.SearchRunRepository;
import mk.ukim.finki.mcptoolbackend.service.domain.SearchRunService;
import mk.ukim.finki.mcptoolbackend.source.FetchedResource;
import mk.ukim.finki.mcptoolbackend.source.SourceClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Runs searches against Macedonian Wikisource.
 *
 * <p>{@link #run} deliberately uses three short transactions instead of one:
 * (1) persist the RUNNING run, (2) call the website <em>outside</em> any
 * transaction (slow network I/O must not hold a DB connection), (3) persist
 * the resources and mark the run COMPLETED. If the fetch fails, the run is
 * marked FAILED in its own transaction, so the failure is visible in the UI
 * even though the exception is rethrown.</p>
 */
@Slf4j
@Service
public class SearchRunServiceImpl implements SearchRunService {
    /** Resources below this confidence are stored with language "und" (undetermined). */
    static final double MACEDONIAN_THRESHOLD = 0.5;
    private static final int MAX_TITLE_LENGTH = 255;

    private final SearchRunRepository searchRunRepository;
    private final ResourceRepository resourceRepository;
    private final SourceClient sourceClient;
    private final LanguageDetector languageDetector;
    private final TransactionTemplate transactionTemplate;

    public SearchRunServiceImpl(SearchRunRepository searchRunRepository,
                                ResourceRepository resourceRepository,
                                SourceClient sourceClient,
                                LanguageDetector languageDetector,
                                PlatformTransactionManager transactionManager) {
        this.searchRunRepository = searchRunRepository;
        this.resourceRepository = resourceRepository;
        this.sourceClient = sourceClient;
        this.languageDetector = languageDetector;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SearchRun> findAll() {
        return searchRunRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SearchRun> findById(Long id) {
        return searchRunRepository.findById(id);
    }

    @Override
    public SearchRun run(String query, int limit) {
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("Барањето за пребарување не смее да биде празно.");
        }

        Long runId = transactionTemplate.execute(status -> {
            SearchRun searchRun = new SearchRun(query.strip());
            searchRun.setStatus(SearchStatus.RUNNING);
            searchRun.setStartedAt(LocalDateTime.now());
            return searchRunRepository.save(searchRun).getId();
        });

        List<FetchedResource> fetched;
        try {
            fetched = sourceClient.search(query.strip(), limit);
        } catch (RuntimeException e) {
            log.warn("Search run {} ('{}') failed: {}", runId, query, e.getMessage());
            transactionTemplate.executeWithoutResult(status -> {
                SearchRun searchRun = load(runId);
                searchRun.setStatus(SearchStatus.FAILED);
                searchRun.setFinishedAt(LocalDateTime.now());
            });
            throw e;
        }

        return transactionTemplate.execute(status -> {
            SearchRun searchRun = load(runId);
            LocalDateTime now = LocalDateTime.now();
            for (FetchedResource item : fetched) {
                searchRun.getResources().add(toResource(searchRun, item, now));
            }
            searchRun.setResultCount(fetched.size());
            searchRun.setStatus(SearchStatus.COMPLETED);
            searchRun.setFinishedAt(now);
            return searchRunRepository.save(searchRun);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<Resource> findResources(Long searchRunId) {
        if (!searchRunRepository.existsById(searchRunId)) {
            throw new SearchRunNotFoundException(searchRunId);
        }
        return resourceRepository.findAllBySearchRunId(searchRunId);
    }

    private Resource toResource(SearchRun searchRun, FetchedResource item, LocalDateTime fetchedAt) {
        Resource resource = new Resource(
            searchRun,
            item.externalId(),
            truncate(item.title()),
            item.content(),
            item.sourceUrl()
        );
        double confidence = languageDetector.macedonianConfidence(item.content());
        resource.setMacedonianConfidence(confidence);
        resource.setLanguage(confidence >= MACEDONIAN_THRESHOLD ? "mk" : "und");
        resource.setWordCount(MacedonianText.words(item.content()).size());
        resource.setFetchedAt(fetchedAt);
        return resource;
    }

    private SearchRun load(Long id) {
        return searchRunRepository.findById(id).orElseThrow(() -> new SearchRunNotFoundException(id));
    }

    private static String truncate(String title) {
        if (title == null || title.length() <= MAX_TITLE_LENGTH) {
            return title;
        }
        return title.substring(0, MAX_TITLE_LENGTH - 1) + "…";
    }
}
