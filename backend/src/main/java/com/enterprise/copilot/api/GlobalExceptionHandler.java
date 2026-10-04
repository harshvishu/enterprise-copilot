package com.enterprise.copilot.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Translates common exceptions into sanitised JSON error responses
 * (never leaks internals).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(IllegalStateException ex) {

        return body(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NoSuchElementException ex) {

        return body(HttpStatus.NOT_FOUND, "Resource not found");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {

        return body(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatus status, String message) {

        return ResponseEntity.status(status)
                .body(
                        Map.of(
                                "timestamp",
                                Instant.now().toString(),
                                "status",
                                status.value(),
                                "error",
                                status.getReasonPhrase(),
                                "message",
                                message == null ? status.getReasonPhrase() : message));
    }
}
