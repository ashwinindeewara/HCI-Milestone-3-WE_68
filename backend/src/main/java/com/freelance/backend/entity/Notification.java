package com.freelance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String subtitle;
    private String badgeText; // "Under Review", "Payment Escrow", "Milestone Approved", "Open Dispute"
    private String badgeType; // "review", "escrow", "approved", "open", "resolved"
    private String amount;    // "$2,400", "$3,800", "$450"
    private String category;  // "Disputes", "Payments", "Projects"
    private String actionUrl; // "/freelancer-disputes", "/(tabs)/escrow", "/(tabs)/contracts"
    private String actionLabel; // "View Details & Discussion", "View Payment Details"
    private boolean unread = true;
    private String timestamp;

    private String type; // e.g. "CONTRACT_RECEIVED", "DISPUTE_CREATED", "DELIVERABLE_APPROVED"
    private String relatedEntityId; // e.g. "C-101", "DSP-409", "PRJ-C-101"
    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "recipient_name")
    private String recipientName;

    @Column(name = "recipient_email")
    private String recipientEmail;

    @Column(name = "recipient_role")
    private String recipientRole;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Notification(String title, String subtitle, String badgeText, String badgeType, String amount, String category, String actionUrl, String actionLabel, boolean unread, String timestamp) {
        this.title = title;
        this.subtitle = subtitle;
        this.badgeText = badgeText;
        this.badgeType = badgeType;
        this.amount = amount;
        this.category = category;
        this.actionUrl = actionUrl;
        this.actionLabel = actionLabel;
        this.unread = unread;
        this.timestamp = timestamp;
        this.createdAt = LocalDateTime.now();
    }

    public Notification(String title, String subtitle, String badgeText, String badgeType, String amount, String category, String actionUrl, String actionLabel, boolean unread, String timestamp, String type, String relatedEntityId, String message) {
        this(title, subtitle, badgeText, badgeType, amount, category, actionUrl, actionLabel, unread, timestamp);
        this.type = type;
        this.relatedEntityId = relatedEntityId;
        this.message = message;
    }

    public Notification(String recipientName, String senderName, String title, String subtitle, String badgeText, String badgeType, String amount, String category, String actionUrl, String actionLabel, boolean unread, String timestamp, String type, String relatedEntityId, String message) {
        this(title, subtitle, badgeText, badgeType, amount, category, actionUrl, actionLabel, unread, timestamp, type, relatedEntityId, message);
        this.recipientName = recipientName;
        this.senderName = senderName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public String getBadgeText() {
        return badgeText;
    }

    public void setBadgeText(String badgeText) {
        this.badgeText = badgeText;
    }

    public String getBadgeType() {
        return badgeType;
    }

    public void setBadgeType(String badgeType) {
        this.badgeType = badgeType;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getActionUrl() {
        return actionUrl;
    }

    public void setActionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
    }

    public String getActionLabel() {
        return actionLabel;
    }

    public void setActionLabel(String actionLabel) {
        this.actionLabel = actionLabel;
    }

    public boolean isUnread() {
        return unread;
    }

    public void setUnread(boolean unread) {
        this.unread = unread;
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getRelatedEntityId() {
        return relatedEntityId;
    }

    public void setRelatedEntityId(String relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getRecipientRole() {
        return recipientRole;
    }

    public void setRecipientRole(String recipientRole) {
        this.recipientRole = recipientRole;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getFreelancerName() {
        return recipientName;
    }

    public void setFreelancerName(String freelancerName) {
        this.recipientName = freelancerName;
    }
}
