package mk.ukim.finki.mcptoolbackend.service.application.impl;

import java.util.List;
import java.util.Optional;
import mk.ukim.finki.mcptoolbackend.model.dto.DisplayResourceDto;
import mk.ukim.finki.mcptoolbackend.model.dto.DisplaySearchRunDto;
import mk.ukim.finki.mcptoolbackend.model.dto.RunSearchRequestDto;
import mk.ukim.finki.mcptoolbackend.service.application.SearchRunApplicationService;
import mk.ukim.finki.mcptoolbackend.service.domain.SearchRunService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SearchRunApplicationServiceImpl implements SearchRunApplicationService {
    static final int DEFAULT_LIMIT = 10;
    static final int MAX_LIMIT = 25;

    private final SearchRunService searchRunService;

    public SearchRunApplicationServiceImpl(SearchRunService searchRunService) {
        this.searchRunService = searchRunService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DisplaySearchRunDto> findAll() {
        return DisplaySearchRunDto.from(searchRunService.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DisplaySearchRunDto> findById(Long id) {
        return searchRunService.findById(id).map(DisplaySearchRunDto::from);
    }

    /**
     * Not transactional on purpose: the domain service manages its own short
     * transactions around the (slow) call to the website.
     */
    @Override
    public Optional<DisplaySearchRunDto> run(RunSearchRequestDto request) {
        if (request == null || request.query() == null || request.query().isBlank()) {
            return Optional.empty();
        }
        return Optional.of(DisplaySearchRunDto.from(searchRunService.run(request.query(), normaliseLimit(request.limit()))));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DisplayResourceDto> findResources(Long searchRunId) {
        return DisplayResourceDto.from(searchRunService.findResources(searchRunId));
    }

    /** null / non-positive -> {@value #DEFAULT_LIMIT}; capped at {@value #MAX_LIMIT} to stay polite to Wikisource. */
    static int normaliseLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }
}
