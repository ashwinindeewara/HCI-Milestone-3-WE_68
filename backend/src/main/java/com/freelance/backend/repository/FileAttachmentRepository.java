package com.freelance.backend.repository;

import com.freelance.backend.entity.FileAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileAttachmentRepository extends JpaRepository<FileAttachment, String> {
    List<FileAttachment> findByRelatedEntityTypeAndRelatedEntityIdOrderByCreatedAtDesc(String relatedEntityType, String relatedEntityId);
    List<FileAttachment> findByRelatedEntityIdOrderByCreatedAtDesc(String relatedEntityId);
    List<FileAttachment> findByUploadedByOrderByCreatedAtDesc(String uploadedBy);
}