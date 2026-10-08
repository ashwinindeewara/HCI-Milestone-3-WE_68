package com.freelance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_activities")
public class ProjectActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String projectId;

    private String contractId;

    @Column(nullable = false)
    private String type; // CONTRACT_ACCEPTED, MILESTONE_DELIVERED, DELIVERABLE_APPROVED, DISPUTE_FILED, PAYMENT_RELEASED, FILE_UPLOADED

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    private String performedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ProjectActivity() {}

    public ProjectActivity(String projectId, String contractId, String type, String description, String performedBy) {
        this.projectId = projectId;
        this.contractId = contractId;
        this.type = type;
        this.description = description;
        this.performedBy = performedBy;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getContractId() {
        return contractId;
    }

    public void setContractId(String contractId) {
        this.contractId = contractId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
