package mk.ukim.finki.mcptoolbackend.service.application;

import java.util.Optional;
import mk.ukim.finki.mcptoolbackend.model.dto.DisplayResourceDto;
import mk.ukim.finki.mcptoolbackend.model.dto.ResourceFilterDto;
import org.springframework.data.domain.Page;

/**
 * Application service for resources: maps between DTOs and entities and
 * delegates to {@code ResourceService}.
 */
public interface ResourceApplicationService {
    Page<DisplayResourceDto> findAll(ResourceFilterDto filter, int page, int size);

    Optional<DisplayResourceDto> findById(Long id);

    Optional<DisplayResourceDto> deleteById(Long id);

    Optional<DisplayResourceDto> analyze(Long id);
}
