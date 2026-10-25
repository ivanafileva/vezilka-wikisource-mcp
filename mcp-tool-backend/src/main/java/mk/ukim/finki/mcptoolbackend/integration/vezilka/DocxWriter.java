package mk.ukim.finki.mcptoolbackend.integration.vezilka;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Writes plain text as a minimal Word (.docx) document, one paragraph per line.
 *
 * <p>doniraj.vezilka.ai accepts PDF, Word and image uploads (not .txt), so the
 * outbox produces .docx files. A .docx is just a ZIP of three XML parts, so no
 * extra library is needed. Word stores text as UTF-8, so Cyrillic is kept as is.</p>
 */
final class DocxWriter {
    private static final String CONTENT_TYPES = """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
          <Default Extension="xml" ContentType="application/xml"/>
          <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
        </Types>""";

    private static final String RELS = """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
        </Relationships>""";

    private DocxWriter() {
    }

    /**
     * @param boldLines how many leading lines to print in bold (the provenance header)
     */
    static void write(Path file, String text, int boldLines) throws IOException {
        try (OutputStream out = Files.newOutputStream(file, StandardOpenOption.CREATE_NEW)) {
            write(out, text, boldLines);
        }
    }

    /** The same document in memory, e.g. for uploading it. */
    static byte[] toBytes(String text, int boldLines) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        write(out, text, boldLines);
        return out.toByteArray();
    }

    private static void write(OutputStream out, String text, int boldLines) throws IOException {
        try (ZipOutputStream zip = new ZipOutputStream(out, StandardCharsets.UTF_8)) {
            entry(zip, "[Content_Types].xml", CONTENT_TYPES);
            entry(zip, "_rels/.rels", RELS);
            entry(zip, "word/document.xml", document(text, boldLines));
        }
    }

    private static String document(String text, int boldLines) {
        StringBuilder body = new StringBuilder();
        String[] lines = text.split("\\R", -1);
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            if (line.isEmpty()) {
                body.append("<w:p/>");
                continue;
            }
            body.append("<w:p><w:r>");
            if (i < boldLines) {
                body.append("<w:rPr><w:b/></w:rPr>");
            }
            body.append("<w:t xml:space=\"preserve\">").append(escape(line)).append("</w:t></w:r></w:p>");
        }
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
            + "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">"
            + "<w:body>" + body + "<w:sectPr/></w:body></w:document>";
    }

    private static void entry(ZipOutputStream zip, String name, String content) throws IOException {
        zip.putNextEntry(new ZipEntry(name));
        zip.write(content.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private static String escape(String value) {
        StringBuilder escaped = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '&' -> escaped.append("&amp;");
                case '<' -> escaped.append("&lt;");
                case '>' -> escaped.append("&gt;");
                case '"' -> escaped.append("&quot;");
                default -> {
                    // Drop control characters that are illegal in XML (keep tab).
                    if (c >= 0x20 || c == '\t') {
                        escaped.append(c);
                    }
                }
            }
        }
        return escaped.toString();
    }
}
