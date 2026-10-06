package com.freelance.backend.controller;

import com.freelance.backend.dto.PaymentReportsAnalyticsDTO;
import com.freelance.backend.service.PaymentReportsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/staff/reports", "/api/staff/reports"})
@CrossOrigin(origins = "*")
public class PaymentReportsController {

    @Autowired
    private PaymentReportsService paymentReportsService;

    @GetMapping("/analytics")
    public ResponseEntity<PaymentReportsAnalyticsDTO> getReportsAnalytics(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(paymentReportsService.getReportsAnalytics(days));
    }

    @GetMapping("/monthly-audit/export")
    public ResponseEntity<Map<String, Object>> exportMonthlyAuditReport() {
        return ResponseEntity.ok(paymentReportsService.generateMonthlyAuditReport());
    }
}
