package mk.ukim.finki.mcptoolbackend.mcp;

import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import mk.ukim.finki.mcptoolbackend.model.domain.SearchRun;
import mk.ukim.finki.mcptoolbackend.service.domain.SearchRunService;
import mk.ukim.finki.mcptoolbackend.service.domain.ToolInvocationLogService;
import org.springframework.stereotype.Component;

/**
 * Records MCP tool invocations through the provided
 * {@link ToolInvocationLogService}. It resolves the related search run by id,
 * so the tool classes only work with DTOs and ids, never with JPA entities.
 */
@Component
public class ToolTrace {
    private final ToolInvocationLogService toolInvocationLogService;
    private final SearchRunService searchRunService;

    public ToolTrace(ToolInvocationLogService toolInvocationLogService, SearchRunService searchRunService) {
        this.toolInvocationLogService = toolInvocationLogService;
        this.searchRunService = searchRunService;
    }

    public void success(String toolName, String arguments, String resultSummary, Long searchRunId) {
        toolInvocationLogService.log(toolName, arguments, resultSummary, true, searchRun(searchRunId));
    }

    public void failure(String toolName, String arguments, Throwable error) {
        String message = error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
        toolInvocationLogService.log(toolName, arguments, "НЕУСПЕШНО: " + message, false, null);
    }

    /** "1 текст", "5 текстови" - for the Macedonian result summaries. */
    public static String texts(Number count) {
        long n = count == null ? 0 : count.longValue();
        return n + (n == 1 ? " текст" : " текстови");
    }

    /** "1 збор", "64 зборови". */
    public static String words(Number count) {
        long n = count == null ? 0 : count.longValue();
        return n + (n == 1 ? " збор" : " зборови");
    }

    /** "1 реченица", "15 реченици". */
    public static String sentences(Number count) {
        long n = count == null ? 0 : count.longValue();
        return n + (n == 1 ? " реченица" : " реченици");
    }

    /** A 0..1 confidence as a whole percentage, e.g. "99%". */
    public static String percent(Double confidence) {
        return confidence == null ? "?" : Math.round(confidence * 100) + "%";
    }

    /** Single-argument shortcut (null-safe, unlike {@code Map.of}). */
    public static String arguments(String key, Object value) {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put(key, value);
        return arguments(arguments);
    }

    /** Renders tool arguments as a compact, deterministic JSON-like string for the trace. */
    public static String arguments(Map<String, Object> arguments) {
        return new TreeMap<>(arguments).entrySet()
            .stream()
            .map(e -> "\"%s\":%s".formatted(e.getKey(), render(e.getValue())))
            .collect(Collectors.joining(",", "{", "}"));
    }

    private SearchRun searchRun(Long searchRunId) {
        return searchRunId == null ? null : searchRunService.findById(searchRunId).orElse(null);
    }

    private static String render(Object value) {
        if (value == null) {
            return "null";
        }
        if (value instanceof Number || value instanceof Boolean) {
            return value.toString();
        }
        return "\"" + value.toString().replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
