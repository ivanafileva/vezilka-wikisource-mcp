package mk.ukim.finki.mcptoolbackend.model.enums;

/**
 * Lifecycle of a {@code SearchRun}:
 * PENDING -> RUNNING -> COMPLETED | FAILED
 */
public enum SearchStatus {
    PENDING("во чекање"),
    RUNNING("во тек"),
    COMPLETED("завршено"),
    FAILED("неуспешно");

    private final String label;

    SearchStatus(String label) {
        this.label = label;
    }

    /** Macedonian label for messages shown to users. */
    public String label() {
        return label;
    }
}
