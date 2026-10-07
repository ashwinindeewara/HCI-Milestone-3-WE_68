package com.freelance.backend.repository;

import com.freelance.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, String> {
    
    List<Transaction> findByType(String type);

    List<Transaction> findByStatus(String status);

    List<Transaction> findByStatusIgnoreCase(String status);

    List<Transaction> findByStatusInIgnoreCase(Collection<String> statuses);

    Long countByStatusIgnoreCase(String status);

    List<Transaction> findByContractId(String contractId);

    Optional<Transaction> findByReferenceNo(String referenceNo);
}
