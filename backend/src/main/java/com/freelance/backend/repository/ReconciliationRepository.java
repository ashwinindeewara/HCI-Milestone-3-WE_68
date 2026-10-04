package com.freelance.backend.repository;

import com.freelance.backend.entity.ReconciliationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReconciliationRepository extends JpaRepository<ReconciliationRecord, Long> {
    List<ReconciliationRecord> findByStatus(String status);
    List<ReconciliationRecord> findByBatchId(String batchId);
}
