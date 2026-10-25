package mk.ukim.finki.mcptoolbackend.model.exception;

public class UsernameAlreadyExistsException extends RuntimeException {
    public UsernameAlreadyExistsException(String username) {
        super("Корисник со корисничко име „%s“ веќе постои.".formatted(username));
    }
}
