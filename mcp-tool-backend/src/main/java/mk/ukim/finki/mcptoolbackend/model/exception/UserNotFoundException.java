package mk.ukim.finki.mcptoolbackend.model.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String username) {
        super("Корисник со корисничко име „%s“ не постои.".formatted(username));
    }
}
