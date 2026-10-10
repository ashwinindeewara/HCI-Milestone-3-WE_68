package com.freelance.backend.dto;

import java.util.List;

public class DashboardMetricsDTO {
    private int activeContractsCount;
    private Double totalEarnings;
    private int pendingMilestonesCount;
    private Double totalInEscrow;
    private List<RecentActivity> recentActivity;

    public DashboardMetricsDTO() {}

    public DashboardMetricsDTO(int activeContractsCount, Double totalEarnings, int pendingMilestonesCount, Double totalInEscrow, List<RecentActivity> recentActivity) {
        this.activeContractsCount = activeContractsCount;
        this.totalEarnings = totalEarnings;
        this.pendingMilestonesCount = pendingMilestonesCount;
        this.totalInEscrow = totalInEscrow;
        this.recentActivity = recentActivity;
    }

    public int getActiveContractsCount() {
        return activeContractsCount;
    }

    public void setActiveContractsCount(int activeContractsCount) {
        this.activeContractsCount = activeContractsCount;
    }

    public Double getTotalEarnings() {
        return totalEarnings;
    }

    public void setTotalEarnings(Double totalEarnings) {
        this.totalEarnings = totalEarnings;
    }

    public int getPendingMilestonesCount() {
        return pendingMilestonesCount;
    }

    public void setPendingMilestonesCount(int pendingMilestonesCount) {
        this.pendingMilestonesCount = pendingMilestonesCount;
    }

    public Double getTotalInEscrow() {
        return totalInEscrow;
    }

    public void setTotalInEscrow(Double totalInEscrow) {
        this.totalInEscrow = totalInEscrow;
    }

    public List<RecentActivity> getRecentActivity() {
        return recentActivity;
    }

    public void setRecentActivity(List<RecentActivity> recentActivity) {
        this.recentActivity = recentActivity;
    }

    public static class RecentActivity {
        private String id;
        private String title;
        private String description;
        private String timestamp;
        private String type;

        public RecentActivity() {}

        public RecentActivity(String id, String title, String description, String timestamp, String type) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.timestamp = timestamp;
            this.type = type;
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

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }
    }
}
