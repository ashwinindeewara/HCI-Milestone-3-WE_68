package com.freelance.backend.controller;

import com.freelance.backend.entity.SecurityLog;
import com.freelance.backend.service.SecurityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/security")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class SecurityLogController {

    private final SecurityLogService securityLogService;

    public SecurityLogController(SecurityLogService securityLogService) {
        this.securityLogService = securityLogService;
    }

    @GetMapping("/logs")
    public ResponseEntity<List<SecurityLog>> getSecurityLogs() {
        return ResponseEntity.ok(securityLogService.getSecurityLogs());
    }
}
