package com.freelance.backend.dto;

public class FundReleaseRequest {
    private String milestoneId;

    public FundReleaseRequest() {}

    public FundReleaseRequest(String milestoneId) {
        this.milestoneId = milestoneId;
    }

    public String getMilestoneId() {
        return milestoneId;
    }

    public void setMilestoneId(String milestoneId) {
        this.milestoneId = milestoneId;
    }
}
