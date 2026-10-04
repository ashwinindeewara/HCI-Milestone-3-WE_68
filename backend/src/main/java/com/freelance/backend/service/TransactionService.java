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

    public List<Transaction> getAllTransactions(String typeFilter) {
        if (typeFilter != null && !typeFilter.isEmpty() && !"ALL".equalsIgnoreCase(typeFilter)) {
            return transactionRepository.findByType(typeFilter.toUpperCase());
        }
        return transactionRepository.findAll();
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
