package com.freelance.backend.repository;

import com.freelance.backend.entity.ReconciliationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReconciliationRepository extends JpaRepository<ReconciliationRecord, Long> {
    List<ReconciliationRecord> findByStatusIgnoreCase(String status);
    List<ReconciliationRecord> findByStatusInIgnoreCase(List<String> statuses);
    Optional<ReconciliationRecord> findByReferenceNo(String referenceNo);
    List<ReconciliationRecord> findByBatchId(String batchId);
    long countByStatusIgnoreCase(String status);
    long countByStatusInIgnoreCase(List<String> statuses);
}

