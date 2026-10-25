package mk.ukim.finki.mcptoolbackend.mcp;

import java.util.List;
import mk.ukim.finki.mcptoolbackend.model.dto.CreateDonationBatchDto;
import mk.ukim.finki.mcptoolbackend.model.dto.DisplayDonationBatchDto;
import mk.ukim.finki.mcptoolbackend.service.application.DonationApplicationService;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

/**
 * MCP tool for donating a resource to doniraj.vezilka.ai. Runs the whole
 * DRAFT -> APPROVED -> SUBMITTED workflow for a single resource.
 */
@Service
public class DonationTool {
    private final DonationApplicationService donationApplicationService;
    private final ToolTrace toolTrace;

    public DonationTool(DonationApplicationService donationApplicationService, ToolTrace toolTrace) {
        this.donationApplicationService = donationApplicationService;
        this.toolTrace = toolTrace;
    }

    @Tool(name = "donate_resource",
        description = "Donate a single stored resource to doniraj.vezilka.ai by creating a donation batch, "
            + "approving it and submitting it. Only donate texts that are clearly Macedonian (confidence >= 0.5) "
            + "and public domain / freely licensed on Wikisource. Returns the resulting donation batch with its "
            + "Vezilka reference.")
    public DisplayDonationBatchDto donateResource(
        @ToolParam(description = "The id of the stored resource to donate") Long id) {
        String arguments = ToolTrace.arguments("id", id);
        try {
            if (id == null) {
                throw new IllegalArgumentException("Потребен е ид на текстот.");
            }
            DisplayDonationBatchDto draft = donationApplicationService
                .create(new CreateDonationBatchDto(List.of(id)))
                .orElseThrow(() -> new IllegalArgumentException("Потребен е ид на текстот."));
            donationApplicationService.approve(draft.id());
            DisplayDonationBatchDto submitted = donationApplicationService.submit(draft.id()).orElseThrow();
            toolTrace.success("donate_resource", arguments,
                "пакет #%d %s, референца %s".formatted(submitted.id(), submitted.status().label(), submitted.vezilkaReference()),
                null);
            return submitted;
        } catch (RuntimeException e) {
            toolTrace.failure("donate_resource", arguments, e);
            throw e;
        }
    }
}
