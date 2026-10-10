package com.freelance.backend.controller;

import com.freelance.backend.dto.EscrowSummaryDTO;
import com.freelance.backend.dto.FundReleaseRequest;
import com.freelance.backend.dto.WithdrawalRequest;
import com.freelance.backend.entity.Milestone;
import com.freelance.backend.entity.Transaction;
import com.freelance.backend.service.EscrowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/escrow")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class EscrowController {

    private final EscrowService escrowService;

    public EscrowController(EscrowService escrowService) {
        this.escrowService = escrowService;
    }

    @GetMapping("/summary")
    public ResponseEntity<EscrowSummaryDTO> getEscrowSummary(
            @RequestParam(required = false) String freelancerName,
            @RequestParam(required = false) String email
    ) {
        String identifier = (email != null && !email.isBlank()) ? email : freelancerName;
        return ResponseEntity.ok(escrowService.getEscrowSummary(identifier));
    }

    @PostMapping("/fund")
    public ResponseEntity<Milestone> fundMilestone(@RequestBody FundReleaseRequest request) {
        return ResponseEntity.ok(escrowService.fundMilestone(request.getMilestoneId()));
    }

    @PostMapping("/release")
    public ResponseEntity<Milestone> releasePayment(@RequestBody FundReleaseRequest request) {
        return ResponseEntity.ok(escrowService.releasePayment(request.getMilestoneId()));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<List<Transaction>> withdraw(@RequestBody WithdrawalRequest request) {
        return ResponseEntity.ok(escrowService.withdraw(request));
    }
}
