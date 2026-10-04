package com.freelance.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deliverables")
public class Deliverable {

    @Id
    private String id;

    @Column(name = "milestone_id")
    private String milestoneId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_fk")
    @JsonIgnore
    private Milestone milestone;

    @Column(nullable = false)
    private String fileName;

    private String fileSize;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String uploadedAt;

    @Column(nullable = false)
    private String status; // PENDING_REVIEW, APPROVED, REVISION_REQUESTED

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Deliverable() {}

    public Deliverable(String id, String milestoneId, String fileName, String fileSize, String notes, String uploadedAt, String status) {
        this.id = id;
        this.milestoneId = milestoneId;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.notes = notes;
        this.uploadedAt = uploadedAt;
        this.status = status;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMilestoneId() {
        return milestoneId;
    }

    public void setMilestoneId(String milestoneId) {
        this.milestoneId = milestoneId;
    }

    public Milestone getMilestone() {
        return milestone;
    }

    public void setMilestone(Milestone milestone) {
        this.milestone = milestone;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileSize() {
        return fileSize;
    }

    public void setFileSize(String fileSize) {
        this.fileSize = fileSize;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(String uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
