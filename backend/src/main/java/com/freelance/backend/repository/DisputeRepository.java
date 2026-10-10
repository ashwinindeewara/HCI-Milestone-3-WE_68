package com.freelance.backend.repository;

import com.freelance.backend.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisputeRepository extends JpaRepository<Dispute, String> {
    List<Dispute> findByStatus(String status);

    List<Dispute> findByStatusType(String statusType);

    List<Dispute> findByClientNameIgnoreCaseOrderByCreatedAtDesc(String clientName);
}
