package com.freelance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    private String id;

    @Column(nullable = false)
    private String referenceNo;

    private String contractId;
    private String milestoneId;

    @Column(nullable = false)
    private String milestoneTitle;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String type; // FUND, RELEASE, DISPUTE

    @Column(nullable = false)
    private String status; // COMPLETED, PENDING, DISPUTED

    private String timestamp;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Transaction() {}

    public Transaction(String id, String referenceNo, String contractId, String milestoneId, String milestoneTitle, Double amount, String type, String status, String timestamp) {
        this.id = id;
        this.referenceNo = referenceNo;
        this.contractId = contractId;
        this.milestoneId = milestoneId;
        this.milestoneTitle = milestoneTitle;
        this.amount = amount;
        this.type = type;
        this.status = status;
        this.timestamp = timestamp;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getReferenceNo() {
        return referenceNo;
    }

    public void setReferenceNo(String referenceNo) {
        this.referenceNo = referenceNo;
    }

    public String getContractId() {
        return contractId;
    }

    public void setContractId(String contractId) {
        this.contractId = contractId;
    }

    public String getMilestoneId() {
        return milestoneId;
    }

    public void setMilestoneId(String milestoneId) {
        this.milestoneId = milestoneId;
    }

    public String getMilestoneTitle() {
        return milestoneTitle;
    }

    public void setMilestoneTitle(String milestoneTitle) {
        this.milestoneTitle = milestoneTitle;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
