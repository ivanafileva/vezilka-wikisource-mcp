package mk.ukim.finki.mcptoolbackend.analysis;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RuleBasedResourceAnalyzerTest {
    private final RuleBasedResourceAnalyzer analyzer = new RuleBasedResourceAnalyzer();

    private static final String TEXT = "Охрид е град во југозападна Македонија. Охрид лежи на брегот на Охридското Езеро. "
        + "Езерото е едно од најстарите езера во Европа. Градот Охрид е познат по црквите и манастирите. "
        + "Во Охрид работел Свети Климент Охридски. Туристите секое лето доаѓаат на езерото.";

    @Test
    void extractsKeywordsWithoutStopWords() {
        AnalysisOutcome outcome = analyzer.analyze("Охрид", TEXT);

        assertThat(outcome.keywords()).isNotEmpty().hasSizeLessThanOrEqualTo(RuleBasedResourceAnalyzer.KEYWORD_COUNT);
        assertThat(outcome.keywords().getFirst()).isEqualTo("охрид");
        assertThat(outcome.keywords()).doesNotContain("на", "во", "е", "од");
    }

    @Test
    void countsSentencesAndWords() {
        AnalysisOutcome outcome = analyzer.analyze("Охрид", TEXT);

        assertThat(outcome.sentenceCount()).isEqualTo(6);
        assertThat(outcome.wordCount()).isEqualTo(MacedonianText.words(TEXT).size());
    }

    @Test
    void summaryIsExtractiveAndBounded() {
        AnalysisOutcome outcome = analyzer.analyze("Охрид", TEXT);

        assertThat(outcome.summary()).isNotBlank();
        assertThat(outcome.summary().length()).isLessThanOrEqualTo(RuleBasedResourceAnalyzer.SUMMARY_MAX_CHARS);
        assertThat(MacedonianText.sentences(outcome.summary())).hasSize(RuleBasedResourceAnalyzer.SUMMARY_SENTENCES);
        MacedonianText.sentences(outcome.summary()).forEach(sentence -> assertThat(TEXT).contains(sentence));
    }

    @Test
    void stanzasCountAsSentences() {
        String verse = "Ленка, Ленка, мори Ленке\nшто ќе правиш\n\nкога ќе дојдат сватовите\nда те земат";
        assertThat(analyzer.analyze(null, verse).sentenceCount()).isEqualTo(2);
    }

    @Test
    void handlesEmptyContent() {
        AnalysisOutcome outcome = analyzer.analyze(null, "");
        assertThat(outcome.summary()).isEmpty();
        assertThat(outcome.keywords()).isEmpty();
        assertThat(outcome.sentenceCount()).isZero();
        assertThat(outcome.wordCount()).isZero();
    }
}
