package com.freelance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    private String id;

    @Column(nullable = false)
    private String contractId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String clientName;

    @Column(nullable = false)
    private String freelancerName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String status; // PENDING, ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED

    private Integer completionPercentage = 0;

    private Double totalBudget = 0.0;

    private Double inEscrowAmount = 0.0;

    private String timeline;

    private String startDate;

    private String endDate;

    private String dueDate;

    private String statusBadge = "On Track";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Project() {}

    public Project(String id, String contractId, String title, String clientName, String freelancerName,
                   String description, String status, Integer completionPercentage, Double totalBudget,
                   Double inEscrowAmount, String timeline, String dueDate, String statusBadge) {
        this.id = id;
        this.contractId = contractId;
        this.title = title;
        this.clientName = clientName;
        this.freelancerName = freelancerName;
        this.description = description;
        this.status = status;
        this.completionPercentage = completionPercentage;
        this.totalBudget = totalBudget;
        this.inEscrowAmount = inEscrowAmount;
        this.timeline = timeline;
        this.dueDate = dueDate;
        this.statusBadge = statusBadge;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getContractId() {
        return contractId;
    }

    public void setContractId(String contractId) {
        this.contractId = contractId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getFreelancerName() {
        return freelancerName;
    }

    public void setFreelancerName(String freelancerName) {
        this.freelancerName = freelancerName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getCompletionPercentage() {
        return completionPercentage;
    }

    public void setCompletionPercentage(Integer completionPercentage) {
        this.completionPercentage = completionPercentage;
    }

    public Double getTotalBudget() {
        return totalBudget;
    }

    public void setTotalBudget(Double totalBudget) {
        this.totalBudget = totalBudget;
    }

    public Double getInEscrowAmount() {
        return inEscrowAmount;
    }

    public void setInEscrowAmount(Double inEscrowAmount) {
        this.inEscrowAmount = inEscrowAmount;
    }

    public String getTimeline() {
        return timeline;
    }

    public void setTimeline(String timeline) {
        this.timeline = timeline;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getStatusBadge() {
        return statusBadge;
    }

    public void setStatusBadge(String statusBadge) {
        this.statusBadge = statusBadge;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
