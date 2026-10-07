package com.freelance.backend.dto;

public class ReconciliationFlagRequest {
    private String reason;
    private String flagReason;

    public ReconciliationFlagRequest() {}

    public ReconciliationFlagRequest(String reason) {
        this.reason = reason;
        this.flagReason = reason;
    }

    public String getReason() {
        return reason != null ? reason : flagReason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getFlagReason() {
        return flagReason != null ? flagReason : reason;
    }

    public void setFlagReason(String flagReason) {
        this.flagReason = flagReason;
    }
}
