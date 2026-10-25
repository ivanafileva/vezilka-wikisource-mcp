package mk.ukim.finki.mcptoolbackend.analysis;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Shared, dependency-free text utilities for Macedonian: tokenization,
 * sentence splitting and a stop-word list. Used by both
 * {@link MacedonianLanguageDetector} and {@link RuleBasedResourceAnalyzer}.
 */
public final class MacedonianText {
    public static final Locale MK = Locale.forLanguageTag("mk");

    /** Letters that exist in the Macedonian alphabet but not in Russian/Bulgarian. */
    public static final String MACEDONIAN_SPECIFIC_LETTERS = "ѓѕјљњќџЃЅЈЉЊЌЏ";

    /** Cyrillic letters that do NOT exist in the Macedonian alphabet (Serbian, Bulgarian, Russian, Ukrainian). */
    public static final String NON_MACEDONIAN_CYRILLIC_LETTERS = "ћђщъьыэёйяюєїґЋЂЩЪЬЫЭЁЙЯЮЄЇҐ";

    /**
     * Frequent Macedonian function words (prepositions, conjunctions, pronouns,
     * auxiliaries and particles). Duplicates are tolerated. Excluded from keywords; their frequency is
     * also a strong language signal.
     */
    public static final Set<String> STOP_WORDS = Set.copyOf(List.of(
        "и", "а", "но", "или", "ни", "да", "не", "ќе", "би", "се", "си", "ме", "те", "го", "ја", "ги", "му",
        "ѝ", "им", "ми", "ти", "нè", "ве", "ние", "вие", "тие", "тој", "таа", "тоа", "јас", "ти", "оној",
        "онаа", "она", "оние", "овој", "оваа", "ова", "овие", "на", "во", "од", "со", "за", "по", "до", "пред",
        "зад", "меѓу", "над", "под", "кон", "без", "при", "преку", "низ", "околу", "крај", "како", "што",
        "кој", "која", "кое", "кои", "каде", "кога", "зашто", "затоа", "дека", "ако", "иако", "туку", "па",
        "пак", "уште", "веќе", "само", "сè", "сите", "секој", "секоја", "нешто", "ништо", "некој", "никој",
        "е", "сум", "сме", "сте", "се", "беше", "беа", "бил", "била", "биле", "било", "бев", "има", "имаше",
        "нема", "немаше", "ли", "ми", "мој", "моја", "мое", "мои", "твој", "твоја", "негов", "нејзин",
        "нивен", "наш", "ваш", "свој", "своја", "свое", "свои", "тука", "таму", "сега", "тогаш", "многу",
        "малку", "јас", "еве", "ете", "ах", "ох", "бидејќи", "додека", "откако", "штом", "така", "толку",
        "исто", "дури", "токму", "нив", "него", "неа", "нас", "вас", "мене", "тебе", "себе", "го", "оти"
    ));

    private static final Pattern WORD = Pattern.compile("\\p{L}+(?:['’]\\p{L}+)*");
    private static final Pattern SENTENCE_BOUNDARY = Pattern.compile("(?<=[.!?…])\\s+|\\n\\s*\\n");

    private MacedonianText() {
    }

    /** Lower-cased word tokens (letters only; apostrophes inside words are kept). */
    public static List<String> words(String text) {
        List<String> words = new ArrayList<>();
        if (text == null) {
            return words;
        }
        Matcher matcher = WORD.matcher(text);
        while (matcher.find()) {
            words.add(matcher.group().toLowerCase(MK));
        }
        return words;
    }

    /**
     * Splits text into sentences on terminal punctuation or blank lines. Verse
     * (common on Wikisource) often has no punctuation, so each stanza separated
     * by a blank line counts as one unit.
     */
    public static List<String> sentences(String text) {
        List<String> sentences = new ArrayList<>();
        if (text == null) {
            return sentences;
        }
        for (String part : SENTENCE_BOUNDARY.split(text.strip())) {
            String sentence = part.replaceAll("\\s+", " ").strip();
            if (!sentence.isEmpty() && WORD.matcher(sentence).find()) {
                sentences.add(sentence);
            }
        }
        return sentences;
    }

    public static boolean isCyrillic(int codePoint) {
        return Character.UnicodeScript.of(codePoint) == Character.UnicodeScript.CYRILLIC;
    }
}
