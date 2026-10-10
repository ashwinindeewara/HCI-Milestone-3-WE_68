package com.freelance.backend.controller;

import com.freelance.backend.dto.ReportSummaryDTO;
import com.freelance.backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping({"/api/staff/reports", "/api/v1/staff/reports", "/api/reports", "/api/v1/reports"})
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<ReportSummaryDTO> getReportSummary(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role,
            @RequestParam(required = false, defaultValue = "30") Integer days) {
        ReportSummaryDTO summary = reportService.generateReportSummary(email, role != null ? role : "PAYMENT_STAFF", days);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/generate")
    public ResponseEntity<ReportSummaryDTO> generateReport(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role,
            @RequestParam(required = false, defaultValue = "30") Integer days) {
        ReportSummaryDTO summary = reportService.generateReportSummary(email, role != null ? role : "PAYMENT_STAFF", days);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportReport(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role) {
        ReportSummaryDTO summary = reportService.generateReportSummary(email, role != null ? role : "PAYMENT_STAFF", 30);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("reportId", summary.getReportId());
        response.put("status", "SUCCESS");
        response.put("message", "Payment Staff Financial & Project Audit Report successfully generated.");
        response.put("timestamp", summary.getGeneratedAt());
        response.put("summaryMetrics", summary.getSummaryMetrics());
        response.put("totalMilestonesCount", summary.getProjectMilestones().getTotalMilestones());
        response.put("totalTransactionsCount", summary.getPaymentTransactions().getTotalTransactions());
        response.put("totalWithdrawalsCount", summary.getWithdrawalHistories().getTotalWithdrawals());
        response.put("exportUrl", "/api/staff/reports/download/" + summary.getReportId());
        return ResponseEntity.ok(response);
    }
}
