package com.freelance.backend.repository;

import com.freelance.backend.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, String> {
    List<Milestone> findByContractId(String contractId);
    List<Milestone> findByContractIdIn(List<String> contractIds);
    List<Milestone> findByStatus(String status);
}
