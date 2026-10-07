package com.freelance.backend.dto;

import com.freelance.backend.entity.Transaction;
import java.util.List;

public class StaffDashboardMetricsDTO {
    // Fields from feature/admin
    private Double totalEscrowHold;
    private Double totalProcessed;
    private long pendingTransactionsCount;
    private long heldTransactionsCount;
    private long openDisputesCount;

    // Fields from develop
    private Double currentEscrowHoldBalance;
    private Long pendingHoldCount;
    private Long failedPaymentsCount;
    private Long refunds30dCount;
    
    private List<Transaction> recentActivity;

    public StaffDashboardMetricsDTO() {}

    // Constructor combining everything for maximum compatibility
    public StaffDashboardMetricsDTO(Double totalEscrowHold, Double totalProcessed, 
                                    long pendingTransactionsCount, long heldTransactionsCount, 
                                    long openDisputesCount, Double currentEscrowHoldBalance, 
                                    Long pendingHoldCount, Long failedPaymentsCount, 
                                    Long refunds30dCount, List<Transaction> recentActivity) {
        this.totalEscrowHold = totalEscrowHold;
        this.totalProcessed = totalProcessed;
        this.pendingTransactionsCount = pendingTransactionsCount;
        this.heldTransactionsCount = heldTransactionsCount;
        this.openDisputesCount = openDisputesCount;
        this.currentEscrowHoldBalance = currentEscrowHoldBalance;
        this.pendingHoldCount = pendingHoldCount;
        this.failedPaymentsCount = failedPaymentsCount;
        this.refunds30dCount = refunds30dCount;
        this.recentActivity = recentActivity;
    }

    // Getters and Setters for feature/admin fields
    public Double getTotalEscrowHold() {
        return totalEscrowHold != null ? totalEscrowHold : currentEscrowHoldBalance;
    }

    public void setTotalEscrowHold(Double totalEscrowHold) {
        this.totalEscrowHold = totalEscrowHold;
    }

    public Double getTotalProcessed() {
        return totalProcessed;
    }

    public void setTotalProcessed(Double totalProcessed) {
        this.totalProcessed = totalProcessed;
    }

    public long getPendingTransactionsCount() {
        return pendingTransactionsCount != 0 ? pendingTransactionsCount : (pendingHoldCount != null ? pendingHoldCount : 0);
    }

    public void setPendingTransactionsCount(long pendingTransactionsCount) {
        this.pendingTransactionsCount = pendingTransactionsCount;
    }

    public long getHeldTransactionsCount() {
        return heldTransactionsCount;
    }

    public void setHeldTransactionsCount(long heldTransactionsCount) {
        this.heldTransactionsCount = heldTransactionsCount;
    }

    public long getOpenDisputesCount() {
        return openDisputesCount;
    }

    public void setOpenDisputesCount(long openDisputesCount) {
        this.openDisputesCount = openDisputesCount;
    }

    // Getters and Setters for develop fields
    public Double getCurrentEscrowHoldBalance() {
        return currentEscrowHoldBalance != null ? currentEscrowHoldBalance : totalEscrowHold;
    }

    public void setCurrentEscrowHoldBalance(Double currentEscrowHoldBalance) {
        this.currentEscrowHoldBalance = currentEscrowHoldBalance;
    }

    public Long getPendingHoldCount() {
        return pendingHoldCount != null ? pendingHoldCount : pendingTransactionsCount;
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

    // Shared Fields
    public List<Transaction> getRecentActivity() {
        return recentActivity;
    }

    public void setRecentActivity(List<Transaction> recentActivity) {
        this.recentActivity = recentActivity;
    }
}
