package com.freelance.backend.repository;

import com.freelance.backend.entity.Deliverable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliverableRepository extends JpaRepository<Deliverable, String> {
    List<Deliverable> findByMilestoneId(String milestoneId);
}
