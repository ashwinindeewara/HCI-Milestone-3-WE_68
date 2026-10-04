package com.freelance.backend.repository;

import com.freelance.backend.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, String> {
    List<Dispute> findByStatus(String status);
    List<Dispute> findByStatusType(String statusType);
}
