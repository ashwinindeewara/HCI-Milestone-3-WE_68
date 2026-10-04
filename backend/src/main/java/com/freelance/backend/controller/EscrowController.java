package com.freelance.backend.controller;

import com.freelance.backend.dto.EscrowSummaryDTO;
import com.freelance.backend.dto.FundReleaseRequest;
import com.freelance.backend.entity.Milestone;
import com.freelance.backend.service.EscrowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/escrow")
@CrossOrigin(origins = "*")
public class EscrowController {

    @Autowired
    private EscrowService escrowService;

    @GetMapping("/summary")
    public ResponseEntity<EscrowSummaryDTO> getEscrowSummary() {
        return ResponseEntity.ok(escrowService.getEscrowSummary());
    }

    @PostMapping("/fund")
    public ResponseEntity<Milestone> fundMilestone(@RequestBody FundReleaseRequest request) {
        return ResponseEntity.ok(escrowService.fundMilestone(request.getMilestoneId()));
    }

    @PostMapping("/release")
    public ResponseEntity<Milestone> releasePayment(@RequestBody FundReleaseRequest request) {
        return ResponseEntity.ok(escrowService.releasePayment(request.getMilestoneId()));
    }
}
