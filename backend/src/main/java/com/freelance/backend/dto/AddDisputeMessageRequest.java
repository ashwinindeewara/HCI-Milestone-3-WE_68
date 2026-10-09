package com.freelance.backend.dto;

public class AddDisputeMessageRequest {
    private String senderName;
    private String senderRole;
    private String message;

    public AddDisputeMessageRequest() {}

    public AddDisputeMessageRequest(String senderName, String senderRole, String message) {
        this.senderName = senderName;
        this.senderRole = senderRole;
        this.message = message;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
