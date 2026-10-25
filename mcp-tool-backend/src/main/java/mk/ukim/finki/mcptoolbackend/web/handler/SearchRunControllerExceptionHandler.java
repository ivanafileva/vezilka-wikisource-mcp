package mk.ukim.finki.mcptoolbackend.web.handler;

import mk.ukim.finki.mcptoolbackend.model.exception.SearchRunNotFoundException;
import mk.ukim.finki.mcptoolbackend.model.exception.SourceUnavailableException;
import mk.ukim.finki.mcptoolbackend.web.controller.SearchRunController;
import mk.ukim.finki.mcptoolbackend.web.dto.ApiError;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = SearchRunController.class)
public class SearchRunControllerExceptionHandler {
    @ExceptionHandler(SearchRunNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(SearchRunNotFoundException exception) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ApiError.of(HttpStatus.NOT_FOUND, exception.getMessage()));
    }

    @ExceptionHandler(SourceUnavailableException.class)
    public ResponseEntity<ApiError> handleSourceUnavailable(SourceUnavailableException exception) {
        return ResponseEntity
            .status(HttpStatus.BAD_GATEWAY)
            .body(ApiError.of(HttpStatus.BAD_GATEWAY, exception.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleBadRequest(IllegalArgumentException exception) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ApiError.of(HttpStatus.BAD_REQUEST, exception.getMessage()));
    }
}
