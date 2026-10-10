package com.freelance.backend.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReportSummaryDTO {
    private String reportId;
    private String generatedAt;
    private String period;
    private String userEmail;
    private String userRole;

    private AccountBalanceDTO accountBalance = new AccountBalanceDTO();
    private MilestonesReportDTO projectMilestones = new MilestonesReportDTO();
    private TransactionsReportDTO paymentTransactions = new TransactionsReportDTO();
    private WithdrawalsReportDTO withdrawalHistories = new WithdrawalsReportDTO();
    private SummaryMetricsDTO summaryMetrics = new SummaryMetricsDTO();

    public ReportSummaryDTO() {}

    public ReportSummaryDTO(String reportId, String generatedAt, String period, String userEmail, String userRole) {
        this.reportId = reportId;
        this.generatedAt = generatedAt;
        this.period = period;
        this.userEmail = userEmail;
        this.userRole = userRole;
    }

    public String getReportId() {
        return reportId;
    }

    public void setReportId(String reportId) {
        this.reportId = reportId;
    }

    public String getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(String generatedAt) {
        this.generatedAt = generatedAt;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public AccountBalanceDTO getAccountBalance() {
        return accountBalance;
    }

    public void setAccountBalance(AccountBalanceDTO accountBalance) {
        this.accountBalance = accountBalance;
    }

    public MilestonesReportDTO getProjectMilestones() {
        return projectMilestones;
    }

    public void setProjectMilestones(MilestonesReportDTO projectMilestones) {
        this.projectMilestones = projectMilestones;
    }

    public TransactionsReportDTO getPaymentTransactions() {
        return paymentTransactions;
    }

    public void setPaymentTransactions(TransactionsReportDTO paymentTransactions) {
        this.paymentTransactions = paymentTransactions;
    }

    public WithdrawalsReportDTO getWithdrawalHistories() {
        return withdrawalHistories;
    }

    public void setWithdrawalHistories(WithdrawalsReportDTO withdrawalHistories) {
        this.withdrawalHistories = withdrawalHistories;
    }

    public SummaryMetricsDTO getSummaryMetrics() {
        return summaryMetrics;
    }

    public void setSummaryMetrics(SummaryMetricsDTO summaryMetrics) {
        this.summaryMetrics = summaryMetrics;
    }

    // --- Inner DTO Classes ---

    public static class AccountBalanceDTO {
        private Double totalInEscrow = 0.0;
        private Double totalPaidOut = 0.0;
        private Double totalEarningsOrSpendings = 0.0;
        private Double availableBalance = 0.0;
        private Integer payoutAccountsCount = 0;
        private List<PayoutAccountItemDTO> payoutAccounts = new ArrayList<>();

        public Double getTotalInEscrow() {
            return totalInEscrow;
        }

        public void setTotalInEscrow(Double totalInEscrow) {
            this.totalInEscrow = totalInEscrow;
        }

        public Double getTotalPaidOut() {
            return totalPaidOut;
        }

        public void setTotalPaidOut(Double totalPaidOut) {
            this.totalPaidOut = totalPaidOut;
        }

        public Double getTotalEarningsOrSpendings() {
            return totalEarningsOrSpendings;
        }

        public void setTotalEarningsOrSpendings(Double totalEarningsOrSpendings) {
            this.totalEarningsOrSpendings = totalEarningsOrSpendings;
        }

        public Double getAvailableBalance() {
            return availableBalance;
        }

        public void setAvailableBalance(Double availableBalance) {
            this.availableBalance = availableBalance;
        }

        public Integer getPayoutAccountsCount() {
            return payoutAccountsCount;
        }

        public void setPayoutAccountsCount(Integer payoutAccountsCount) {
            this.payoutAccountsCount = payoutAccountsCount;
        }

        public List<PayoutAccountItemDTO> getPayoutAccounts() {
            return payoutAccounts;
        }

        public void setPayoutAccounts(List<PayoutAccountItemDTO> payoutAccounts) {
            this.payoutAccounts = payoutAccounts;
        }
    }

    public static class PayoutAccountItemDTO {
        private String id;
        private String bankName;
        private String accountHolder;
        private String accountNumber;
        private String paymentType;
        private String accountType;
        private Boolean isDefault;
        private String badge;

        public PayoutAccountItemDTO() {}

        public PayoutAccountItemDTO(String id, String bankName, String accountHolder, String accountNumber, String paymentType, String accountType, Boolean isDefault, String badge) {
            this.id = id;
            this.bankName = bankName;
            this.accountHolder = accountHolder;
            this.accountNumber = accountNumber;
            this.paymentType = paymentType;
            this.accountType = accountType;
            this.isDefault = isDefault;
            this.badge = badge;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getBankName() {
            return bankName;
        }

        public void setBankName(String bankName) {
            this.bankName = bankName;
        }

        public String getAccountHolder() {
            return accountHolder;
        }

        public void setAccountHolder(String accountHolder) {
            this.accountHolder = accountHolder;
        }

        public String getAccountNumber() {
            return accountNumber;
        }

        public void setAccountNumber(String accountNumber) {
            this.accountNumber = accountNumber;
        }

        public String getPaymentType() {
            return paymentType;
        }

        public void setPaymentType(String paymentType) {
            this.paymentType = paymentType;
        }

        public String getAccountType() {
            return accountType;
        }

        public void setAccountType(String accountType) {
            this.accountType = accountType;
        }

        public Boolean getIsDefault() {
            return isDefault;
        }

        public void setIsDefault(Boolean isDefault) {
            this.isDefault = isDefault;
        }

        public String getBadge() {
            return badge;
        }

        public void setBadge(String badge) {
            this.badge = badge;
        }
    }

    public static class MilestonesReportDTO {
        private Integer totalMilestones = 0;
        private Integer completedMilestones = 0;
        private Integer fundedMilestones = 0;
        private Integer pendingMilestones = 0;
        private Integer deliveredMilestones = 0;
        private Double totalMilestoneAmount = 0.0;
        private Map<String, Integer> statusBreakdown = new HashMap<>();
        private List<MilestoneReportItemDTO> milestones = new ArrayList<>();

        public Integer getTotalMilestones() {
            return totalMilestones;
        }

        public void setTotalMilestones(Integer totalMilestones) {
            this.totalMilestones = totalMilestones;
        }

        public Integer getCompletedMilestones() {
            return completedMilestones;
        }

        public void setCompletedMilestones(Integer completedMilestones) {
            this.completedMilestones = completedMilestones;
        }

        public Integer getFundedMilestones() {
            return fundedMilestones;
        }

        public void setFundedMilestones(Integer fundedMilestones) {
            this.fundedMilestones = fundedMilestones;
        }

        public Integer getPendingMilestones() {
            return pendingMilestones;
        }

        public void setPendingMilestones(Integer pendingMilestones) {
            this.pendingMilestones = pendingMilestones;
        }

        public Integer getDeliveredMilestones() {
            return deliveredMilestones;
        }

        public void setDeliveredMilestones(Integer deliveredMilestones) {
            this.deliveredMilestones = deliveredMilestones;
        }

        public Double getTotalMilestoneAmount() {
            return totalMilestoneAmount;
        }

        public void setTotalMilestoneAmount(Double totalMilestoneAmount) {
            this.totalMilestoneAmount = totalMilestoneAmount;
        }

        public Map<String, Integer> getStatusBreakdown() {
            return statusBreakdown;
        }

        public void setStatusBreakdown(Map<String, Integer> statusBreakdown) {
            this.statusBreakdown = statusBreakdown;
        }

        public List<MilestoneReportItemDTO> getMilestones() {
            return milestones;
        }

        public void setMilestones(List<MilestoneReportItemDTO> milestones) {
            this.milestones = milestones;
        }
    }

    public static class MilestoneReportItemDTO {
        private String id;
        private String title;
        private String contractId;
        private Double amount;
        private String status;
        private String dueDate;

        public MilestoneReportItemDTO() {}

        public MilestoneReportItemDTO(String id, String title, String contractId, Double amount, String status, String dueDate) {
            this.id = id;
            this.title = title;
            this.contractId = contractId;
            this.amount = amount;
            this.status = status;
            this.dueDate = dueDate;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getContractId() {
            return contractId;
        }

        public void setContractId(String contractId) {
            this.contractId = contractId;
        }

        public Double getAmount() {
            return amount;
        }

        public void setAmount(Double amount) {
            this.amount = amount;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getDueDate() {
            return dueDate;
        }

        public void setDueDate(String dueDate) {
            this.dueDate = dueDate;
        }
    }

    public static class TransactionsReportDTO {
        private Integer totalTransactions = 0;
        private Double totalTransactionVolume = 0.0;
        private Integer completedTransactionsCount = 0;
        private Integer pendingTransactionsCount = 0;
        private Integer failedTransactionsCount = 0;
        private Integer refundedTransactionsCount = 0;
        private Map<String, Integer> typeBreakdown = new HashMap<>();
        private List<TransactionReportItemDTO> transactions = new ArrayList<>();

        public Integer getTotalTransactions() {
            return totalTransactions;
        }

        public void setTotalTransactions(Integer totalTransactions) {
            this.totalTransactions = totalTransactions;
        }

        public Double getTotalTransactionVolume() {
            return totalTransactionVolume;
        }

        public void setTotalTransactionVolume(Double totalTransactionVolume) {
            this.totalTransactionVolume = totalTransactionVolume;
        }

        public Integer getCompletedTransactionsCount() {
            return completedTransactionsCount;
        }

        public void setCompletedTransactionsCount(Integer completedTransactionsCount) {
            this.completedTransactionsCount = completedTransactionsCount;
        }

        public Integer getPendingTransactionsCount() {
            return pendingTransactionsCount;
        }

        public void setPendingTransactionsCount(Integer pendingTransactionsCount) {
            this.pendingTransactionsCount = pendingTransactionsCount;
        }

        public Integer getFailedTransactionsCount() {
            return failedTransactionsCount;
        }

        public void setFailedTransactionsCount(Integer failedTransactionsCount) {
            this.failedTransactionsCount = failedTransactionsCount;
        }

        public Integer getRefundedTransactionsCount() {
            return refundedTransactionsCount;
        }

        public void setRefundedTransactionsCount(Integer refundedTransactionsCount) {
            this.refundedTransactionsCount = refundedTransactionsCount;
        }

        public Map<String, Integer> getTypeBreakdown() {
            return typeBreakdown;
        }

        public void setTypeBreakdown(Map<String, Integer> typeBreakdown) {
            this.typeBreakdown = typeBreakdown;
        }

        public List<TransactionReportItemDTO> getTransactions() {
            return transactions;
        }

        public void setTransactions(List<TransactionReportItemDTO> transactions) {
            this.transactions = transactions;
        }
    }

    public static class TransactionReportItemDTO {
        private String id;
        private String referenceNo;
        private String milestoneTitle;
        private Double amount;
        private String type;
        private String status;
        private String timestamp;

        public TransactionReportItemDTO() {}

        public TransactionReportItemDTO(String id, String referenceNo, String milestoneTitle, Double amount, String type, String status, String timestamp) {
            this.id = id;
            this.referenceNo = referenceNo;
            this.milestoneTitle = milestoneTitle;
            this.amount = amount;
            this.type = type;
            this.status = status;
            this.timestamp = timestamp;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getReferenceNo() {
            return referenceNo;
        }

        public void setReferenceNo(String referenceNo) {
            this.referenceNo = referenceNo;
        }

        public String getMilestoneTitle() {
            return milestoneTitle;
        }

        public void setMilestoneTitle(String milestoneTitle) {
            this.milestoneTitle = milestoneTitle;
        }

        public Double getAmount() {
            return amount;
        }

        public void setAmount(Double amount) {
            this.amount = amount;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }

    public static class WithdrawalsReportDTO {
        private Integer totalWithdrawals = 0;
        private Double totalWithdrawalAmount = 0.0;
        private Map<String, Integer> statusBreakdown = new HashMap<>();
        private List<WithdrawalReportItemDTO> withdrawals = new ArrayList<>();

        public Integer getTotalWithdrawals() {
            return totalWithdrawals;
        }

        public void setTotalWithdrawals(Integer totalWithdrawals) {
            this.totalWithdrawals = totalWithdrawals;
        }

        public Double getTotalWithdrawalAmount() {
            return totalWithdrawalAmount;
        }

        public void setTotalWithdrawalAmount(Double totalWithdrawalAmount) {
            this.totalWithdrawalAmount = totalWithdrawalAmount;
        }

        public Map<String, Integer> getStatusBreakdown() {
            return statusBreakdown;
        }

        public void setStatusBreakdown(Map<String, Integer> statusBreakdown) {
            this.statusBreakdown = statusBreakdown;
        }

        public List<WithdrawalReportItemDTO> getWithdrawals() {
            return withdrawals;
        }

        public void setWithdrawals(List<WithdrawalReportItemDTO> withdrawals) {
            this.withdrawals = withdrawals;
        }
    }

    public static class WithdrawalReportItemDTO {
        private String id;
        private String referenceNo;
        private Double amount;
        private String payoutMethod;
        private String status;
        private String timestamp;

        public WithdrawalReportItemDTO() {}

        public WithdrawalReportItemDTO(String id, String referenceNo, Double amount, String payoutMethod, String status, String timestamp) {
            this.id = id;
            this.referenceNo = referenceNo;
            this.amount = amount;
            this.payoutMethod = payoutMethod;
            this.status = status;
            this.timestamp = timestamp;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getReferenceNo() {
            return referenceNo;
        }

        public void setReferenceNo(String referenceNo) {
            this.referenceNo = referenceNo;
        }

        public Double getAmount() {
            return amount;
        }

        public void setAmount(Double amount) {
            this.amount = amount;
        }

        public String getPayoutMethod() {
            return payoutMethod;
        }

        public void setPayoutMethod(String payoutMethod) {
            this.payoutMethod = payoutMethod;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }

    public static class SummaryMetricsDTO {
        private Double netTotal = 0.0;
        private Double successRate = 100.0;
        private String formattedTotalInEscrow = "$0.00";
        private String formattedTotalPaidOut = "$0.00";
        private String formattedTotalWithdrawals = "$0.00";
        private String formattedNetTotal = "$0.00";

        public Double getNetTotal() {
            return netTotal;
        }

        public void setNetTotal(Double netTotal) {
            this.netTotal = netTotal;
        }

        public Double getSuccessRate() {
            return successRate;
        }

        public void setSuccessRate(Double successRate) {
            this.successRate = successRate;
        }

        public String getFormattedTotalInEscrow() {
            return formattedTotalInEscrow;
        }

        public void setFormattedTotalInEscrow(String formattedTotalInEscrow) {
            this.formattedTotalInEscrow = formattedTotalInEscrow;
        }

        public String getFormattedTotalPaidOut() {
            return formattedTotalPaidOut;
        }

        public void setFormattedTotalPaidOut(String formattedTotalPaidOut) {
            this.formattedTotalPaidOut = formattedTotalPaidOut;
        }

        public String getFormattedTotalWithdrawals() {
            return formattedTotalWithdrawals;
        }

        public void setFormattedTotalWithdrawals(String formattedTotalWithdrawals) {
            this.formattedTotalWithdrawals = formattedTotalWithdrawals;
        }

        public String getFormattedNetTotal() {
            return formattedNetTotal;
        }

        public void setFormattedNetTotal(String formattedNetTotal) {
            this.formattedNetTotal = formattedNetTotal;
        }
    }
}
