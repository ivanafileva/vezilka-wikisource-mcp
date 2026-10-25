package mk.ukim.finki.mcptoolbackend.analysis;

/**
 * The data-analysis seam of the MCP tool: turns a resource's raw text into a
 * summary, keywords and simple statistics.
 *
 * <p>Deliberately provider-agnostic: the current implementation,
 * {@code RuleBasedResourceAnalyzer}, works offline (tokenizing, stop-word
 * filtering, frequency-based keywords, extractive summary); a language-model
 * implementation could replace it without touching the callers.</p>
 */
public interface ResourceAnalyzer {
    /**
     * Analyzes the given resource text.
     *
     * @param title   the resource title (may be null)
     * @param content the resource's text content
     */
    AnalysisOutcome analyze(String title, String content);
}
