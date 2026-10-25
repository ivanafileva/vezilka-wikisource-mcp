package mk.ukim.finki.mcptoolbackend.model.enums;

/**
 * Lifecycle of a {@code DonationBatch}:
 * DRAFT -> APPROVED -> SUBMITTED -> ACCEPTED | REJECTED | FAILED
 */
public enum DonationStatus {
    DRAFT("нацрт"),
    APPROVED("одобрен"),
    SUBMITTED("испратен"),
    ACCEPTED("прифатен"),
    REJECTED("одбиен"),
    FAILED("неуспешен");

    private final String label;

    DonationStatus(String label) {
        this.label = label;
    }

    /** Macedonian label for messages shown to users. */
    public String label() {
        return label;
    }
}
