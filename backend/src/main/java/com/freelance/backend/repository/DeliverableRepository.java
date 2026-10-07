package com.freelance.backend.repository;

import com.freelance.backend.entity.Deliverable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliverableRepository extends JpaRepository<Deliverable, String> {
    List<Deliverable> findByMilestoneId(String milestoneId);
}
