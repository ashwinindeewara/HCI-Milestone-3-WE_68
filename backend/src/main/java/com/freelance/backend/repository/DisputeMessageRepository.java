package com.freelance.backend.repository;

import com.freelance.backend.entity.DisputeMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeMessageRepository extends JpaRepository<DisputeMessage, Long> {
    List<DisputeMessage> findByDisputeIdOrderByCreatedAtAsc(String disputeId);
    List<DisputeMessage> findByDisputeIdOrderByIdAsc(String disputeId);
}
