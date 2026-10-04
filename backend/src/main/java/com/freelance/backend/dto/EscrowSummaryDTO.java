package com.freelance.backend.dto;

public class EscrowSummaryDTO {
    private Double totalInEscrow;
    private Double fundedAmount;
    private Double releasedAmount;
    private Double availableBalance;

    public EscrowSummaryDTO() {}

    public EscrowSummaryDTO(Double totalInEscrow, Double fundedAmount, Double releasedAmount, Double availableBalance) {
        this.totalInEscrow = totalInEscrow;
        this.fundedAmount = fundedAmount;
        this.releasedAmount = releasedAmount;
        this.availableBalance = availableBalance;
    }

    public Double getTotalInEscrow() {
        return totalInEscrow;
    }

    public void setTotalInEscrow(Double totalInEscrow) {
        this.totalInEscrow = totalInEscrow;
    }

    public Double getFundedAmount() {
        return fundedAmount;
    }

    public void setFundedAmount(Double fundedAmount) {
        this.fundedAmount = fundedAmount;
    }

    public Double getReleasedAmount() {
        return releasedAmount;
    }

    public void setReleasedAmount(Double releasedAmount) {
        this.releasedAmount = releasedAmount;
    }

    public Double getAvailableBalance() {
        return availableBalance;
    }

    public void setAvailableBalance(Double availableBalance) {
        this.availableBalance = availableBalance;
    }
}
