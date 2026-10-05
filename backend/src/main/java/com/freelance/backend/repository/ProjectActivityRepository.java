package com.freelance.backend.repository;

import com.freelance.backend.entity.ProjectActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectActivityRepository extends JpaRepository<ProjectActivity, Long> {
    List<ProjectActivity> findByProjectIdOrderByCreatedAtDesc(String projectId);
    List<ProjectActivity> findByContractIdOrderByCreatedAtDesc(String contractId);
}
