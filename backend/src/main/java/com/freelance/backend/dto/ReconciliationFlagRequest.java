package com.freelance.backend.dto;

public class ReconciliationFlagRequest {
    private String reason;

    public ReconciliationFlagRequest() {}

    public ReconciliationFlagRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
