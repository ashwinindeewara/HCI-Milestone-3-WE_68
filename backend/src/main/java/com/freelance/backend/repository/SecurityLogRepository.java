package com.freelance.backend.repository;

import com.freelance.backend.entity.SecurityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityLogRepository extends JpaRepository<SecurityLog, Long> {
    List<SecurityLog> findByUserEmail(String userEmail);
    List<SecurityLog> findTop20ByOrderByTimestampDesc();
}
