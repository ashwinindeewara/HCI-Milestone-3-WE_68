package com.freelance.backend.service;

import com.freelance.backend.entity.Transaction;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private com.freelance.backend.repository.ContractRepository contractRepository;

    public List<Transaction> getAllTransactions(String typeFilter) {
        return getAllTransactions(typeFilter, null);
    }

    public List<Transaction> getAllTransactions(String typeFilter, String freelancerName) {
        List<Transaction> list = transactionRepository.findAll();

        if (freelancerName != null && !freelancerName.isBlank()) {
            if (freelancerName.toLowerCase().contains("chathuni")) {
                // Keep seeded demo transactions for Chathuni
            } else {
                List<String> contractIds = contractRepository.findByFreelancerNameIgnoreCase(freelancerName.trim()).stream()
                        .map(com.freelance.backend.entity.Contract::getId)
                        .toList();
                if (contractIds.isEmpty()) {
                    list = List.of();
                } else {
                    list = transactionRepository.findByContractIdIn(contractIds);
                }
            }
        }

        if (typeFilter != null && !typeFilter.isEmpty() && !"ALL".equalsIgnoreCase(typeFilter)) {
            list = list.stream().filter(t -> typeFilter.equalsIgnoreCase(t.getType())).toList();
        }
        return list;
    }

    public Transaction getTransactionById(String id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
    }

    public Transaction recordTransaction(String contractId, String milestoneId, String milestoneTitle, Double amount, String type, String status) {
        String txId = "TXN-" + (1000 + new Random().nextInt(9000));
        String refNo = "FTX-" + (10000 + new Random().nextInt(90000));
        String timestamp = "Just now";

        Transaction tx = new Transaction(txId, refNo, contractId, milestoneId, milestoneTitle, amount, type, status, timestamp);
        return transactionRepository.save(tx);
    }
}
