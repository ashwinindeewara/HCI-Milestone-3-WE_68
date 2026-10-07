package com.freelance.backend.repository;

import com.freelance.backend.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MilestoneRepository extends JpaRepository<Milestone, String> {
    List<Milestone> findByContractId(String contractId);
    List<Milestone> findByContractIdIn(List<String> contractIds);
    List<Milestone> findByStatus(String status);
}
