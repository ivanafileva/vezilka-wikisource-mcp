package mk.ukim.finki.mcptoolbackend.model.exception;

import mk.ukim.finki.mcptoolbackend.model.enums.DonationStatus;

public class InvalidDonationStateException extends RuntimeException {
    public InvalidDonationStateException(Long id, DonationStatus status) {
        super("Пакетот за донација со ид %d не може да ја изврши оваа операција во статус „%s“.".formatted(id, status.label()));
    }
}
