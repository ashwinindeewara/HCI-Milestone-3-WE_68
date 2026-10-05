package com.freelance.backend.dto;

public class ReconciliationNoteRequest {
    private String notes;

    public ReconciliationNoteRequest() {}

    public ReconciliationNoteRequest(String notes) {
        this.notes = notes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
