package com.freelance.backend.controller;

import com.freelance.backend.dto.StaffDashboardMetricsDTO;
import com.freelance.backend.entity.Transaction;
import com.freelance.backend.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/transactions", "/api/transactions"})
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getTransactions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String freelancerName,
            @RequestParam(required = false) String email
    ) {
        String identifier = (email != null && !email.isBlank()) ? email : freelancerName;
        return ResponseEntity.ok(transactionService.getAllTransactions(status, type, identifier));
    }

    @GetMapping("/metrics")
    public ResponseEntity<StaffDashboardMetricsDTO> getStaffDashboardMetrics() {
        return ResponseEntity.ok(transactionService.getStaffDashboardMetrics());
    }


    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable String id) {
        return ResponseEntity.ok(transactionService.getTransactionById(id));
    }
}
