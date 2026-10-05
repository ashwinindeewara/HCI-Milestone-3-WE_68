package com.freelance.backend.service;

import com.freelance.backend.dto.StaffDashboardMetricsDTO;
import com.freelance.backend.entity.Transaction;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.TransactionRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @PostConstruct
    public void seedInitialTransactions() {
        if (transactionRepository.count() == 0) {
            transactionRepository.saveAll(Arrays.asList(
                new Transaction("TXN-2847", "FTX-90124", "CTR-101", "MS-1", "E-Commerce Redesign", 3150.0, "FUND", "COMPLETED", "Today, 2:45 PM"),
                new Transaction("TXN-2846", "FTX-90125", "CTR-102", "MS-2", "API Integration", 1200.0, "FUND", "PENDING", "Today, 11:15 AM"),
                new Transaction("TXN-2845", "FTX-90126", "CTR-103", "MS-1", "Illustrations & Branding", 4800.0, "RELEASE", "COMPLETED", "Yesterday"),
                new Transaction("TXN-2844", "FTX-90127", "CTR-104", "MS-3", "React Landing Page", 950.0, "FUND", "FAILED", "Oct 12, 2024"),
                new Transaction("TXN-2843", "FTX-90128", "CTR-105", "MS-1", "Mobile App UI Audit", 1500.0, "FUND", "FAILED", "Oct 11, 2024"),
                new Transaction("TXN-2842", "FTX-90129", "CTR-106", "MS-2", "Escrow Refund Settlement", 650.0, "REFUND", "REFUNDED", "Oct 10, 2024"),
                new Transaction("TXN-2841", "FTX-90130", "CTR-107", "MS-1", "Database Migration Project", 2400.0, "FUND", "PENDING", "Oct 09, 2024")
            ));
        }
    }

    public List<Transaction> getAllTransactions(String statusFilter, String typeFilter) {
        if (statusFilter != null && !statusFilter.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusFilter)) {
            return transactionRepository.findByStatusIgnoreCase(statusFilter.trim());
        }
        if (typeFilter != null && !typeFilter.trim().isEmpty() && !"ALL".equalsIgnoreCase(typeFilter)) {
            return transactionRepository.findByType(typeFilter.trim().toUpperCase());
        }
        return transactionRepository.findAll();
    }

    public Transaction getTransactionById(String id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public StaffDashboardMetricsDTO getStaffDashboardMetrics() {
        List<Transaction> all = transactionRepository.findAll();

        Double totalEscrowHold = all.stream()
                .filter(t -> "PENDING".equalsIgnoreCase(t.getStatus()) || "HELD".equalsIgnoreCase(t.getStatus()) || "IN_ESCROW".equalsIgnoreCase(t.getStatus()))
                .mapToDouble(Transaction::getAmount)
                .sum();

        Double totalProcessed = all.stream()
                .filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus()))
                .mapToDouble(Transaction::getAmount)
                .sum();

        long pendingCount = all.stream()
                .filter(t -> "PENDING".equalsIgnoreCase(t.getStatus()) || "HELD".equalsIgnoreCase(t.getStatus()) || "IN_ESCROW".equalsIgnoreCase(t.getStatus()))
                .count();

        long failedCount = all.stream()
                .filter(t -> "FAILED".equalsIgnoreCase(t.getStatus()))
                .count();

        long refundCount = all.stream()
                .filter(t -> "REFUNDED".equalsIgnoreCase(t.getStatus()) || "REFUND".equalsIgnoreCase(t.getType()))
                .count();

        List<Transaction> recentActivity = all.stream()
                .sorted((t1, t2) -> {
                    if (t1.getCreatedAt() != null && t2.getCreatedAt() != null) {
                        return t2.getCreatedAt().compareTo(t1.getCreatedAt());
                    }
                    return t2.getId().compareTo(t1.getId());
                })
                .limit(10)
                .toList();

        return new StaffDashboardMetricsDTO(
            totalEscrowHold,
            totalProcessed,
            pendingCount,
            failedCount,
            refundCount,
            recentActivity
        );
    }

    public Transaction recordTransaction(String contractId, String milestoneId, String milestoneTitle, Double amount, String type, String status) {
        String txId = "TXN-" + (1000 + new Random().nextInt(9000));
        String refNo = "FTX-" + (10000 + new Random().nextInt(90000));
        String timestamp = "Just now";

        Transaction tx = new Transaction(txId, refNo, contractId, milestoneId, milestoneTitle, amount, type, status, timestamp);
        return transactionRepository.save(tx);
    }
}
