package com.freelance.backend.dto;

public class ResolveDisputeRequest {
    private String status; // Resolved, Under Review
    private String statusType; // resolved, review
    private String resolutionNote;
    private String action; // RELEASE_FREELANCER, REFUND_CLIENT

    public ResolveDisputeRequest() {}

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

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }
}
