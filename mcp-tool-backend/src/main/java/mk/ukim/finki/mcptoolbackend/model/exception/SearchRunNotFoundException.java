package mk.ukim.finki.mcptoolbackend.model.exception;

public class SearchRunNotFoundException extends RuntimeException {
    public SearchRunNotFoundException(Long id) {
        super("Пребарување со ид %d не постои.".formatted(id));
    }
}
