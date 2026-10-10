package com.freelance.backend.controller;

import com.freelance.backend.entity.AdminAuditLog;
import com.freelance.backend.entity.BlockedIp;
import com.freelance.backend.entity.User;
import com.freelance.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/admin", "/api/admin"})
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<User> updateUserStatus(@PathVariable Long id, @RequestBody(required = false) Map<String, String> request) {
        String status = (request != null && request.containsKey("status")) ? request.get("status") : "Active";
        return ResponseEntity.ok(adminService.updateUserStatus(id, status));
    }
    
    @GetMapping({"/dashboard/kpis", "/kpis"})
    public ResponseEntity<Map<String, Object>> getDashboardKpis() {
        return ResponseEntity.ok(adminService.getDashboardKpis());
    }

    @GetMapping({"/dashboard/recent-activity", "/recent-activity"})
    public ResponseEntity<Map<String, Object>> getRecentActivity() {
        return ResponseEntity.ok(adminService.getRecentActivity());
    }

    @GetMapping("/transactions")
    public ResponseEntity<Map<String, Object>> getAdminTransactions() {
        return ResponseEntity.ok(adminService.getAdminTransactions());
    }

    @GetMapping("/disputes")
    public ResponseEntity<List<Map<String, Object>>> getAdminDisputes() {
        return ResponseEntity.ok(adminService.getAdminDisputes());
    }

    @PostMapping("/disputes/{id}/resolve")
    public ResponseEntity<Map<String, String>> resolveDispute(@PathVariable String id, @RequestBody(required = false) Map<String, String> request) {
        String resolution = (request != null && request.containsKey("resolution")) ? request.get("resolution") : "Resolved by Admin";
        adminService.resolveDispute(id, resolution);
        return ResponseEntity.ok(Map.of("message", "Dispute resolved successfully"));
    }
    
    @GetMapping("/security-alerts")
    public ResponseEntity<List<Map<String, Object>>> getSecurityAlerts() {
        return ResponseEntity.ok(adminService.getSecurityAlerts());
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody(required = false) Map<String, String> request) {
        return ResponseEntity.ok(adminService.createUser(request));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody(required = false) Map<String, String> request) {
        return ResponseEntity.ok(adminService.updateUser(id, request));
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateAdminProfile(@RequestBody(required = false) Map<String, String> request) {
        String idStr = (request != null && request.get("id") != null) ? request.get("id") : null;
        String email = (request != null && request.get("email") != null) ? request.get("email") : null;
        String oldEmail = (request != null && request.get("oldEmail") != null) ? request.get("oldEmail") : email;

        User adminUser = null;
        if (idStr != null) {
            try {
                Long reqId = Long.parseLong(idStr);
                adminUser = adminService.getAllUsers().stream()
                        .filter(u -> u.getId() != null && u.getId().equals(reqId))
                        .findFirst()
                        .orElse(null);
            } catch (Exception ignored) {}
        }
        if (adminUser == null && oldEmail != null) {
            String finalOldEmail = oldEmail.trim().toLowerCase();
            adminUser = adminService.getAllUsers().stream()
                    .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(finalOldEmail))
                    .findFirst()
                    .orElse(null);
        }
        if (adminUser == null && email != null) {
            String finalEmail = email.trim().toLowerCase();
            adminUser = adminService.getAllUsers().stream()
                    .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(finalEmail))
                    .findFirst()
                    .orElse(null);
        }
        if (adminUser == null) {
            adminUser = adminService.getAllUsers().stream()
                    .filter(u -> u.getRole() != null && "ADMIN".equalsIgnoreCase(u.getRole().name()))
                    .findFirst()
                    .orElse(null);
        }

        Long id = adminUser != null ? adminUser.getId() : 5L;
        return ResponseEntity.ok(adminService.updateUser(id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @PostMapping("/disputes")
    public ResponseEntity<com.freelance.backend.entity.Dispute> createDispute(@RequestBody(required = false) Map<String, Object> request) {
        return ResponseEntity.ok(adminService.createDispute(request));
    }

    @DeleteMapping("/disputes/{id}")
    public ResponseEntity<Map<String, String>> deleteDispute(@PathVariable String id) {
        adminService.deleteDispute(id);
        return ResponseEntity.ok(Map.of("message", "Dispute deleted successfully"));
    }

    @PostMapping("/security-alerts")
    public ResponseEntity<com.freelance.backend.entity.SecurityLog> createSecurityAlert(@RequestBody(required = false) Map<String, String> request) {
        return ResponseEntity.ok(adminService.createSecurityAlert(request));
    }

    @PutMapping("/security-alerts/{id}/review")
    public ResponseEntity<Map<String, String>> reviewSecurityAlert(@PathVariable String id) {
        adminService.reviewSecurityAlert(id);
        return ResponseEntity.ok(Map.of("message", "Alert reviewed successfully"));
    }

    @DeleteMapping("/security-alerts/{id}")
    public ResponseEntity<Map<String, String>> deleteSecurityAlert(@PathVariable String id) {
        adminService.deleteSecurityAlert(id);
        return ResponseEntity.ok(Map.of("message", "Security alert deleted successfully"));
    }

    @PutMapping("/transactions/{id}/flag")
    public ResponseEntity<com.freelance.backend.entity.Transaction> flagTransaction(@PathVariable String id, @RequestBody(required = false) Map<String, String> request) {
        return ResponseEntity.ok(adminService.flagTransaction(id, request));
    }

    @PostMapping("/transactions/{id}/refund")
    public ResponseEntity<com.freelance.backend.entity.Transaction> refundTransaction(@PathVariable String id, @RequestBody(required = false) Map<String, Object> request) {
        return ResponseEntity.ok(adminService.refundTransaction(id, request));
    }

    @PostMapping("/security/block-ip")
    public ResponseEntity<BlockedIp> blockIp(@RequestBody(required = false) Map<String, String> request) {
        String ip = (request != null && request.containsKey("ipAddress")) ? request.get("ipAddress") : (request != null && request.containsKey("target") ? request.get("target") : "127.0.0.1");
        String reason = (request != null && request.containsKey("reason")) ? request.get("reason") : "Security threat detected by admin";
        return ResponseEntity.ok(adminService.blockIp(ip, reason));
    }

    @DeleteMapping({"/security/block-ip/{ipAddress:.+}", "/security/block-ip"})
    public ResponseEntity<Map<String, String>> unblockIp(@PathVariable(required = false) String ipAddress, @RequestParam(required = false) String ip) {
        String targetIp = (ipAddress != null && !ipAddress.isEmpty()) ? ipAddress : ip;
        if (targetIp != null) {
            adminService.unblockIp(targetIp.trim());
        }
        return ResponseEntity.ok(Map.of("message", "IP address unblocked successfully"));
    }

    @GetMapping("/security/blocked-ips")
    public ResponseEntity<List<BlockedIp>> getBlockedIps() {
        return ResponseEntity.ok(adminService.getAllBlockedIps());
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AdminAuditLog>> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAdminAuditLogs());
    }
}
