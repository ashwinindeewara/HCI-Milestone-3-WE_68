package com.freelance.backend.service;

import com.freelance.backend.entity.*;
import com.freelance.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private SecurityLogRepository securityLogRepository;

    @Autowired
    private BlockedIpRepository blockedIpRepository;

    @Autowired
    private AdminAuditLogRepository adminAuditLogRepository;

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private ReconciliationRepository reconciliationRepository;

    private void logAdminAudit(String actionType, String targetId, String details) {
        try {
            AdminAuditLog log = new AdminAuditLog("admin@freelance.com", actionType, targetId, details);
            adminAuditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Audit log recording skipped: " + e.getMessage());
        }
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUserStatus(Long id, String status) {
        User user = userRepository.findById(id).orElse(null);
        if (user != null) {
            String oldStatus = user.getStatus();
            user.setStatus(status != null ? status : "Active");
            User saved = userRepository.save(user);
            logAdminAudit("USER_STATUS_CHANGE", String.valueOf(id), "Changed status from " + oldStatus + " to " + status + " for " + user.getEmail());
            return saved;
        }
        return null;
    }

    public Map<String, Object> getDashboardKpis() {
        Map<String, Object> kpis = new HashMap<>();
        List<User> allUsers = userRepository.findAll();
        kpis.put("totalUsers", allUsers.size());

        long activeFreelancers = allUsers.stream().filter(u -> u.getRole() != null && "FREELANCER".equalsIgnoreCase(u.getRole().name()) && "Active".equalsIgnoreCase(u.getStatus())).count();
        long activeClients = allUsers.stream().filter(u -> u.getRole() != null && "CLIENT".equalsIgnoreCase(u.getRole().name()) && "Active".equalsIgnoreCase(u.getStatus())).count();

        kpis.put("activeFreelancers", activeFreelancers);
        kpis.put("activeClients", activeClients);

        List<Transaction> txns = transactionRepository.findAll();
        double totalVolume = txns.stream()
                .filter(t -> t.getAmount() != null && !"REFUNDED".equalsIgnoreCase(t.getStatus()))
                .mapToDouble(Transaction::getAmount)
                .sum();
        kpis.put("totalVolumeEscrow", totalVolume);

        long pending = disputeRepository.findAll().stream()
                .filter(d -> d.getStatusType() == null || (!"resolved".equalsIgnoreCase(d.getStatusType()) && !"Resolved".equalsIgnoreCase(d.getStatus())))
                .count();
        long critical = securityLogRepository.findAll().stream()
                .filter(a -> "High".equalsIgnoreCase(a.getStatus()) || "CRITICAL".equalsIgnoreCase(a.getStatus()) || "FLAGGED".equalsIgnoreCase(a.getStatus()))
                .count();

        kpis.put("disputesPending", pending);
        kpis.put("securityAlertsCritical", critical);
        return kpis;
    }

    public Map<String, Object> getRecentActivity() {
        Map<String, Object> response = new HashMap<>();

        List<Map<String, Object>> txnsMapped = transactionRepository.findAll().stream()
                .sorted((a, b) -> (b.getId() != null ? b.getId() : "").compareTo(a.getId() != null ? a.getId() : ""))
                .limit(5)
                .map(t -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", t.getId() != null ? t.getId() : "1");
                    m.put("title", t.getMilestoneTitle() != null ? t.getMilestoneTitle() : "Milestone");
                    m.put("amount", "$" + String.format("%.2f", t.getAmount() != null ? t.getAmount() : 0.0));
                    m.put("status", t.getStatus() != null ? t.getStatus() : "COMPLETED");
                    return m;
                }).collect(Collectors.toList());
        response.put("transactions", txnsMapped);

        List<Map<String, Object>> alerts = new ArrayList<>();

        // Filter critical/high security alerts only
        List<SecurityLog> criticalSecLogs = securityLogRepository.findAll().stream()
                .filter(a -> "High".equalsIgnoreCase(a.getStatus()) || "CRITICAL".equalsIgnoreCase(a.getStatus()) || "FLAGGED".equalsIgnoreCase(a.getStatus()))
                .limit(3)
                .collect(Collectors.toList());

        for (SecurityLog a : criticalSecLogs) {
            Map<String, Object> alertMap = new HashMap<>();
            alertMap.put("id", a.getId() != null ? String.valueOf(a.getId()) : "1");
            alertMap.put("title", a.getAction() != null ? a.getAction() : "Security Event");
            alertMap.put("description", "Action required for " + (a.getUserEmail() != null ? a.getUserEmail() : "system"));
            alertMap.put("type", "security");
            alerts.add(alertMap);
        }

        // Filter pending/unresolved disputes only
        List<Dispute> pendingDisputes = disputeRepository.findAll().stream()
                .filter(d -> d.getStatusType() == null || (!"resolved".equalsIgnoreCase(d.getStatusType()) && !"Resolved".equalsIgnoreCase(d.getStatus())))
                .limit(3)
                .collect(Collectors.toList());

        for (Dispute d : pendingDisputes) {
            Map<String, Object> disputeMap = new HashMap<>();
            disputeMap.put("id", d.getId() != null ? d.getId() : "1");
            disputeMap.put("title", "Dispute: " + (d.getDspNumber() != null ? d.getDspNumber() : "DSP-001"));
            disputeMap.put("description", d.getParties() != null ? d.getParties() : "Client vs Freelancer");
            disputeMap.put("type", "dispute");
            alerts.add(disputeMap);
        }

        // Operational Fallback Card if zero urgent items
        if (alerts.isEmpty()) {
            Map<String, Object> infoMap = new HashMap<>();
            infoMap.put("id", "SYS-001");
            infoMap.put("title", "All Systems Operational");
            infoMap.put("description", "No pending disputes or critical security threats requiring attention.");
            infoMap.put("type", "info");
            alerts.add(infoMap);
        }

        response.put("alerts", alerts);
        return response;
    }

    public Map<String, Object> getAdminTransactions() {
        Map<String, Object> response = new HashMap<>();
        List<Transaction> txns = transactionRepository.findAll();

        double totalEscrow = txns.stream()
                .filter(t -> t.getAmount() != null && !"REFUNDED".equalsIgnoreCase(t.getStatus()))
                .mapToDouble(Transaction::getAmount)
                .sum();

        long completedCount = txns.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).count();
        double trendPct = txns.isEmpty() ? 0.0 : ((double) completedCount / txns.size()) * 100.0;
        String trendText = String.format("+%.0f%% settled", trendPct);

        response.put("platformEscrowValue", totalEscrow);
        response.put("trend", trendText);

        List<Map<String, Object>> mappedTxns = txns.stream().map(t -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", t.getId() != null ? t.getId() : "TXN-000");
            m.put("date", t.getTimestamp() != null ? t.getTimestamp() : (t.getCreatedAt() != null ? t.getCreatedAt().toString() : "Recent"));
            m.put("project", t.getMilestoneTitle() != null ? t.getMilestoneTitle() : "Milestone Payment");
            m.put("client", "Client (ID: " + (t.getContractId() != null ? t.getContractId() : "C-100") + ")");
            m.put("freelancer", "Freelancer");
            m.put("amount", "$" + String.format("%.2f", t.getAmount() != null ? t.getAmount() : 0.0));
            m.put("status", t.getStatus() != null ? t.getStatus() : "COMPLETED");

            String status = t.getStatus();
            String riskLevel = "low";
            String riskText = "Risk: Low";
            if ("DISPUTED".equalsIgnoreCase(status)) {
                riskLevel = "high";
                riskText = "Risk: High";
            } else if ("PENDING".equalsIgnoreCase(status)) {
                riskLevel = "medium";
                riskText = "Risk: Medium";
            }
            m.put("risk", riskText);
            m.put("riskLevel", riskLevel);
            return m;
        }).collect(Collectors.toList());

        response.put("transactions", mappedTxns);
        return response;
    }

    public List<Map<String, Object>> getAdminDisputes() {
        return disputeRepository.findAll().stream().map(d -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", d.getId() != null ? d.getId() : "dsp-0");
            m.put("dspNumber", d.getDspNumber() != null ? d.getDspNumber() : "DSP-000");
            m.put("title", d.getProject() != null ? d.getProject() : "Project Dispute");
            m.put("parties", d.getParties() != null ? d.getParties() : "Client vs Freelancer");
            m.put("type", d.getIssueType() != null ? d.getIssueType() : "Milestone Dispute");
            m.put("amount", "$" + String.format("%.2f", d.getAmount() != null ? d.getAmount() : 0.0));
            m.put("status", d.getStatus() != null ? d.getStatus() : "Open");
            m.put("statusType", d.getStatusType() != null ? d.getStatusType() : "open");
            m.put("description", d.getDescription() != null ? d.getDescription() : "");
            return m;
        }).collect(Collectors.toList());
    }

    public void resolveDispute(String id, String resolution) {
        Dispute d = disputeRepository.findById(id)
                .orElseGet(() -> disputeRepository.findAll().stream()
                        .filter(x -> id.equalsIgnoreCase(x.getId()) || id.equalsIgnoreCase(x.getDspNumber()))
                        .findFirst()
                        .orElse(null));

        if (d == null) {
            d = new Dispute(id, id, "Arbitration Case", "Client vs Freelancer", "General", resolution, null, 500.0, "Resolved", "resolved");
        }
        d.setStatus("Resolved");
        d.setStatusType("resolved");
        d.setResolutionNote(resolution);
        disputeRepository.save(d);

        double disputeAmount = d.getAmount() != null ? d.getAmount() : 0.0;
        String projectTitle = d.getProject() != null ? d.getProject() : "Arbitration Case";

        boolean isSuspensionAppeal = (d.getIssueType() != null && d.getIssueType().equalsIgnoreCase("Account Suspension"))
                || (d.getProject() != null && d.getProject().toLowerCase().contains("account suspension"));

        if (!isSuspensionAppeal) {
            boolean isSplit = resolution != null && (resolution.toUpperCase().contains("SPLIT_50_50") || resolution.contains("50/50") || resolution.toLowerCase().contains("equal escrow split"));
            boolean isRelease = !isSplit && resolution != null && (resolution.toUpperCase().contains("RELEASE_FREELANCER") || resolution.toLowerCase().contains("release 100% funds to freelancer") || resolution.toLowerCase().contains("release to freelancer"));
            boolean isRefund = !isSplit && !isRelease;

        try {
            String refNo = "FTX-RES-" + (1000 + (int)(Math.random() * 9000));
            final String targetTitle = projectTitle.trim().toLowerCase();

            if (isRefund) {
                // Record Escrow Refund Reversal
                Transaction resTxn = new Transaction("TXN-" + System.currentTimeMillis() % 10000, refNo, "C-101", "M-1", "Dispute Refund: " + projectTitle, disputeAmount, "REFUND", "REFUNDED", LocalDateTime.now().toString());
                transactionRepository.save(resTxn);

                // Update matching transactions for this project title to REFUNDED
                transactionRepository.findAll().stream()
                        .filter(t -> t.getMilestoneTitle() != null && (t.getMilestoneTitle().equalsIgnoreCase(projectTitle) || t.getMilestoneTitle().toLowerCase().contains(targetTitle) || targetTitle.contains(t.getMilestoneTitle().toLowerCase())))
                        .forEach(t -> {
                            t.setStatus("REFUNDED");
                            transactionRepository.save(t);
                        });

                // Update matching milestones to REFUNDED
                milestoneRepository.findAll().stream()
                        .filter(m -> m.getTitle() != null && (m.getTitle().equalsIgnoreCase(projectTitle) || m.getTitle().toLowerCase().contains(targetTitle) || targetTitle.contains(m.getTitle().toLowerCase())))
                        .forEach(m -> {
                            m.setStatus("REFUNDED");
                            milestoneRepository.save(m);
                        });

                reconciliationRepository.save(new ReconciliationRecord(refNo, "BATCH-DISPUTE-REFUNDED", disputeAmount, "MATCHED", LocalDateTime.now().toString().substring(0, 10), "Full refund arbitration verdict"));
            } else if (isSplit) {
                double splitAmount = disputeAmount / 2.0;
                Transaction refundTxn = new Transaction("TXN-" + System.currentTimeMillis() % 10000, refNo + "-A", "C-101", "M-1", "50% Dispute Refund: " + projectTitle, splitAmount, "REFUND", "REFUNDED", LocalDateTime.now().toString());
                Transaction releaseTxn = new Transaction("TXN-" + (System.currentTimeMillis() % 10000 + 1), refNo + "-B", "C-101", "M-1", "50% Dispute Release: " + projectTitle, splitAmount, "RELEASE", "COMPLETED", LocalDateTime.now().toString());
                transactionRepository.save(refundTxn);
                transactionRepository.save(releaseTxn);

                transactionRepository.findAll().stream()
                        .filter(t -> t.getMilestoneTitle() != null && (t.getMilestoneTitle().equalsIgnoreCase(projectTitle) || t.getMilestoneTitle().toLowerCase().contains(targetTitle) || targetTitle.contains(t.getMilestoneTitle().toLowerCase())))
                        .forEach(t -> {
                            t.setStatus("COMPLETED");
                            transactionRepository.save(t);
                        });

                milestoneRepository.findAll().stream()
                        .filter(m -> m.getTitle() != null && (m.getTitle().equalsIgnoreCase(projectTitle) || m.getTitle().toLowerCase().contains(targetTitle) || targetTitle.contains(m.getTitle().toLowerCase())))
                        .forEach(m -> {
                            m.setStatus("SETTLED");
                            milestoneRepository.save(m);
                        });

                reconciliationRepository.save(new ReconciliationRecord(refNo, "BATCH-DISPUTE-SPLIT", disputeAmount, "MATCHED", LocalDateTime.now().toString().substring(0, 10), "50/50 split arbitration verdict"));
            } else {
                // Release to Freelancer
                Transaction resTxn = new Transaction("TXN-" + System.currentTimeMillis() % 10000, refNo, "C-101", "M-1", "Dispute Release: " + projectTitle, disputeAmount, "RELEASE", "COMPLETED", LocalDateTime.now().toString());
                transactionRepository.save(resTxn);

                transactionRepository.findAll().stream()
                        .filter(t -> t.getMilestoneTitle() != null && (t.getMilestoneTitle().equalsIgnoreCase(projectTitle) || t.getMilestoneTitle().toLowerCase().contains(targetTitle) || targetTitle.contains(t.getMilestoneTitle().toLowerCase())))
                        .forEach(t -> {
                            t.setStatus("COMPLETED");
                            transactionRepository.save(t);
                        });

                milestoneRepository.findAll().stream()
                        .filter(m -> m.getTitle() != null && (m.getTitle().equalsIgnoreCase(projectTitle) || m.getTitle().toLowerCase().contains(targetTitle) || targetTitle.contains(m.getTitle().toLowerCase())))
                        .forEach(m -> {
                            m.setStatus("RELEASED");
                            milestoneRepository.save(m);
                        });

                reconciliationRepository.save(new ReconciliationRecord(refNo, "BATCH-DISPUTE-SETTLED", disputeAmount, "MATCHED", LocalDateTime.now().toString().substring(0, 10), "Full release arbitration verdict"));
            }
        } catch (Exception e) {
            System.err.println("Dispute settlement ledger record error: " + e.getMessage());
        }
        } else {
            // Process Account Suspension Appeal Verdict
            String searchTarget = (d.getProject() != null ? d.getProject() : "") + " " + (d.getParties() != null ? d.getParties() : "") + " " + (d.getDescription() != null ? d.getDescription() : "");
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}").matcher(searchTarget);
            String userEmail = matcher.find() ? matcher.group() : null;

            boolean isReinstated = resolution != null && (
                    resolution.toUpperCase().contains("UNSUSPEND") ||
                    resolution.toUpperCase().contains("REINSTATE") ||
                    resolution.toUpperCase().contains("ACCEPT") ||
                    resolution.toLowerCase().contains("activate account") ||
                    resolution.toLowerCase().contains("lift suspension")
            );

            if (userEmail != null && !userEmail.isEmpty()) {
                final String targetEmail = userEmail.toLowerCase().trim();
                userRepository.findAll().stream()
                        .filter(u -> u.getEmail() != null && u.getEmail().trim().equalsIgnoreCase(targetEmail))
                        .findFirst()
                        .ifPresent(u -> {
                            if (isReinstated) {
                                u.setStatus("Active");
                                userRepository.save(u);
                                logAdminAudit("USER_REINSTATED", String.valueOf(u.getId()), "Lifted suspension and activated account for: " + targetEmail);
                            } else {
                                u.setStatus("Suspended");
                                userRepository.save(u);
                                logAdminAudit("USER_SUSPENSION_MAINTAINED", String.valueOf(u.getId()), "Maintained account suspension after reviewing appeal for: " + targetEmail);
                            }
                        });
            }
        }

        logAdminAudit("DISPUTE_RESOLVED", id, "Resolved dispute case " + d.getDspNumber() + ". Resolution: " + resolution);
    }

    public List<Map<String, Object>> getSecurityAlerts() {
        return securityLogRepository.findAll().stream().map(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId() != null ? String.valueOf(a.getId()) : "1");
            m.put("title", a.getAction() != null ? a.getAction() : "Security Event Recorded");
            m.put("user", a.getUserEmail() != null ? a.getUserEmail() : "system@platform.com");
            m.put("target", a.getIpAddress() != null ? a.getIpAddress() : "127.0.0.1");

            String rawSev = a.getStatus() != null ? a.getStatus().toUpperCase() : "MEDIUM";
            String severity = "Medium";
            String severityType = "medium";
            if (rawSev.contains("HIGH") || rawSev.contains("CRITICAL") || rawSev.contains("FLAGGED")) {
                severity = "High";
                severityType = "high";
            } else if (rawSev.contains("MED") || rawSev.contains("WARN")) {
                severity = "Medium";
                severityType = "medium";
            } else {
                severity = "Low";
                severityType = "low";
            }

            m.put("severity", severity);
            m.put("severityType", severityType);

            m.put("time", a.getTimestamp() != null ? a.getTimestamp().toString() : "Recent");
            return m;
        }).collect(Collectors.toList());
    }

    public void reviewSecurityAlert(String id) {
        try {
            Long logId = Long.parseLong(id);
            if (securityLogRepository.existsById(logId)) {
                securityLogRepository.deleteById(logId);
            } else {
                securityLogRepository.findAll().stream()
                        .filter(a -> String.valueOf(a.getId()).equalsIgnoreCase(id))
                        .findFirst()
                        .ifPresent(securityLogRepository::delete);
            }
        } catch (Exception e) {
            securityLogRepository.findAll().stream()
                    .filter(a -> String.valueOf(a.getId()).equalsIgnoreCase(id))
                    .findFirst()
                    .ifPresent(securityLogRepository::delete);
        }
        logAdminAudit("SECURITY_ALERT_REVIEWED", id, "Reviewed and dismissed security alert log ID: " + id);
    }

    public User createUser(Map<String, String> payload) {
        if (payload == null) payload = Map.of();
        String fullName = payload.getOrDefault("fullName", payload.getOrDefault("name", "New User"));
        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            email = "user" + System.currentTimeMillis() + "@platform.com";
        } else {
            email = email.trim().toLowerCase();
        }

        if (userRepository.existsByEmail(email)) {
            String[] parts = email.split("@");
            email = parts[0] + "_" + (System.currentTimeMillis() % 10000) + "@" + (parts.length > 1 ? parts[1] : "platform.com");
        }

        String password = payload.getOrDefault("password", "Password123!");
        String roleStr = payload.getOrDefault("role", "FREELANCER").toUpperCase();
        String status = payload.getOrDefault("status", "Active");

        UserRole role;
        try {
            role = UserRole.valueOf(roleStr);
        } catch (Exception e) {
            role = UserRole.FREELANCER;
        }

        User user = new User(fullName, email, password, role, status);
        User saved = userRepository.save(user);
        logAdminAudit("USER_CREATED", String.valueOf(saved.getId()), "Created user account for " + email + " with role " + roleStr);
        return saved;
    }

    private String hashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) return null;
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawPassword.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return rawPassword;
        }
    }

    public User updateUser(Long id, Map<String, String> payload) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            user = userRepository.findAll().stream()
                    .filter(u -> u.getId() != null && u.getId().equals(id))
                    .findFirst()
                    .orElse(null);
        }
        if (user == null) {
            user = new User("Updated User", "user" + id + "@platform.com", "Password123!", UserRole.FREELANCER, "Active");
            user.setId(id);
        }

        if (payload != null) {
            if (payload.containsKey("fullName") && payload.get("fullName") != null) user.setFullName(payload.get("fullName"));
            if (payload.containsKey("name") && payload.get("name") != null) user.setFullName(payload.get("name"));
            if (payload.containsKey("email") && payload.get("email") != null) user.setEmail(payload.get("email").trim().toLowerCase());
            if (payload.containsKey("status") && payload.get("status") != null) user.setStatus(payload.get("status"));
            
            String newPassword = payload.get("password");
            if (newPassword == null || newPassword.isBlank()) newPassword = payload.get("newPassword");
            if (newPassword != null && !newPassword.isBlank()) {
                user.setPassword(hashPassword(newPassword));
            }

            if (payload.containsKey("role") && payload.get("role") != null) {
                try {
                    user.setRole(UserRole.valueOf(payload.get("role").toUpperCase()));
                } catch (Exception ignored) {}
            }
        }
        User saved = userRepository.save(user);
        logAdminAudit("USER_UPDATED", String.valueOf(id), "Updated profile details/password for user " + user.getEmail());
        return saved;
    }

    public void deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            logAdminAudit("USER_DELETED", String.valueOf(id), "Permanently deleted user ID: " + id);
        }
    }

    public Dispute createDispute(Map<String, Object> payload) {
        if (payload == null) payload = Map.of();
        String id = "dsp-" + System.currentTimeMillis();
        String dspNumber = "DSP-" + (1000 + (int)(Math.random() * 9000));
        String project = String.valueOf(payload.getOrDefault("project", payload.getOrDefault("title", "Project Dispute")));
        String parties = String.valueOf(payload.getOrDefault("parties", "Client vs Freelancer"));
        String issueType = String.valueOf(payload.getOrDefault("issueType", payload.getOrDefault("type", "Milestone Dispute")));
        String description = String.valueOf(payload.getOrDefault("description", "Dispute raised by admin"));
        Double amount = payload.get("amount") != null ? Double.parseDouble(payload.get("amount").toString().replace("$", "")) : 250.0;
        String status = String.valueOf(payload.getOrDefault("status", "Open"));
        String statusType = status.equalsIgnoreCase("Resolved") ? "resolved" : (status.equalsIgnoreCase("Under Review") ? "review" : "open");

        Dispute dispute = new Dispute(id, dspNumber, project, parties, issueType, description, null, amount, status, statusType);
        Dispute saved = disputeRepository.save(dispute);

        final String targetTitle = project.trim().toLowerCase();
        if (!targetTitle.isEmpty()) {
            transactionRepository.findAll().stream()
                    .filter(t -> t.getMilestoneTitle() != null && (t.getMilestoneTitle().equalsIgnoreCase(project) || t.getMilestoneTitle().toLowerCase().contains(targetTitle) || targetTitle.contains(t.getMilestoneTitle().toLowerCase())))
                    .forEach(t -> {
                        t.setStatus("DISPUTED");
                        transactionRepository.save(t);
                    });
        }

        logAdminAudit("DISPUTE_CREATED", id, "Filed new dispute case " + dspNumber + " for project: " + project);
        return saved;
    }

    public void deleteDispute(String id) {
        Dispute d = disputeRepository.findById(id)
                .orElseGet(() -> disputeRepository.findAll().stream()
                        .filter(x -> id.equalsIgnoreCase(x.getId()) || id.equalsIgnoreCase(x.getDspNumber()))
                        .findFirst()
                        .orElse(null));

        if (d != null) {
            final String targetTitle = d.getProject() != null ? d.getProject().trim().toLowerCase() : "";
            disputeRepository.delete(d);
            if (!targetTitle.isEmpty()) {
                transactionRepository.findAll().stream()
                        .filter(t -> t.getMilestoneTitle() != null && (t.getMilestoneTitle().equalsIgnoreCase(d.getProject()) || t.getMilestoneTitle().toLowerCase().contains(targetTitle) || targetTitle.contains(t.getMilestoneTitle().toLowerCase())) && "DISPUTED".equalsIgnoreCase(t.getStatus()))
                        .forEach(t -> {
                            t.setStatus("COMPLETED");
                            transactionRepository.save(t);
                        });
            }
            logAdminAudit("DISPUTE_DELETED", id, "Dismissed and deleted dispute ID: " + id);
        }
    }

    public SecurityLog createSecurityAlert(Map<String, String> payload) {
        if (payload == null) payload = Map.of();
        String action = payload.getOrDefault("action", payload.getOrDefault("title", "Suspicious Activity Detected"));
        String email = payload.getOrDefault("userEmail", payload.getOrDefault("user", "user@example.com"));
        String ip = payload.getOrDefault("ipAddress", payload.getOrDefault("target", "192.168.1.1"));
        String severity = payload.getOrDefault("severity", "Medium");

        SecurityLog log = new SecurityLog(action, email, ip, severity);
        SecurityLog saved = securityLogRepository.save(log);
        logAdminAudit("SECURITY_ALERT_CREATED", String.valueOf(saved.getId()), "Logged security alert: " + action + " for " + email);
        return saved;
    }

    public void deleteSecurityAlert(String id) {
        reviewSecurityAlert(id);
    }

    public Transaction flagTransaction(String id, Map<String, String> payload) {
        Transaction existing = transactionRepository.findById(id)
                .orElseGet(() -> transactionRepository.findAll().stream()
                        .filter(x -> id.equalsIgnoreCase(x.getId()) || id.equalsIgnoreCase(x.getReferenceNo()))
                        .findFirst()
                        .orElse(null));

        if (existing == null) {
            String project = (payload != null && payload.get("project") != null) ? payload.get("project") : "Flagged Milestone Transaction";
            Double amount = (payload != null && payload.get("amount") != null) ? Double.parseDouble(payload.get("amount").toString().replace("$", "")) : 500.0;
            String contract = (payload != null && payload.get("client") != null) ? payload.get("client") : "C-101";
            existing = new Transaction(id, "FTX-" + id, contract, "M-1", project, amount, "DISPUTE", "DISPUTED", "Today");
        }

        String newStatus = (payload != null && payload.containsKey("status")) ? payload.get("status") : "DISPUTED";
        existing.setStatus(newStatus);
        Transaction saved = transactionRepository.save(existing);
        final Transaction finalTxn = saved;

        final String targetTitle = finalTxn.getMilestoneTitle() != null ? finalTxn.getMilestoneTitle().trim().toLowerCase() : "";

        if ("DISPUTED".equalsIgnoreCase(newStatus)) {
            // Log audit case in disputeRepository if not present
            boolean hasDispute = disputeRepository.findAll().stream()
                    .anyMatch(d -> d.getProject() != null && d.getProject().toLowerCase().contains(targetTitle));
            if (!hasDispute && !targetTitle.isEmpty()) {
                Dispute auditDispute = new Dispute(
                        "DSP-AUD-" + System.currentTimeMillis() % 10000,
                        "DSP-" + (1000 + (int)(Math.random() * 9000)),
                        finalTxn.getMilestoneTitle(),
                        "Client vs Freelancer",
                        "Audit Flag",
                        "Transaction flagged for administrative audit & review.",
                        null,
                        finalTxn.getAmount(),
                        "Under Review",
                        "review"
                );
                disputeRepository.save(auditDispute);
            }
        } else {
            // Clear audit / resolve associated audit dispute
            disputeRepository.findAll().stream()
                    .filter(d -> d.getProject() != null && d.getProject().toLowerCase().contains(targetTitle) && !"Resolved".equalsIgnoreCase(d.getStatus()))
                    .forEach(d -> {
                        d.setStatus("Resolved");
                        d.setStatusType("resolved");
                        d.setResolutionNote("Audit cleared by Admin");
                        disputeRepository.save(d);
                    });
        }

        logAdminAudit("TRANSACTION_FLAGGED", id, "Flagged transaction ID " + id + " status to " + newStatus);
        return saved;
    }

    public Transaction refundTransaction(String id, Map<String, Object> payload) {
        Transaction existing = transactionRepository.findById(id)
                .orElseGet(() -> transactionRepository.findAll().stream()
                        .filter(x -> id.equalsIgnoreCase(x.getId()) || id.equalsIgnoreCase(x.getReferenceNo()))
                        .findFirst()
                        .orElse(null));

        if (existing == null) {
            Double reqAmount = 500.0;
            String reqProject = "Milestone Refund";
            String reqContract = "C-103";

            if (payload != null) {
                if (payload.get("amount") != null) {
                    try {
                        reqAmount = Double.parseDouble(payload.get("amount").toString().replace("$", ""));
                    } catch (Exception ignored) {}
                }
                if (payload.get("project") != null && !payload.get("project").toString().isBlank()) {
                    reqProject = payload.get("project").toString();
                } else if (payload.get("milestoneTitle") != null && !payload.get("milestoneTitle").toString().isBlank()) {
                    reqProject = payload.get("milestoneTitle").toString();
                }
                if (payload.get("client") != null && !payload.get("client").toString().isBlank()) {
                    reqContract = payload.get("client").toString();
                }
            }

            existing = new Transaction(id, "FTX-" + id, reqContract, "M-1", reqProject, reqAmount, "REFUND", "REFUNDED", "Today");
        }

        existing.setStatus("REFUNDED");
        Transaction saved = transactionRepository.save(existing);
        final Transaction finalTxn = saved;

        final String projectTitle = finalTxn.getMilestoneTitle() != null ? finalTxn.getMilestoneTitle().trim().toLowerCase() : "";

        // Update associated Milestone if present or by title
        if (finalTxn.getMilestoneId() != null) {
            milestoneRepository.findById(finalTxn.getMilestoneId()).ifPresent(m -> {
                m.setStatus("REFUNDED");
                milestoneRepository.save(m);
            });
        }
        if (!projectTitle.isEmpty()) {
            milestoneRepository.findAll().stream()
                    .filter(m -> m.getTitle() != null && (m.getTitle().equalsIgnoreCase(finalTxn.getMilestoneTitle()) || m.getTitle().toLowerCase().contains(projectTitle) || projectTitle.contains(m.getTitle().toLowerCase())))
                    .forEach(m -> {
                        m.setStatus("REFUNDED");
                        milestoneRepository.save(m);
                    });
        }

        // Close & resolve any associated pending dispute
        if (!projectTitle.isEmpty()) {
            disputeRepository.findAll().stream()
                    .filter(d -> d.getProject() != null && (d.getProject().equalsIgnoreCase(finalTxn.getMilestoneTitle()) || d.getProject().toLowerCase().contains(projectTitle) || projectTitle.contains(d.getProject().toLowerCase())))
                    .forEach(d -> {
                        d.setStatus("Resolved");
                        d.setStatusType("resolved");
                        d.setResolutionNote("Processed Escrow Refund to Client by Admin");
                        disputeRepository.save(d);
                    });
        }

        // Record double-entry escrow reversal and update reconciliation ledger
        try {
            String refNo = "FTX-REFUND-" + (1000 + (int)(Math.random() * 9000));
            Transaction reversalTxn = new Transaction("TXN-REV-" + System.currentTimeMillis() % 10000, refNo, finalTxn.getContractId(), finalTxn.getMilestoneId() != null ? finalTxn.getMilestoneId() : "M-1", "Refund Reversal: " + finalTxn.getMilestoneTitle(), finalTxn.getAmount(), "REFUND", "REFUNDED", LocalDateTime.now().toString());
            transactionRepository.save(reversalTxn);

            reconciliationRepository.save(new ReconciliationRecord(refNo, "BATCH-REFUND-ESCROW", finalTxn.getAmount(), "MATCHED", LocalDateTime.now().toString().substring(0, 10), "Admin Escrow Refund"));
        } catch (Exception e) {
            System.err.println("Refund reversal entry skipped: " + e.getMessage());
        }

        logAdminAudit("TRANSACTION_REFUNDED", id, "Processed escrow refund of $" + String.format("%.2f", finalTxn.getAmount()) + " for transaction ID: " + id);
        return saved;
    }

    public BlockedIp blockIp(String ipAddress, String reason) {
        String ip = ipAddress != null ? ipAddress.trim() : "127.0.0.1";
        String r = reason != null ? reason : "Security threat detected by admin";

        BlockedIp blockedIp = blockedIpRepository.findByIpAddress(ip)
                .orElse(new BlockedIp(ip, r));
        blockedIp.setReason(r);
        BlockedIp saved = blockedIpRepository.save(blockedIp);
        logAdminAudit("SECURITY_IP_BLOCKED", ip, "Blocked IP address: " + ip + ". Reason: " + r);
        return saved;
    }

    public void unblockIp(String ipAddress) {
        blockedIpRepository.findByIpAddress(ipAddress).ifPresent(blockedIpRepository::delete);
        logAdminAudit("SECURITY_IP_UNBLOCKED", ipAddress, "Unblocked IP address: " + ipAddress);
    }

    public List<BlockedIp> getAllBlockedIps() {
        return blockedIpRepository.findAll();
    }

    public List<AdminAuditLog> getAdminAuditLogs() {
        return adminAuditLogRepository.findAll();
    }
}
