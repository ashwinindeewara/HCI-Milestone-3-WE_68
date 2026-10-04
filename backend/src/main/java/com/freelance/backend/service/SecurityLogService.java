package com.freelance.backend.service;

import com.freelance.backend.entity.SecurityLog;
import com.freelance.backend.repository.SecurityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SecurityLogService {

    @Autowired
    private SecurityLogRepository securityLogRepository;

    public List<SecurityLog> getSecurityLogs() {
        return securityLogRepository.findTop20ByOrderByTimestampDesc();
    }

    public SecurityLog logAction(String action, String userEmail, String ipAddress, String status) {
        SecurityLog log = new SecurityLog(action, userEmail, ipAddress, status);
        return securityLogRepository.save(log);
    }
}
