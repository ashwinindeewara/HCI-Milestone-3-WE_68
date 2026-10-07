package com.freelance.backend.dto;

public class ReconciliationNoteRequest {
    private String note;
    private String notes;

    public ReconciliationNoteRequest() {}

    public ReconciliationNoteRequest(String note) {
        this.note = note;
        this.notes = note;
    }

    public String getNote() {
        return note != null ? note : notes;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getNotes() {
        return notes != null ? notes : note;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
