package com.freelance.backend.repository;

import com.freelance.backend.entity.Contract;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, String> {
    @Override
    @EntityGraph(attributePaths = {"milestones"})
    List<Contract> findAll();

    List<Contract> findByClientNameOrFreelancerName(String clientName, String freelancerName);
    List<Contract> findByFreelancerNameIgnoreCase(String freelancerName);
    List<Contract> findByFreelancerEmailIgnoreCase(String freelancerEmail);
    List<Contract> findByStatus(String status);
}