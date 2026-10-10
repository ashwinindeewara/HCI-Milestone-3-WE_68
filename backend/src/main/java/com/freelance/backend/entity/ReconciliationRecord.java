package com.freelance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reconciliation_records")
public class ReconciliationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String referenceNo;

    @Column(nullable = false)
    private String batchId;

    @Column(name = "expected_amount")
    private Double expectedAmount;

    @Column(name = "received_amount")
    private Double receivedAmount;

    private Double difference;

    private Double amount;

    @Column(nullable = false)
    private String status; // MATCHED, UNMATCHED, PENDING, DISCREPANCY

    private String transactionDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ReconciliationRecord() {}

    // Fully loaded constructor
    public ReconciliationRecord(String referenceNo, String batchId, Double expectedAmount, Double receivedAmount, String status, String transactionDate, String notes) {
        this.referenceNo = referenceNo;
        this.batchId = batchId;
        this.expectedAmount = expectedAmount;
        this.receivedAmount = receivedAmount;
        this.amount = expectedAmount;
        this.difference = (receivedAmount != null && expectedAmount != null) ? receivedAmount - expectedAmount : 0.0;
        this.status = status;
        this.transactionDate = transactionDate;
        this.notes = notes;
    }

    // Simplified constructor
    public ReconciliationRecord(String referenceNo, String batchId, Double expectedAmount, String status, String transactionDate, String notes) {
        this.referenceNo = referenceNo;
        this.batchId = batchId;
        this.expectedAmount = expectedAmount;
        this.receivedAmount = expectedAmount;
        this.amount = expectedAmount;
        this.difference = 0.0;
        this.status = status;
        this.transactionDate = transactionDate;
        this.notes = notes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReferenceNo() {
        return referenceNo;
    }

    public void setReferenceNo(String referenceNo) {
        this.referenceNo = referenceNo;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public Double getAmount() {
        return amount != null ? amount : expectedAmount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Double getExpectedAmount() {
        if (expectedAmount != null) return expectedAmount;
        return amount != null ? amount : 0.0;
    }

    public void setExpectedAmount(Double expectedAmount) {
        this.expectedAmount = expectedAmount;
        this.amount = expectedAmount;
        recalculateDifference();
    }

    public Double getReceivedAmount() {
        if (receivedAmount != null) return receivedAmount;
        return getExpectedAmount();
    }

    public void setReceivedAmount(Double receivedAmount) {
        this.receivedAmount = receivedAmount;
        recalculateDifference();
    }

    public Double getDifference() {
        if (difference != null) return difference;
        Double rec = getReceivedAmount();
        Double exp = getExpectedAmount();
        return (rec != null && exp != null) ? rec - exp : 0.0;
    }

    public void setDifference(Double difference) {
        this.difference = difference;
    }

    private void recalculateDifference() {
        Double rec = getReceivedAmount();
        Double exp = getExpectedAmount();
        this.difference = (rec != null && exp != null) ? rec - exp : 0.0;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(String transactionDate) {
        this.transactionDate = transactionDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
