package mk.ukim.finki.mcptoolbackend.service.application.impl;

import java.util.Optional;
import mk.ukim.finki.mcptoolbackend.model.dto.DisplayResourceDto;
import mk.ukim.finki.mcptoolbackend.model.dto.ResourceFilterDto;
import mk.ukim.finki.mcptoolbackend.service.application.ResourceApplicationService;
import mk.ukim.finki.mcptoolbackend.service.domain.ResourceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResourceApplicationServiceImpl implements ResourceApplicationService {
    private static final int MAX_PAGE_SIZE = 100;

    private final ResourceService resourceService;

    public ResourceApplicationServiceImpl(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DisplayResourceDto> findAll(ResourceFilterDto filter, int page, int size) {
        PageRequest pageable = PageRequest.of(
            Math.max(0, page),
            Math.min(Math.max(1, size), MAX_PAGE_SIZE),
            Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
        );
        return resourceService.findAll(filter, pageable).map(DisplayResourceDto::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DisplayResourceDto> findById(Long id) {
        return resourceService.findById(id).map(DisplayResourceDto::from);
    }

    @Override
    @Transactional
    public Optional<DisplayResourceDto> deleteById(Long id) {
        return resourceService.deleteById(id).map(DisplayResourceDto::from);
    }

    @Override
    @Transactional
    public Optional<DisplayResourceDto> analyze(Long id) {
        return Optional.of(DisplayResourceDto.from(resourceService.analyze(id)));
    }
}
