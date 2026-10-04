package com.freelance.backend.repository;

import com.freelance.backend.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, String> {
    List<Contract> findByClientNameOrFreelancerName(String clientName, String freelancerName);
    List<Contract> findByStatus(String status);
}
