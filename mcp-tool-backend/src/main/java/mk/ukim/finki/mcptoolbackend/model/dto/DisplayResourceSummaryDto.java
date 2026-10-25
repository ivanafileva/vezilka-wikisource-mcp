package mk.ukim.finki.mcptoolbackend.model.dto;

import java.util.List;
import mk.ukim.finki.mcptoolbackend.model.domain.Resource;

/**
 * A compact view of a {@link Resource} for MCP agents: everything needed to
 * pick a text (id, title, provenance, language confidence, size and a short
 * preview) without sending full Wikisource pages into the model's context.
 * Use {@code get_resource} for the full content.
 */
public record DisplayResourceSummaryDto(
    Long id,
    String title,
    String sourceUrl,
    String language,
    Double macedonianConfidence,
    Integer wordCount,
    String preview,
    boolean analyzed,
    Long donationBatchId
) {
    static final int PREVIEW_CHARS = 280;

    public static DisplayResourceSummaryDto from(Resource resource) {
        return new DisplayResourceSummaryDto(
            resource.getId(),
            resource.getTitle(),
            resource.getSourceUrl(),
            resource.getLanguage(),
            resource.getMacedonianConfidence(),
            resource.getWordCount(),
            preview(resource.getContent()),
            resource.getAnalysis() != null,
            resource.getDonationBatch() == null ? null : resource.getDonationBatch().getId()
        );
    }

    public static List<DisplayResourceSummaryDto> from(List<Resource> resources) {
        return resources
            .stream()
            .map(DisplayResourceSummaryDto::from)
            .toList();
    }

    public static DisplayResourceSummaryDto from(DisplayResourceDto resource) {
        return new DisplayResourceSummaryDto(
            resource.id(),
            resource.title(),
            resource.sourceUrl(),
            resource.language(),
            resource.macedonianConfidence(),
            resource.wordCount(),
            preview(resource.content()),
            resource.analysis() != null,
            resource.donationBatchId()
        );
    }

    private static String preview(String content) {
        if (content == null) {
            return null;
        }
        String flat = content.replaceAll("\\s+", " ").strip();
        return flat.length() <= PREVIEW_CHARS ? flat : flat.substring(0, PREVIEW_CHARS) + "…";
    }
}
