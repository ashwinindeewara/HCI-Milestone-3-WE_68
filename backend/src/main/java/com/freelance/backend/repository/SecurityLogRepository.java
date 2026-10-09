package com.freelance.backend.repository;

import com.freelance.backend.entity.SecurityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SecurityLogRepository extends JpaRepository<SecurityLog, Long> {
    List<SecurityLog> findByUserEmail(String userEmail);
    List<SecurityLog> findTop20ByOrderByTimestampDesc();
}
