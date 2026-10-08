package com.freelance.backend.service;

import com.freelance.backend.entity.FileAttachment;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.FileAttachmentRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.text.DecimalFormat;
import java.util.*;

@Service
public class FileStorageService {

    private final Path rootUploadDir = Paths.get("uploads").toAbsolutePath().normalize();

    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
            "pdf", "doc", "docx", "xls", "xlsx", "zip", "rar", "7z", "tar", "gz",
            "png", "jpg", "jpeg", "gif", "webp", "svg", "txt", "csv", "json", "fig"
    ));

    private static final long MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

    @Autowired
    private FileAttachmentRepository fileAttachmentRepository;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootUploadDir);
            Files.createDirectories(rootUploadDir.resolve("images"));
            Files.createDirectories(rootUploadDir.resolve("files"));
            Files.createDirectories(rootUploadDir.resolve("disputes"));
            Files.createDirectories(rootUploadDir.resolve("deliverables"));
            Files.createDirectories(rootUploadDir.resolve("contracts"));
            Files.createDirectories(rootUploadDir.resolve("profile"));
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload directories", e);
        }
    }

    public FileAttachment storeFile(MultipartFile file, String relatedEntityType, String relatedEntityId, String uploadedBy) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store an empty file.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 25 MB.");
        }

        String rawOriginalName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        // Prevent path traversal
        if (rawOriginalName.contains("..")) {
            throw new IllegalArgumentException("Filename contains invalid path sequence: " + rawOriginalName);
        }

        String fileExt = getFileExtension(rawOriginalName).toLowerCase();
        if (!fileExt.isEmpty() && !ALLOWED_EXTENSIONS.contains(fileExt)) {
            throw new IllegalArgumentException("File type '." + fileExt + "' is not supported. Please upload a safe document, image, or archive.");
        }

        String subDirName = determineSubDir(relatedEntityType);
        Path targetDir = rootUploadDir.resolve(subDirName);

        String fileId = "FILE-" + UUID.randomUUID().toString().substring(0, 8);
        String uniqueStoredName = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6) + "_" + rawOriginalName;
        Path targetLocation = targetDir.resolve(uniqueStoredName);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + rawOriginalName, e);
        }

        String relativePath = "uploads/" + subDirName + "/" + uniqueStoredName;
        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        boolean isImage = mimeType.startsWith("image/") || "PROFILE".equalsIgnoreCase(relatedEntityType) || "IMAGE".equalsIgnoreCase(relatedEntityType);
        String fileUrl = "/api/files/" + fileId + (isImage ? "/preview" : "/download");
        String formattedSize = formatFileSize(file.getSize());
        String uploader = (uploadedBy != null && !uploadedBy.isBlank()) ? uploadedBy : "Freelancer";

        FileAttachment attachment = new FileAttachment(
                fileId,
                rawOriginalName,
                uniqueStoredName,
                relativePath,
                fileUrl,
                mimeType,
                file.getSize(),
                formattedSize,
                uploader,
                relatedEntityType != null ? relatedEntityType.toUpperCase() : "GENERAL",
                relatedEntityId
        );

        return fileAttachmentRepository.save(attachment);
    }

    public Resource loadFileAsResource(String fileId) {
        FileAttachment attachment = fileAttachmentRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File record not found with id: " + fileId));

        try {
            Path filePath = Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found on storage: " + attachment.getOriginalFileName());
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File URL error for id: " + fileId, e);
        }
    }

    public FileAttachment getFileMetadata(String fileId) {
        return fileAttachmentRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File record not found: " + fileId));
    }

    public List<FileAttachment> getFilesByEntity(String relatedEntityType, String relatedEntityId) {
        return fileAttachmentRepository.findByRelatedEntityTypeAndRelatedEntityIdOrderByCreatedAtDesc(
                relatedEntityType.toUpperCase(), relatedEntityId
        );
    }

    public List<FileAttachment> getFilesByEntityId(String relatedEntityId) {
        return fileAttachmentRepository.findByRelatedEntityIdOrderByCreatedAtDesc(relatedEntityId);
    }

    public List<FileAttachment> getAllFiles() {
        return fileAttachmentRepository.findAll();
    }

    public void deleteFile(String fileId) {
        FileAttachment attachment = getFileMetadata(fileId);
        try {
            Path filePath = Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {}
        fileAttachmentRepository.delete(attachment);
    }

    private String determineSubDir(String entityType) {
        if (entityType == null) return "files";
        switch (entityType.toUpperCase()) {
            case "DISPUTE": return "disputes";
            case "DELIVERABLE": return "deliverables";
            case "CONTRACT": return "contracts";
            case "PROFILE":
            case "IMAGE": return "images";
            default: return "files";
        }
    }

    private String getFileExtension(String filename) {
        int dotIdx = filename.lastIndexOf('.');
        return dotIdx >= 0 ? filename.substring(dotIdx + 1) : "";
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int z = (63 - Long.numberOfLeadingZeros(bytes)) / 10;
        DecimalFormat df = new DecimalFormat("#.##");
        return df.format((double) bytes / (1L << (z * 10))) + " " + " KMGTPE".charAt(z) + "B";
    }
}