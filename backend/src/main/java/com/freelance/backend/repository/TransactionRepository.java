package com.freelance.backend.repository;

import com.freelance.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {
    List<Transaction> findByType(String type);
    List<Transaction> findByStatus(String status);
    List<Transaction> findByContractId(String contractId);
    List<Transaction> findByContractIdIn(List<String> contractIds);
}
