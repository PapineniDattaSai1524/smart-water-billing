package com.smartwater.billing.service;

import com.smartwater.billing.exception.InvalidRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    @Value("${app.upload-dir}")
    private String uploadDir;

    /**
     * Stores an uploaded profile photo on local disk and returns the public
     * URL path (served via {@code /photos/**}) that should be persisted on
     * the resident's record.
     */
    public String storeProfilePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("No file was uploaded");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new InvalidRequestException("Only JPEG, PNG, or WEBP images are allowed");
        }

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String fileName = UUID.randomUUID() + extension;

        try {
            Path targetDir = Paths.get(uploadDir).toAbsolutePath();
            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new InvalidRequestException("Failed to store the uploaded photo: " + e.getMessage());
        }

        return "/photos/" + fileName;
    }
}
