package com.freelance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contracts")
public class Contract {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String clientName;

    @Column(nullable = false)
    private String freelancerName;

    @Column(nullable = false)
    private Double totalBudget;

    @Column(nullable = false)
    private String status;

    private String startDate;
    private String endDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String paymentTerms;

    @Column(columnDefinition = "TEXT")
    private String keyDeliverables;

    private String signatoryName;
    private String signedDate;
    private Boolean isSigned = false;
    private Integer completionPercentage = 0;
    private Double inEscrowAmount = 0.0;
    private String currentMilestoneTitle;
    private String activeStatusBadge;
    private String dueDate;
    private String timeline;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<Milestone> milestones = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Contract() {}

    public Contract(String id, String title, String clientName, String freelancerName, Double totalBudget, String status, String startDate, String endDate) {
        this.id = id;
        this.title = title;
        this.clientName = clientName;
        this.freelancerName = freelancerName;
        this.totalBudget = totalBudget;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public Double getTotalBudget() {
        return totalBudget;
    }

    public void setTotalBudget(Double totalBudget) {
        this.totalBudget = totalBudget;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPaymentTerms() {
        return paymentTerms;
    }

    public void setPaymentTerms(String paymentTerms) {
        this.paymentTerms = paymentTerms;
    }

    public String getKeyDeliverables() {
        return keyDeliverables;
    }

    public void setKeyDeliverables(String keyDeliverables) {
        this.keyDeliverables = keyDeliverables;
    }

    public String getSignatoryName() {
        return signatoryName;
    }

    public void setSignatoryName(String signatoryName) {
        this.signatoryName = signatoryName;
    }

    public String getSignedDate() {
        return signedDate;
    }

    public void setSignedDate(String signedDate) {
        this.signedDate = signedDate;
    }

    public Boolean getIsSigned() {
        return isSigned;
    }

    public void setIsSigned(Boolean isSigned) {
        this.isSigned = isSigned;
    }

    public Integer getCompletionPercentage() {
        return completionPercentage;
    }

    public void setCompletionPercentage(Integer completionPercentage) {
        this.completionPercentage = completionPercentage;
    }

    public Double getInEscrowAmount() {
        return inEscrowAmount;
    }

    public void setInEscrowAmount(Double inEscrowAmount) {
        this.inEscrowAmount = inEscrowAmount;
    }

    public String getCurrentMilestoneTitle() {
        return currentMilestoneTitle;
    }

    public void setCurrentMilestoneTitle(String currentMilestoneTitle) {
        this.currentMilestoneTitle = currentMilestoneTitle;
    }

    public String getActiveStatusBadge() {
        return activeStatusBadge;
    }

    public void setActiveStatusBadge(String activeStatusBadge) {
        this.activeStatusBadge = activeStatusBadge;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getTimeline() {
        return timeline;
    }

    public void setTimeline(String timeline) {
        this.timeline = timeline;
    }

    public List<Milestone> getMilestones() {
        return milestones;
    }

    public void setMilestones(List<Milestone> milestones) {
        this.milestones = milestones;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
