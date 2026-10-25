package mk.ukim.finki.mcptoolbackend.model.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(Long id) {
        super("Текст со ид %d не постои.".formatted(id));
    }
}
