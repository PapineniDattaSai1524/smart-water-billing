package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Files", description = "Profile photo upload")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping(value = "/photo-upload", consumes = "multipart/form-data")
    @Operation(summary = "Upload a profile photo (JPEG/PNG/WEBP, max 10MB) and get back its public URL")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadPhoto(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.storeProfilePhoto(file);
        return ResponseEntity.ok(ApiResponse.success("Photo uploaded successfully", Map.of("url", url)));
    }
}
