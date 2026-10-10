package com.freelance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payout_accounts")
public class PayoutAccount {

    @Id
    private String id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "freelancer_name")
    private String freelancerName;

    @Column(columnDefinition = "TEXT")
    private String name;

    @Column(columnDefinition = "TEXT")
    private String type;

    @Column(columnDefinition = "TEXT")
    private String detail;

    private String badge = "Active";

    @Column(name = "is_default")
    private Boolean isDefault = false;

    private String icon = "🏛️";

    @Column(name = "bank_name", columnDefinition = "TEXT")
    private String bankName;

    @Column(name = "account_holder", columnDefinition = "TEXT")
    private String accountHolder;

    @Column(name = "account_number", columnDefinition = "TEXT")
    private String accountNumber;

    @Column(name = "routing_number", columnDefinition = "TEXT")
    private String routingNumber;

    @Column(name = "payment_type")
    private String paymentType = "Direct Deposit (ACH)";

    @Column(name = "account_type")
    private String accountType = "Checking";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public PayoutAccount() {}

    public PayoutAccount(String id, String userEmail, String freelancerName, String name, String type, String detail, Boolean isDefault, String icon, String bankName, String accountHolder, String accountNumber, String routingNumber, String paymentType, String accountType) {
        this.id = id;
        this.userEmail = userEmail;
        this.freelancerName = freelancerName;
        this.name = name;
        this.type = type;
        this.detail = detail;
        this.isDefault = isDefault;
        this.icon = icon;
        this.bankName = bankName;
        this.accountHolder = accountHolder;
        this.accountNumber = accountNumber;
        this.routingNumber = routingNumber;
        this.paymentType = paymentType;
        this.accountType = accountType;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getFreelancerName() {
        return freelancerName;
    }

    public void setFreelancerName(String freelancerName) {
        this.freelancerName = freelancerName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    public String getBadge() {
        return badge;
    }

    public void setBadge(String badge) {
        this.badge = badge;
    }

    public Boolean getIsDefault() {
        return isDefault != null ? isDefault : false;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getAccountHolder() {
        return accountHolder;
    }

    public void setAccountHolder(String accountHolder) {
        this.accountHolder = accountHolder;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getRoutingNumber() {
        return routingNumber;
    }

    public void setRoutingNumber(String routingNumber) {
        this.routingNumber = routingNumber;
    }

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
