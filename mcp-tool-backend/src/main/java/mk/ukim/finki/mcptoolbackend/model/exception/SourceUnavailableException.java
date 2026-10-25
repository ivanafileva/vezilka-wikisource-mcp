package mk.ukim.finki.mcptoolbackend.model.exception;

/**
 * Thrown by the {@code SourceClient} when the assigned website
 * (mk.wikisource.org) cannot be reached or returns an unexpected response.
 */
public class SourceUnavailableException extends RuntimeException {
    public SourceUnavailableException(String message) {
        super(message);
    }

    public SourceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
