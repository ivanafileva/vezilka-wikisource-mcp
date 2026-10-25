package mk.ukim.finki.mcptoolbackend.model.exception;

public class DonationBatchNotFoundException extends RuntimeException {
    public DonationBatchNotFoundException(Long id) {
        super("Пакет за донација со ид %d не постои.".formatted(id));
    }
}
