package mk.ukim.finki.mcptoolbackend.service.application;

import java.util.List;
import java.util.Optional;
import mk.ukim.finki.mcptoolbackend.model.dto.CreateDonationBatchDto;
import mk.ukim.finki.mcptoolbackend.model.dto.DisplayDonationBatchDto;

/**
 * Application service for donations: maps between DTOs and entities and
 * delegates to {@code DonationService}.
 */
public interface DonationApplicationService {
    List<DisplayDonationBatchDto> findAll();

    Optional<DisplayDonationBatchDto> findById(Long id);

    Optional<DisplayDonationBatchDto> create(CreateDonationBatchDto request);

    Optional<DisplayDonationBatchDto> approve(Long id);

    Optional<DisplayDonationBatchDto> submit(Long id);
}
