package com.freelance.backend.dto;

public class ReconciliationCountsDTO {
    private long pending;
    private long matched;
    private long unmatched;

    public ReconciliationCountsDTO() {}

    public ReconciliationCountsDTO(long pending, long matched, long unmatched) {
        this.pending = pending;
        this.matched = matched;
        this.unmatched = unmatched;
    }

    public long getPending() {
        return pending;
    }

    public void setPending(long pending) {
        this.pending = pending;
    }

    public long getMatched() {
        return matched;
    }

    public void setMatched(long matched) {
        this.matched = matched;
    }

    public long getUnmatched() {
        return unmatched;
    }

    public void setUnmatched(long unmatched) {
        this.unmatched = unmatched;
    }
}
