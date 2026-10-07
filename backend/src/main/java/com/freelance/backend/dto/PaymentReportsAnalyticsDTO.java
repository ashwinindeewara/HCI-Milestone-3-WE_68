package com.freelance.backend.dto;

import java.util.List;

public class PaymentReportsAnalyticsDTO {
    private String dateRange;
    private Double successRatePercentage;
    private String dailyTxnsAvg;
    private String weeklyTrendAvg;
    private Long refundsRequestedCount;
    private String refundsVolumePercentage;
    private Long failedPaymentsCount;
    private List<Integer> dailyBars;
    private List<Integer> weeklyBars;

    public PaymentReportsAnalyticsDTO() {}

    public PaymentReportsAnalyticsDTO(String dateRange, Double successRatePercentage, String dailyTxnsAvg, String weeklyTrendAvg, Long refundsRequestedCount, String refundsVolumePercentage, Long failedPaymentsCount, List<Integer> dailyBars, List<Integer> weeklyBars) {
        this.dateRange = dateRange;
        this.successRatePercentage = successRatePercentage;
        this.dailyTxnsAvg = dailyTxnsAvg;
        this.weeklyTrendAvg = weeklyTrendAvg;
        this.refundsRequestedCount = refundsRequestedCount;
        this.refundsVolumePercentage = refundsVolumePercentage;
        this.failedPaymentsCount = failedPaymentsCount;
        this.dailyBars = dailyBars;
        this.weeklyBars = weeklyBars;
    }

    public String getDateRange() {
        return dateRange;
    }

    public void setDateRange(String dateRange) {
        this.dateRange = dateRange;
    }

    public Double getSuccessRatePercentage() {
        return successRatePercentage;
    }

    public void setSuccessRatePercentage(Double successRatePercentage) {
        this.successRatePercentage = successRatePercentage;
    }

    public String getDailyTxnsAvg() {
        return dailyTxnsAvg;
    }

    public void setDailyTxnsAvg(String dailyTxnsAvg) {
        this.dailyTxnsAvg = dailyTxnsAvg;
    }

    public String getWeeklyTrendAvg() {
        return weeklyTrendAvg;
    }

    public void setWeeklyTrendAvg(String weeklyTrendAvg) {
        this.weeklyTrendAvg = weeklyTrendAvg;
    }

    public Long getRefundsRequestedCount() {
        return refundsRequestedCount;
    }

    public void setRefundsRequestedCount(Long refundsRequestedCount) {
        this.refundsRequestedCount = refundsRequestedCount;
    }

    public String getRefundsVolumePercentage() {
        return refundsVolumePercentage;
    }

    public void setRefundsVolumePercentage(String refundsVolumePercentage) {
        this.refundsVolumePercentage = refundsVolumePercentage;
    }

    public Long getFailedPaymentsCount() {
        return failedPaymentsCount;
    }

    public void setFailedPaymentsCount(Long failedPaymentsCount) {
        this.failedPaymentsCount = failedPaymentsCount;
    }

    public List<Integer> getDailyBars() {
        return dailyBars;
    }

    public void setDailyBars(List<Integer> dailyBars) {
        this.dailyBars = dailyBars;
    }

    public List<Integer> getWeeklyBars() {
        return weeklyBars;
    }

    public void setWeeklyBars(List<Integer> weeklyBars) {
        this.weeklyBars = weeklyBars;
    }
}
