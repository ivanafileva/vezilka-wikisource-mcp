package mk.ukim.finki.mcptoolbackend.mcp;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import mk.ukim.finki.mcptoolbackend.model.dto.DisplayResourceDto;
import mk.ukim.finki.mcptoolbackend.model.dto.DisplayResourceSummaryDto;
import mk.ukim.finki.mcptoolbackend.model.dto.DisplaySearchRunDto;
import mk.ukim.finki.mcptoolbackend.model.dto.RunSearchRequestDto;
import mk.ukim.finki.mcptoolbackend.model.exception.ResourceNotFoundException;
import mk.ukim.finki.mcptoolbackend.service.application.ResourceApplicationService;
import mk.ukim.finki.mcptoolbackend.service.application.SearchRunApplicationService;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

/**
 * MCP tools for searching Macedonian Wikisource (mk.wikisource.org) and reading
 * the stored resources. Every invocation is recorded in the tool trace.
 */
@Service
public class ResourceSearchTool {
    private final SearchRunApplicationService searchRunApplicationService;
    private final ResourceApplicationService resourceApplicationService;
    private final ToolTrace toolTrace;

    public ResourceSearchTool(SearchRunApplicationService searchRunApplicationService,
                              ResourceApplicationService resourceApplicationService,
                              ToolTrace toolTrace) {
        this.searchRunApplicationService = searchRunApplicationService;
        this.resourceApplicationService = resourceApplicationService;
        this.toolTrace = toolTrace;
    }

    @Tool(name = "search_resources",
        description = "Search Macedonian Wikisource (Викизвор, mk.wikisource.org) - a library of public-domain "
            + "Macedonian texts: folk songs, poetry, prose, historical documents - for pages matching the query. "
            + "Each result is fetched as clean text, scored for Macedonian and stored. Returns the search run "
            + "(id, status, result count); call list_search_results with its id to see the stored resources.")
    public DisplaySearchRunDto searchResources(
        @ToolParam(description = "Free-text search query, best in Macedonian Cyrillic (e.g. 'Рацин', 'народни песни', 'Охрид')") String query,
        @ToolParam(description = "Maximum number of resources to fetch (default 10, max 25)", required = false) Integer limit) {
        Map<String, Object> args = new HashMap<>();
        args.put("query", query);
        args.put("limit", limit);
        String arguments = ToolTrace.arguments(args);
        try {
            DisplaySearchRunDto run = searchRunApplicationService
                .run(new RunSearchRequestDto(query, limit))
                .orElseThrow(() -> new IllegalArgumentException("Барањето за пребарување не смее да биде празно."));
            toolTrace.success("search_resources", arguments,
                "пребарување #%d %s: %s".formatted(run.id(), run.status().label(), ToolTrace.texts(run.resultCount())), run.id());
            return run;
        } catch (RuntimeException e) {
            toolTrace.failure("search_resources", arguments, e);
            throw e;
        }
    }

    @Tool(name = "list_search_results",
        description = "List the resources stored by a search run as compact summaries "
            + "(id, title, source URL, Macedonian confidence, word count, a short preview, analysis/donation state).")
    public List<DisplayResourceSummaryDto> listSearchResults(
        @ToolParam(description = "The id of the search run returned by search_resources") Long searchRunId) {
        String arguments = ToolTrace.arguments("searchRunId", searchRunId);
        try {
            List<DisplayResourceSummaryDto> results = searchRunApplicationService.findResources(searchRunId)
                .stream()
                .map(DisplayResourceSummaryDto::from)
                .toList();
            toolTrace.success("list_search_results", arguments, ToolTrace.texts(results.size()), searchRunId);
            return results;
        } catch (RuntimeException e) {
            toolTrace.failure("list_search_results", arguments, e);
            throw e;
        }
    }

    @Tool(name = "get_resource",
        description = "Fetch a single stored resource by its id, including its full text content, source URL, "
            + "Macedonian-language confidence and any analysis.")
    public DisplayResourceDto getResource(
        @ToolParam(description = "The id of the stored resource") Long id) {
        String arguments = ToolTrace.arguments("id", id);
        try {
            DisplayResourceDto resource = resourceApplicationService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
            toolTrace.success("get_resource", arguments,
                "„%s“ (%s)".formatted(resource.title(), ToolTrace.words(resource.wordCount())), resource.searchRunId());
            return resource;
        } catch (RuntimeException e) {
            toolTrace.failure("get_resource", arguments, e);
            throw e;
        }
    }
}
