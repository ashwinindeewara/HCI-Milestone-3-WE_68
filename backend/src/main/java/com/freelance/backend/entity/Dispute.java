package com.freelance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "disputes")
public class Dispute {

    @Id
    private String id;

    @Column(nullable = false)
    private String dspNumber;

    @Column(nullable = false)
    private String project;

    private String parties;
    private String issueType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "evidence_file", columnDefinition = "TEXT")
    private String evidenceFile;
    private Double amount;

    @Column(nullable = false)
    private String status; // Open, Under Review, Waiting for Client, Waiting for Freelancer, Resolved, Rejected, Closed

    private String statusType; // open, review, resolved
    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;

    private String filedDate;
    private String lastUpdatedDate;
    private String priority = "Medium"; // High, Medium, Low
    private String clientName;
    private String freelancerName;
    @Column(name = "freelancer_email")
    private String freelancerEmail;
    private String contractId;
    private Integer timelineStep = 1; // 1: Open, 2: Reviewing, 3: Resolved

    @Transient
    private List<DisputeMessage> messages = new ArrayList<>();

    @Transient
    private List<String> evidenceFilesList = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Dispute() {}

    public Dispute(String id, String dspNumber, String project, String parties, String issueType, String description, String evidenceFile, Double amount, String status, String statusType) {
        this.id = id;
        this.dspNumber = dspNumber;
        this.project = project;
        this.parties = parties;
        this.issueType = issueType;
        this.description = description;
        this.evidenceFile = evidenceFile;
        this.amount = amount;
        this.status = status;
        this.statusType = statusType;
        this.filedDate = "Filed Oct 10, 2024";
        this.timelineStep = "Resolved".equalsIgnoreCase(status) ? 3 : ("Under Review".equalsIgnoreCase(status) || "review".equalsIgnoreCase(statusType) ? 2 : 1);
        this.createdAt = LocalDateTime.now();
    }

    public Dispute(String id, String dspNumber, String project, String parties, String issueType, String description, String evidenceFile, Double amount, String status, String statusType, String filedDate, Integer timelineStep) {
        this.id = id;
        this.dspNumber = dspNumber;
        this.project = project;
        this.parties = parties;
        this.issueType = issueType;
        this.description = description;
        this.evidenceFile = evidenceFile;
        this.amount = amount;
        this.status = status;
        this.statusType = statusType;
        this.filedDate = filedDate;
        this.timelineStep = timelineStep;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public String getFreelancerEmail() {
        return freelancerEmail;
    }

    public void setFreelancerEmail(String freelancerEmail) {
        this.freelancerEmail = freelancerEmail;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDspNumber() {
        return dspNumber;
    }

    public void setDspNumber(String dspNumber) {
        this.dspNumber = dspNumber;
    }

    public String getProject() {
        return project;
    }

    public void setProject(String project) {
        this.project = project;
    }

    public String getParties() {
        return parties;
    }

    public void setParties(String parties) {
        this.parties = parties;
    }

    public String getIssueType() {
        return issueType;
    }

    public void setIssueType(String issueType) {
        this.issueType = issueType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEvidenceFile() {
        return evidenceFile;
    }

    public void setEvidenceFile(String evidenceFile) {
        this.evidenceFile = evidenceFile;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStatusType() {
        return statusType;
    }

    public void setStatusType(String statusType) {
        this.statusType = statusType;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }

    public String getFiledDate() {
        return filedDate;
    }

    public void setFiledDate(String filedDate) {
        this.filedDate = filedDate;
    }

    public String getLastUpdatedDate() {
        return lastUpdatedDate;
    }

    public void setLastUpdatedDate(String lastUpdatedDate) {
        this.lastUpdatedDate = lastUpdatedDate;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
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

    public String getContractId() {
        return contractId;
    }

    public void setContractId(String contractId) {
        this.contractId = contractId;
    }

    public Integer getTimelineStep() {
        return timelineStep;
    }

    public void setTimelineStep(Integer timelineStep) {
        this.timelineStep = timelineStep;
    }

    public List<DisputeMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<DisputeMessage> messages) {
        this.messages = messages;
    }

    public List<String> getEvidenceFilesList() {
        if (evidenceFile != null && !evidenceFile.isBlank()) {
            List<String> list = new ArrayList<>();
            for (String f : evidenceFile.split(",")) {
                if (!f.trim().isEmpty()) {
                    list.add(f.trim());
                }
            }
            return list;
        }
        return evidenceFilesList;
    }

    public void setEvidenceFilesList(List<String> evidenceFilesList) {
        this.evidenceFilesList = evidenceFilesList;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
