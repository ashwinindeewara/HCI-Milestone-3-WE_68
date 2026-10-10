package com.freelance.backend.repository;

import com.freelance.backend.entity.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {
    List<AdminAuditLog> findByActionType(String actionType);
    List<AdminAuditLog> findByAdminEmail(String adminEmail);
}
