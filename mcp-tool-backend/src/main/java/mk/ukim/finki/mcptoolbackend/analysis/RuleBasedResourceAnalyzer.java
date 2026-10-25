package mk.ukim.finki.mcptoolbackend.analysis;

import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import org.springframework.stereotype.Component;

/**
 * Rule-based, offline analyzer for Macedonian text (no external model needed).
 *
 * <ul>
 *   <li><b>Keywords</b> — term frequency over lower-cased words of 4+ letters,
 *       excluding Macedonian stop words; words from the title get a bonus.</li>
 *   <li><b>Summary</b> — extractive: every sentence is scored by the average
 *       keyword weight of its words (with a small bonus for the opening
 *       sentence), and the best {@value #SUMMARY_SENTENCES} sentences are
 *       returned in their original order, capped at {@value #SUMMARY_MAX_CHARS}
 *       characters.</li>
 *   <li><b>Statistics</b> — sentence count (stanzas count as sentences for
 *       verse) and word count.</li>
 * </ul>
 */
@Component
public class RuleBasedResourceAnalyzer implements ResourceAnalyzer {
    static final int KEYWORD_COUNT = 10;
    static final int SUMMARY_SENTENCES = 3;
    static final int SUMMARY_MAX_CHARS = 600;
    private static final int MIN_KEYWORD_LENGTH = 4;
    private static final int TITLE_BONUS = 2;

    @Override
    public AnalysisOutcome analyze(String title, String content) {
        String text = content == null ? "" : content;
        List<String> words = MacedonianText.words(text);
        List<String> sentences = MacedonianText.sentences(text);

        Map<String, Integer> frequencies = termFrequencies(words);
        for (String titleWord : MacedonianText.words(title)) {
            frequencies.computeIfPresent(titleWord, (word, count) -> count + TITLE_BONUS);
        }

        List<String> keywords = frequencies.entrySet()
            .stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(KEYWORD_COUNT)
            .map(Map.Entry::getKey)
            .toList();

        return new AnalysisOutcome(
            summarize(sentences, frequencies),
            keywords,
            sentences.size(),
            words.size()
        );
    }

    /** Frequencies of candidate keywords, in first-occurrence order (stable tie-breaking). */
    private Map<String, Integer> termFrequencies(List<String> words) {
        Map<String, Integer> frequencies = new LinkedHashMap<>();
        for (String word : words) {
            if (word.codePointCount(0, word.length()) >= MIN_KEYWORD_LENGTH && !MacedonianText.STOP_WORDS.contains(word)) {
                frequencies.merge(word, 1, Integer::sum);
            }
        }
        return frequencies;
    }

    private String summarize(List<String> sentences, Map<String, Integer> frequencies) {
        if (sentences.isEmpty()) {
            return "";
        }
        if (sentences.size() <= SUMMARY_SENTENCES) {
            return truncate(String.join(" ", sentences));
        }

        Map<Integer, Double> scores = new HashMap<>();
        for (int i = 0; i < sentences.size(); i++) {
            List<String> words = MacedonianText.words(sentences.get(i));
            if (words.isEmpty()) {
                scores.put(i, 0.0);
                continue;
            }
            double weight = words.stream().mapToInt(w -> frequencies.getOrDefault(w, 0)).sum();
            // Normalise by length with a square root so very short and very long sentences are not favoured.
            double score = weight / Math.sqrt(words.size());
            if (i == 0) {
                score *= 1.25;
            }
            scores.put(i, score);
        }

        List<Integer> chosen = IntStream.range(0, sentences.size())
            .boxed()
            .sorted(Comparator.comparingDouble((Integer i) -> scores.get(i)).reversed())
            .limit(SUMMARY_SENTENCES)
            .sorted()
            .toList();

        StringBuilder summary = new StringBuilder();
        for (Integer index : chosen) {
            if (!summary.isEmpty()) {
                summary.append(' ');
            }
            summary.append(sentences.get(index));
        }
        return truncate(summary.toString());
    }

    private String truncate(String text) {
        if (text.length() <= SUMMARY_MAX_CHARS) {
            return text;
        }
        int cut = text.lastIndexOf(' ', SUMMARY_MAX_CHARS - 1);
        return text.substring(0, cut > 0 ? cut : SUMMARY_MAX_CHARS - 1) + "…";
    }
}
