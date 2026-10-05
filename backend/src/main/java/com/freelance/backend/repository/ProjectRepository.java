package com.freelance.backend.repository;

import com.freelance.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {
    Optional<Project> findByContractId(String contractId);
    List<Project> findByFreelancerNameIgnoreCase(String freelancerName);
    List<Project> findByClientNameIgnoreCase(String clientName);
    List<Project> findAllByOrderByCreatedAtDesc();
}
