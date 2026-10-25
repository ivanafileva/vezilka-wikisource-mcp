package mk.ukim.finki.mcptoolbackend.analysis;

import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Heuristic Macedonian-language detector combining three signals:
 *
 * <ol>
 *   <li><b>Script</b> — the share of letters that are Cyrillic;</li>
 *   <li><b>Macedonian evidence</b> — letters unique to the Macedonian alphabet
 *       (ѓ, ѕ, ј, љ, њ, ќ, џ) and the density of Macedonian function words
 *       (и, на, во, се, да, што, ќе ...);</li>
 *   <li><b>Counter-evidence</b> — Cyrillic letters that do not exist in
 *       Macedonian (ћ, ђ from Serbian; щ, ъ, ь, я, ю, й from Bulgarian/Russian).</li>
 * </ol>
 *
 * <p>confidence = cyrillicShare × (0.3 + 0.7 × macedonianEvidence) × (1 − foreignPenalty),
 * clamped to [0, 1]. Typical Macedonian prose scores 0.85–1.0, Serbian and
 * Bulgarian texts fall well below 0.5, Latin-script text scores ~0.</p>
 */
@Component
public class MacedonianLanguageDetector implements LanguageDetector {
    /** Below this many letters the estimate is dampened (too little evidence). */
    private static final int MIN_LETTERS_FOR_FULL_CONFIDENCE = 40;

    @Override
    public double macedonianConfidence(String text) {
        if (text == null || text.isBlank()) {
            return 0.0;
        }

        int letters = 0;
        int cyrillic = 0;
        int specific = 0;
        int foreign = 0;
        for (int i = 0; i < text.length(); ) {
            int cp = text.codePointAt(i);
            i += Character.charCount(cp);
            if (!Character.isLetter(cp)) {
                continue;
            }
            letters++;
            if (MacedonianText.isCyrillic(cp)) {
                cyrillic++;
                String letter = new String(Character.toChars(cp));
                if (MacedonianText.MACEDONIAN_SPECIFIC_LETTERS.contains(letter)) {
                    specific++;
                } else if (MacedonianText.NON_MACEDONIAN_CYRILLIC_LETTERS.contains(letter)) {
                    foreign++;
                }
            }
        }
        if (letters == 0 || cyrillic == 0) {
            return 0.0;
        }

        double cyrillicShare = (double) cyrillic / letters;

        // Macedonian-specific letters make up ~2–4 % of running Macedonian text.
        double specificSignal = Math.min(1.0, (double) specific / cyrillic * 30.0);

        // Function words make up ~25–35 % of running Macedonian text.
        List<String> words = MacedonianText.words(text);
        long stopWords = words.stream().filter(MacedonianText.STOP_WORDS::contains).count();
        double stopWordSignal = words.isEmpty() ? 0.0 : Math.min(1.0, (double) stopWords / words.size() * 4.0);

        double macedonianEvidence = 0.5 * specificSignal + 0.5 * stopWordSignal;
        double foreignPenalty = Math.min(1.0, (double) foreign / cyrillic * 80.0);

        double confidence = cyrillicShare * (0.3 + 0.7 * macedonianEvidence) * (1.0 - foreignPenalty);

        if (letters < MIN_LETTERS_FOR_FULL_CONFIDENCE) {
            confidence *= 0.5 + 0.5 * letters / MIN_LETTERS_FOR_FULL_CONFIDENCE;
        }
        return Math.round(Math.max(0.0, Math.min(1.0, confidence)) * 1000.0) / 1000.0;
    }
}
