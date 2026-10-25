package mk.ukim.finki.mcptoolbackend.model.exception;

public class IncorrectPasswordException extends RuntimeException {
    public IncorrectPasswordException() {
        super("Лозинката е погрешна.");
    }
}
