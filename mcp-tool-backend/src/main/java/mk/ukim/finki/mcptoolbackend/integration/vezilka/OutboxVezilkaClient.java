package mk.ukim.finki.mcptoolbackend.integration.vezilka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import mk.ukim.finki.mcptoolbackend.model.enums.DonationStatus;
import mk.ukim.finki.mcptoolbackend.model.exception.VezilkaIntegrationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Default {@link VezilkaClient} ({@code vezilka.mode=export}).
 *
 * <p>doniraj.vezilka.ai currently accepts text donations only through its web
 * form (PDF, Word or photos of one's own text) and has no public API. This
 * client therefore prepares every donation as a ready-to-upload package in
 * {@code vezilka.outbox-dir}:</p>
 * <ul>
 *   <li>{@code <reference>.docx} — a Word document with a provenance header
 *       (title, source URL, licence note);</li>
 *   <li>{@code manifest.jsonl} — one JSON line per donation (reference, title,
 *       source URL, file, size, time).</li>
 * </ul>
 *
 * <p>Status tracking: after uploading a file at doniraj.vezilka.ai, create an
 * empty {@code <reference>.accepted} (or {@code .rejected}) marker next to it;
 * the scheduler then moves the batch to ACCEPTED/REJECTED. Switch to
 * {@link HttpVezilkaClient} ({@code vezilka.mode=http}) once the Vezilka team
 * provides an API.</p>
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "vezilka.mode", havingValue = "export", matchIfMissing = true)
public class OutboxVezilkaClient implements VezilkaClient {
    static final String MANIFEST = "manifest.jsonl";
    /** Title, source, licence and date lines printed in bold at the top of the document. */
    static final int HEADER_LINES = 4;
    private static final DateTimeFormatter REF_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final VezilkaProperties vezilkaProperties;
    private final Path outboxDir;
    private final ObjectMapper objectMapper;

    public OutboxVezilkaClient(VezilkaProperties vezilkaProperties,
                               @Value("${vezilka.outbox-dir:vezilka-outbox}") String outboxDir,
                               ObjectMapper objectMapper) {
        this.vezilkaProperties = vezilkaProperties;
        this.outboxDir = Path.of(outboxDir).toAbsolutePath();
        this.objectMapper = objectMapper;
    }

    @Override
    public DonationReceipt submitTextDonation(TextDonationRequest request) {
        if (request.content() == null || request.content().isBlank()) {
            throw new VezilkaIntegrationException("Не може да се донира празен текст.");
        }
        String reference = "VZ-%s-%s".formatted(
            LocalDate.now().format(REF_DATE),
            UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        Path file = outboxDir.resolve(reference + ".docx");

        try {
            Files.createDirectories(outboxDir);
            // doniraj.vezilka.ai/donate-text accepts PDF, DOC/DOCX and images - not .txt.
            DocxWriter.write(file, render(request), HEADER_LINES);
            Files.writeString(outboxDir.resolve(MANIFEST), manifestLine(reference, request, file) + "\n",
                StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (IOException e) {
            throw new VezilkaIntegrationException("Пакетот за донација не можеше да се запише во " + outboxDir + ".", e);
        }

        log.info("Prepared donation {} ('{}') in {}", reference, request.title(), outboxDir);
        return new DonationReceipt(reference,
            "Saved as %s - upload it at %s/donate-text".formatted(file.getFileName(), vezilkaProperties.baseUrl()));
    }

    @Override
    public DonationStatus checkStatus(String vezilkaReference) {
        if (vezilkaReference == null || vezilkaReference.isBlank()) {
            return DonationStatus.FAILED;
        }
        if (Files.exists(outboxDir.resolve(vezilkaReference + ".accepted"))) {
            return DonationStatus.ACCEPTED;
        }
        if (Files.exists(outboxDir.resolve(vezilkaReference + ".rejected"))) {
            return DonationStatus.REJECTED;
        }
        return Files.exists(outboxDir.resolve(vezilkaReference + ".docx"))
            || Files.exists(outboxDir.resolve(vezilkaReference + ".txt"))
            ? DonationStatus.SUBMITTED
            : DonationStatus.FAILED;
    }

    /** The donated text with a provenance header (title, source, licence, date) on top. */
    static String render(TextDonationRequest request) {
        return """
            Наслов: %s
            Извор: %s
            Лиценца: преземено од Викизвор (mk.wikisource.org) - слободна содржина / јавна сопственост; видете ја изворната страница.
            Подготвено: %s

            ----------------------------------------

            %s
            """.formatted(
            request.title() == null ? "(без наслов)" : request.title(),
            request.sourceUrl() == null ? "-" : request.sourceUrl(),
            LocalDateTime.now().withNano(0),
            request.content().strip());
    }

    private String manifestLine(String reference, TextDonationRequest request, Path file) {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("reference", reference);
        entry.put("title", request.title());
        entry.put("sourceUrl", request.sourceUrl());
        entry.put("file", file.getFileName().toString());
        entry.put("characters", request.content().length());
        entry.put("createdAt", LocalDateTime.now().withNano(0).toString());
        try {
            return objectMapper.writeValueAsString(entry);
        } catch (JsonProcessingException e) {
            throw new VezilkaIntegrationException("Записот во манифестот на донацијата не можеше да се серијализира.", e);
        }
    }
}
