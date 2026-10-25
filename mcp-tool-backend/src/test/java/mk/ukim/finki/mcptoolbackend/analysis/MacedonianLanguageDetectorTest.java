package mk.ukim.finki.mcptoolbackend.analysis;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Plain unit tests - no Spring context or Docker needed. */
class MacedonianLanguageDetectorTest {
    private final MacedonianLanguageDetector detector = new MacedonianLanguageDetector();

    @Test
    void macedonianProseScoresHigh() {
        String text = "Македонскиот јазик е јужнословенски јазик што се зборува во Северна Македонија. "
            + "Тој е службен јазик на државата и се пишува со кирилско писмо, кое има триесет и една буква, "
            + "меѓу кои се ѓ, ѕ, ј, љ, њ, ќ и џ.";
        assertThat(detector.macedonianConfidence(text)).isGreaterThan(0.8);
    }

    @Test
    void macedonianVerseScoresHigh() {
        String verse = """
            Ленка, Ленка, мори Ленке,
            што ќе правиш кога ќе се жениш,
            кога ќе дојдат сватовите
            да те земат од мајка ти.
            """;
        assertThat(detector.macedonianConfidence(verse)).isGreaterThan(0.7);
    }

    @Test
    void otherCyrillicLanguagesScoreLower() {
        String bulgarian = "Българският език е индоевропейски език от групата на южнославянските езици. "
            + "Той е официалният език на Република България и един от официалните езици на Европейския съюз.";
        String russian = "Русский язык является одним из восточнославянских языков, национальный язык русского народа. "
            + "Он является одним из наиболее распространённых языков мира.";
        String serbian = "Српски језик је званични језик у Србији, Босни и Херцеговини и Црној Гори и говори га око "
            + "дванаест милиона људи. Ћирилица и латиница се подједнако користе.";

        assertThat(detector.macedonianConfidence(bulgarian)).isLessThan(0.5);
        assertThat(detector.macedonianConfidence(russian)).isLessThan(0.5);
        assertThat(detector.macedonianConfidence(serbian)).isLessThan(0.5);
    }

    @Test
    void latinScriptAndEmptyTextScoreZero() {
        assertThat(detector.macedonianConfidence("The quick brown fox jumps over the lazy dog.")).isZero();
        assertThat(detector.macedonianConfidence("")).isZero();
        assertThat(detector.macedonianConfidence(null)).isZero();
    }
}
