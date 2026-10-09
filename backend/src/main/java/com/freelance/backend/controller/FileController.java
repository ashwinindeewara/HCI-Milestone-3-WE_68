package com.freelance.backend.controller;

import com.freelance.backend.entity.FileAttachment;
import com.freelance.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<List<FileAttachment>> getAllFiles(@RequestParam(required = false) String ownerEmail) {
        if (ownerEmail != null && !ownerEmail.isBlank()) {
            return ResponseEntity.ok(fileStorageService.getFilesByOwnerEmail(ownerEmail));
        }
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/upload")
    public ResponseEntity<FileAttachment> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "relatedEntityType", required = false, defaultValue = "PROJECT") String relatedEntityType,
            @RequestParam(value = "relatedEntityId", required = false, defaultValue = "GENERAL") String relatedEntityId,
            @RequestParam(value = "uploadedBy", required = false, defaultValue = "Freelancer") String uploadedBy,
            @RequestParam(value = "uploadedByEmail", required = false) String uploadedByEmail
    ) {
        FileAttachment saved = fileStorageService.storeFile(file, relatedEntityType, relatedEntityId, uploadedBy, uploadedByEmail);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FileAttachment> getFileMetadata(@PathVariable String id) {
        return ResponseEntity.ok(fileStorageService.getFileMetadata(id));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable String id) {
        FileAttachment metadata = fileStorageService.getFileMetadata(id);
        Resource resource = fileStorageService.loadFileAsResource(id);

        String contentType = metadata.getMimeType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + metadata.getOriginalFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<Resource> previewFile(@PathVariable String id) {
        FileAttachment metadata = fileStorageService.getFileMetadata(id);
        Resource resource = fileStorageService.loadFileAsResource(id);

        String contentType = metadata.getMimeType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + metadata.getOriginalFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<FileAttachment>> getFilesForEntity(
            @PathVariable String entityType,
            @PathVariable String entityId
    ) {
        return ResponseEntity.ok(fileStorageService.getFilesByEntity(entityType, entityId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteFile(@PathVariable String id) {
        fileStorageService.deleteFile(id);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "File deleted successfully");
        return ResponseEntity.ok(resp);
    }
}
