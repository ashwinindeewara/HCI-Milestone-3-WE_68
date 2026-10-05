package com.freelance.backend.dto;

import com.freelance.backend.entity.Transaction;
import java.util.List;

public class StaffDashboardMetricsDTO {
    private Double currentEscrowHoldBalance;
    private Double totalProcessed;
    private Long pendingHoldCount;
    private Long failedPaymentsCount;
    private Long refunds30dCount;
    private List<Transaction> recentActivity;

    public StaffDashboardMetricsDTO() {}

    public StaffDashboardMetricsDTO(Double currentEscrowHoldBalance, Double totalProcessed, Long pendingHoldCount, Long failedPaymentsCount, Long refunds30dCount, List<Transaction> recentActivity) {
        this.currentEscrowHoldBalance = currentEscrowHoldBalance;
        this.totalProcessed = totalProcessed;
        this.pendingHoldCount = pendingHoldCount;
        this.failedPaymentsCount = failedPaymentsCount;
        this.refunds30dCount = refunds30dCount;
        this.recentActivity = recentActivity;
    }

    public Double getCurrentEscrowHoldBalance() {
        return currentEscrowHoldBalance;
    }

    public void setCurrentEscrowHoldBalance(Double currentEscrowHoldBalance) {
        this.currentEscrowHoldBalance = currentEscrowHoldBalance;
    }

    public Double getTotalProcessed() {
        return totalProcessed;
    }

    public void setTotalProcessed(Double totalProcessed) {
        this.totalProcessed = totalProcessed;
    }

    public Long getPendingHoldCount() {
        return pendingHoldCount;
    }

    public void setPendingHoldCount(Long pendingHoldCount) {
        this.pendingHoldCount = pendingHoldCount;
    }

    public Long getFailedPaymentsCount() {
        return failedPaymentsCount;
    }

    public void setFailedPaymentsCount(Long failedPaymentsCount) {
        this.failedPaymentsCount = failedPaymentsCount;
    }

    public Long getRefunds30dCount() {
        return refunds30dCount;
    }

    public void setRefunds30dCount(Long refunds30dCount) {
        this.refunds30dCount = refunds30dCount;
    }

    public List<Transaction> getRecentActivity() {
        return recentActivity;
    }

    public void setRecentActivity(List<Transaction> recentActivity) {
        this.recentActivity = recentActivity;
    }
}
