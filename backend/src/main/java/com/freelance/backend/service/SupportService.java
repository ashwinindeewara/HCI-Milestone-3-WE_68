package com.freelance.backend.service;

import com.freelance.backend.entity.AdminAuditLog;
import com.freelance.backend.entity.Dispute;
import com.freelance.backend.entity.SecurityLog;
import com.freelance.backend.repository.AdminAuditLogRepository;
import com.freelance.backend.repository.DisputeRepository;
import com.freelance.backend.repository.SecurityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class SupportService {

    private final AdminAuditLogRepository adminAuditLogRepository;
    private final SecurityLogRepository securityLogRepository;
    private final DisputeRepository disputeRepository;

    public SupportService(AdminAuditLogRepository adminAuditLogRepository,
                          SecurityLogRepository securityLogRepository,
                          DisputeRepository disputeRepository) {
        this.adminAuditLogRepository = adminAuditLogRepository;
        this.securityLogRepository = securityLogRepository;
        this.disputeRepository = disputeRepository;
    }

    public Map<String, Object> submitSupportTicket(Map<String, Object> payload) {
        if (payload == null) payload = Map.of();

        String email = payload.get("email") != null ? String.valueOf(payload.get("email")).trim().toLowerCase() : "user@platform.com";
        String name = payload.get("name") != null ? String.valueOf(payload.get("name")).trim() : (email.contains("@") ? email.split("@")[0] : "User");
        String category = payload.get("category") != null ? String.valueOf(payload.get("category")).trim() : "General Inquiry";
        String subject = payload.get("subject") != null ? String.valueOf(payload.get("subject")).trim() : "Support Inquiry from " + email;
        String message = payload.get("message") != null ? String.valueOf(payload.get("message")).trim() : "No details provided.";

        String ticketId = "TICKET-SUP-" + (1000 + (int)(Math.random() * 9000));

        // 1. Log Security Alert / Audit Event
        try {
            SecurityLog secLog = new SecurityLog(
                    "Support Inquiry: " + category,
                    email,
                    "127.0.0.1",
                    category.toLowerCase().contains("suspension") ? "High" : "Medium"
            );
            securityLogRepository.save(secLog);
        } catch (Exception e) {
            System.err.println("Support secLog skipped: " + e.getMessage());
        }

        // 2. Log Admin Audit Trail
        try {
            AdminAuditLog log = new AdminAuditLog(
                    email,
                    "SUPPORT_TICKET_SUBMITTED",
                    ticketId,
                    "Category: " + category + " | Subject: " + subject + " | Message: " + message
            );
            adminAuditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Support audit log skipped: " + e.getMessage());
        }

        // 3. If Account Suspension Appeal, auto-log case in Disputes Center for Admin Review
        if (category.toLowerCase().contains("suspension") || subject.toLowerCase().contains("suspension")) {
            try {
                Dispute appealCase = new Dispute(
                        "DSP-SUP-" + (System.currentTimeMillis() % 100000),
                        "DSP-" + (1000 + (int)(Math.random() * 9000)),
                        "Account Suspension Appeal: " + email,
                        name + " (" + email + ") vs Platform Admin",
                        "Account Suspension",
                        "User filed support ticket appeal: " + message,
                        null,
                        0.0,
                        "Under Review",
                        "review"
                );
                disputeRepository.save(appealCase);
            } catch (Exception e) {
                System.err.println("Support appeal dispute skipped: " + e.getMessage());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("ticketId", ticketId);
        response.put("status", "RECEIVED");
        response.put("message", "Support ticket " + ticketId + " logged successfully. Our support team will respond within 24 hours.");
        return response;
    }
}

