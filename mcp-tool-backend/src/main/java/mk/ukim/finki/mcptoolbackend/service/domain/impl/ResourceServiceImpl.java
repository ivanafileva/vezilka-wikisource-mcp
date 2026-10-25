package mk.ukim.finki.mcptoolbackend.service.domain.impl;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import mk.ukim.finki.mcptoolbackend.analysis.AnalysisOutcome;
import mk.ukim.finki.mcptoolbackend.analysis.LanguageDetector;
import mk.ukim.finki.mcptoolbackend.analysis.ResourceAnalyzer;
import mk.ukim.finki.mcptoolbackend.model.domain.Resource;
import mk.ukim.finki.mcptoolbackend.model.domain.ResourceAnalysis;
import mk.ukim.finki.mcptoolbackend.model.dto.ResourceFilterDto;
import mk.ukim.finki.mcptoolbackend.model.exception.ResourceNotFoundException;
import mk.ukim.finki.mcptoolbackend.repository.ResourceRepository;
import mk.ukim.finki.mcptoolbackend.service.domain.ResourceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Paged/filtered browsing of collected Wikisource texts and the analysis step.
 * Filtering is built from composable {@link Specification}s — one per non-null
 * field of the {@link ResourceFilterDto}.
 */
@Service
public class ResourceServiceImpl implements ResourceService {
    private final ResourceRepository resourceRepository;
    private final ResourceAnalyzer resourceAnalyzer;
    private final LanguageDetector languageDetector;

    public ResourceServiceImpl(ResourceRepository resourceRepository,
                               ResourceAnalyzer resourceAnalyzer,
                               LanguageDetector languageDetector) {
        this.resourceRepository = resourceRepository;
        this.resourceAnalyzer = resourceAnalyzer;
        this.languageDetector = languageDetector;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> findAll(ResourceFilterDto filter, Pageable pageable) {
        return resourceRepository.findAll(toSpecification(filter), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Resource> findById(Long id) {
        return resourceRepository.findById(id);
    }

    @Override
    @Transactional
    public Optional<Resource> deleteById(Long id) {
        Optional<Resource> resource = resourceRepository.findById(id);
        resource.ifPresent(r -> {
            Integer count = r.getSearchRun().getResultCount();
            r.getSearchRun().setResultCount(count == null ? 0 : Math.max(0, count - 1));
            resourceRepository.delete(r);
        });
        return resource;
    }

    @Override
    @Transactional
    public Resource analyze(Long id) {
        Resource resource = resourceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(id));

        AnalysisOutcome outcome = resourceAnalyzer.analyze(resource.getTitle(), resource.getContent());
        double confidence = languageDetector.macedonianConfidence(resource.getContent());

        ResourceAnalysis analysis = resource.getAnalysis();
        if (analysis == null) {
            analysis = new ResourceAnalysis(resource);
            resource.setAnalysis(analysis);
        }
        analysis.setSummary(outcome.summary());
        analysis.setKeywords(outcome.keywords() == null ? null : String.join(", ", outcome.keywords()));
        analysis.setSentenceCount(outcome.sentenceCount());
        analysis.setMacedonianConfidence(confidence);
        analysis.setAnalyzedAt(LocalDateTime.now());

        resource.setWordCount(outcome.wordCount());
        resource.setMacedonianConfidence(confidence);
        resource.setLanguage(confidence >= SearchRunServiceImpl.MACEDONIAN_THRESHOLD ? "mk" : "und");

        return resourceRepository.save(resource);
    }

    static Specification<Resource> toSpecification(ResourceFilterDto filter) {
        Specification<Resource> spec = (root, query, cb) -> cb.conjunction();
        if (filter == null) {
            return spec;
        }
        if (filter.searchRunId() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("searchRun").get("id"), filter.searchRunId()));
        }
        if (filter.minMacedonianConfidence() != null) {
            spec = spec.and((root, query, cb) ->
                cb.greaterThanOrEqualTo(root.<Double>get("macedonianConfidence"), filter.minMacedonianConfidence()));
        }
        if (filter.analyzed() != null) {
            spec = spec.and((root, query, cb) -> {
                Join<Resource, ResourceAnalysis> analysis = root.join("analysis", JoinType.LEFT);
                return filter.analyzed() ? cb.isNotNull(analysis.get("id")) : cb.isNull(analysis.get("id"));
            });
        }
        if (filter.donated() != null) {
            spec = spec.and((root, query, cb) ->
                filter.donated() ? cb.isNotNull(root.get("donationBatch")) : cb.isNull(root.get("donationBatch")));
        }
        if (filter.search() != null && !filter.search().isBlank()) {
            String pattern = "%" + filter.search().strip().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.<String>get("title")), pattern),
                cb.like(cb.lower(root.<String>get("content")), pattern)
            ));
        }
        return spec;
    }
}
