package com.freelance.backend.repository;

import com.freelance.backend.entity.PayoutAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayoutAccountRepository extends JpaRepository<PayoutAccount, String> {
    List<PayoutAccount> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    List<PayoutAccount> findByUserEmailIgnoreCaseOrderByCreatedAtDesc(String userEmail);
    List<PayoutAccount> findByFreelancerNameIgnoreCase(String freelancerName);
    List<PayoutAccount> findByFreelancerNameIgnoreCaseOrderByCreatedAtDesc(String freelancerName);
}
