package mk.ukim.finki.mcptoolbackend.mcp;

import mk.ukim.finki.mcptoolbackend.model.dto.DisplayResourceAnalysisDto;
import mk.ukim.finki.mcptoolbackend.model.dto.DisplayResourceDto;
import mk.ukim.finki.mcptoolbackend.model.exception.ResourceNotFoundException;
import mk.ukim.finki.mcptoolbackend.service.application.ResourceApplicationService;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

/**
 * MCP tool for the data-analysis step: extractive summary, keywords,
 * sentence/word counts and Macedonian-language confidence.
 */
@Service
public class ResourceAnalysisTool {
    private final ResourceApplicationService resourceApplicationService;
    private final ToolTrace toolTrace;

    public ResourceAnalysisTool(ResourceApplicationService resourceApplicationService, ToolTrace toolTrace) {
        this.resourceApplicationService = resourceApplicationService;
        this.toolTrace = toolTrace;
    }

    @Tool(name = "analyze_resource",
        description = "Run data analysis on a stored resource (summary, keywords, sentence/word counts and "
            + "Macedonian-language confidence) and return it enriched with the analysis.")
    public DisplayResourceDto analyzeResource(
        @ToolParam(description = "The id of the stored resource to analyze") Long id) {
        String arguments = ToolTrace.arguments("id", id);
        try {
            DisplayResourceDto resource = resourceApplicationService.analyze(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
            DisplayResourceAnalysisDto analysis = resource.analysis();
            String summary = analysis == null
                ? "анализирано"
                : "%s, %s, сигурност МК %s, клучни зборови: %s".formatted(
                    ToolTrace.sentences(analysis.sentenceCount()), ToolTrace.words(resource.wordCount()),
                    ToolTrace.percent(analysis.macedonianConfidence()), analysis.keywords());
            toolTrace.success("analyze_resource", arguments, summary, resource.searchRunId());
            return resource;
        } catch (RuntimeException e) {
            toolTrace.failure("analyze_resource", arguments, e);
            throw e;
        }
    }
}
