package com.freelance.backend.dto;

import com.freelance.backend.entity.Transaction;
import java.util.List;

public class StaffDashboardMetricsDTO {
    private Double totalEscrowHold;
    private Double totalProcessed;
    private long pendingTransactionsCount;
    private long heldTransactionsCount;
    private long openDisputesCount;
    private List<Transaction> recentActivity;

    public StaffDashboardMetricsDTO() {}

    public StaffDashboardMetricsDTO(Double totalEscrowHold, Double totalProcessed, long pendingTransactionsCount, long openDisputesCount) {
        this.totalEscrowHold = totalEscrowHold;
        this.totalProcessed = totalProcessed;
        this.pendingTransactionsCount = pendingTransactionsCount;
        this.openDisputesCount = openDisputesCount;
    }

    public StaffDashboardMetricsDTO(Double totalEscrowHold, Double totalProcessed, long pendingTransactionsCount, long heldTransactionsCount, long openDisputesCount, List<Transaction> recentActivity) {
        this.totalEscrowHold = totalEscrowHold;
        this.totalProcessed = totalProcessed;
        this.pendingTransactionsCount = pendingTransactionsCount;
        this.heldTransactionsCount = heldTransactionsCount;
        this.openDisputesCount = openDisputesCount;
        this.recentActivity = recentActivity;
    }

    public Double getTotalEscrowHold() {
        return totalEscrowHold;
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
        return pendingTransactionsCount;
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

    public List<Transaction> getRecentActivity() {
        return recentActivity;
    }

    public void setRecentActivity(List<Transaction> recentActivity) {
        this.recentActivity = recentActivity;
    }
}
