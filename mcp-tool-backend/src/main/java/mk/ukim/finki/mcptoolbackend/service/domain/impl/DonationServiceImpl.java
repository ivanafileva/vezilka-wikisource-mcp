package mk.ukim.finki.mcptoolbackend.service.domain.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import mk.ukim.finki.mcptoolbackend.integration.vezilka.DonationReceipt;
import mk.ukim.finki.mcptoolbackend.integration.vezilka.TextDonationRequest;
import mk.ukim.finki.mcptoolbackend.integration.vezilka.VezilkaClient;
import mk.ukim.finki.mcptoolbackend.model.domain.DonationBatch;
import mk.ukim.finki.mcptoolbackend.model.domain.Resource;
import mk.ukim.finki.mcptoolbackend.model.enums.DonationStatus;
import mk.ukim.finki.mcptoolbackend.model.exception.DonationBatchNotFoundException;
import mk.ukim.finki.mcptoolbackend.model.exception.InvalidDonationStateException;
import mk.ukim.finki.mcptoolbackend.model.exception.ResourceNotFoundException;
import mk.ukim.finki.mcptoolbackend.model.exception.VezilkaIntegrationException;
import mk.ukim.finki.mcptoolbackend.repository.DonationBatchRepository;
import mk.ukim.finki.mcptoolbackend.repository.ResourceRepository;
import mk.ukim.finki.mcptoolbackend.service.domain.DonationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The donation workflow: DRAFT -> APPROVED -> SUBMITTED -> ACCEPTED | REJECTED,
 * with FAILED when Vezilka cannot be reached (a FAILED batch can be submitted again).
 *
 * <p>On submit, every resource in the batch is sent as its own
 * {@link TextDonationRequest} (one Wikisource text = one donation, with its
 * source URL for provenance). The Vezilka references are stored on the batch
 * as a comma-separated list; the batch status is the aggregate of the
 * statuses of its donations.</p>
 */
@Slf4j
@Service
public class DonationServiceImpl implements DonationService {
    static final String REFERENCE_SEPARATOR = ",";

    private final DonationBatchRepository donationBatchRepository;
    private final ResourceRepository resourceRepository;
    private final VezilkaClient vezilkaClient;

    public DonationServiceImpl(DonationBatchRepository donationBatchRepository,
                               ResourceRepository resourceRepository,
                               VezilkaClient vezilkaClient) {
        this.donationBatchRepository = donationBatchRepository;
        this.resourceRepository = resourceRepository;
        this.vezilkaClient = vezilkaClient;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DonationBatch> findAll() {
        return donationBatchRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DonationBatch> findById(Long id) {
        return donationBatchRepository.findById(id);
    }

    @Override
    @Transactional
    public DonationBatch create(List<Long> resourceIds) {
        if (resourceIds == null || resourceIds.isEmpty()) {
            throw new IllegalArgumentException("Пакетот за донација мора да содржи барем еден текст.");
        }
        Set<Long> ids = new LinkedHashSet<>(resourceIds);
        List<Resource> resources = resourceRepository.findAllByIdIn(new ArrayList<>(ids));

        Set<Long> found = new HashSet<>();
        resources.forEach(r -> found.add(r.getId()));
        ids.stream()
            .filter(id -> !found.contains(id))
            .findFirst()
            .ifPresent(id -> {
                throw new ResourceNotFoundException(id);
            });

        for (Resource resource : resources) {
            DonationBatch existing = resource.getDonationBatch();
            if (existing != null) {
                // The resource is already part of another batch.
                throw new InvalidDonationStateException(existing.getId(), existing.getStatus());
            }
        }

        DonationBatch batch = donationBatchRepository.save(new DonationBatch(DonationStatus.DRAFT));
        for (Resource resource : resources) {
            resource.setDonationBatch(batch);
            batch.getResources().add(resource);
        }
        return batch;
    }

    @Override
    @Transactional
    public DonationBatch approve(Long id) {
        DonationBatch batch = load(id);
        requireStatus(batch, DonationStatus.DRAFT);
        batch.setStatus(DonationStatus.APPROVED);
        return batch;
    }

    @Override
    @Transactional(noRollbackFor = VezilkaIntegrationException.class)
    public DonationBatch submit(Long id) {
        DonationBatch batch = load(id);
        // FAILED batches may be re-submitted (e.g. after Vezilka was unreachable).
        if (batch.getStatus() != DonationStatus.APPROVED && batch.getStatus() != DonationStatus.FAILED) {
            throw new InvalidDonationStateException(batch.getId(), batch.getStatus());
        }

        List<String> references = new ArrayList<>();
        try {
            for (Resource resource : batch.getResources()) {
                DonationReceipt receipt = vezilkaClient.submitTextDonation(new TextDonationRequest(
                    resource.getTitle(),
                    resource.getContent(),
                    resource.getSourceUrl()
                ));
                references.add(receipt.reference());
            }
        } catch (VezilkaIntegrationException e) {
            log.warn("Submitting donation batch {} failed: {}", id, e.getMessage());
            batch.setStatus(DonationStatus.FAILED);
            batch.setVezilkaReference(references.isEmpty() ? null : String.join(REFERENCE_SEPARATOR, references));
            throw e;
        }

        batch.setVezilkaReference(String.join(REFERENCE_SEPARATOR, references));
        batch.setSubmittedAt(LocalDateTime.now());
        batch.setStatus(DonationStatus.SUBMITTED);
        return batch;
    }

    @Override
    @Transactional
    public void refreshSubmittedStatuses() {
        for (DonationBatch batch : donationBatchRepository.findAllByStatus(DonationStatus.SUBMITTED)) {
            try {
                DonationStatus status = aggregate(batch.getVezilkaReference());
                if (status != batch.getStatus()) {
                    log.info("Donation batch {}: {} -> {}", batch.getId(), batch.getStatus(), status);
                    batch.setStatus(status);
                }
            } catch (VezilkaIntegrationException e) {
                // Keep it SUBMITTED and retry on the next run.
                log.warn("Could not refresh donation batch {}: {}", batch.getId(), e.getMessage());
            }
        }
    }

    /**
     * All ACCEPTED -> ACCEPTED; any REJECTED -> REJECTED; any FAILED -> FAILED;
     * otherwise still SUBMITTED.
     */
    private DonationStatus aggregate(String references) {
        if (references == null || references.isBlank()) {
            return DonationStatus.FAILED;
        }
        List<DonationStatus> statuses = Arrays.stream(references.split(REFERENCE_SEPARATOR))
            .map(String::strip)
            .filter(ref -> !ref.isEmpty())
            .map(vezilkaClient::checkStatus)
            .toList();
        if (statuses.contains(DonationStatus.REJECTED)) {
            return DonationStatus.REJECTED;
        }
        if (statuses.contains(DonationStatus.FAILED)) {
            return DonationStatus.FAILED;
        }
        if (!statuses.isEmpty() && statuses.stream().allMatch(s -> s == DonationStatus.ACCEPTED)) {
            return DonationStatus.ACCEPTED;
        }
        return DonationStatus.SUBMITTED;
    }

    private DonationBatch load(Long id) {
        return donationBatchRepository.findById(id).orElseThrow(() -> new DonationBatchNotFoundException(id));
    }

    private static void requireStatus(DonationBatch batch, DonationStatus expected) {
        if (batch.getStatus() != expected) {
            throw new InvalidDonationStateException(batch.getId(), batch.getStatus());
        }
    }
}
