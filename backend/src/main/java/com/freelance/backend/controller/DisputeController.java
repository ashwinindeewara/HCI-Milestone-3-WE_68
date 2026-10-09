package com.freelance.backend.controller;

import com.freelance.backend.dto.AddDisputeMessageRequest;
import com.freelance.backend.dto.CreateDisputeRequest;
import com.freelance.backend.dto.ResolveDisputeRequest;
import com.freelance.backend.entity.Dispute;
import com.freelance.backend.entity.DisputeMessage;
import com.freelance.backend.service.DisputeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disputes")
@CrossOrigin(origins = "*")
public class DisputeController {

    private final DisputeService disputeService;

    public DisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @GetMapping
    public ResponseEntity<List<Dispute>> getAllDisputes(
            @RequestParam(required = false) String freelancerName,
            @RequestParam(required = false) String email
    ) {
        if (email != null && !email.isBlank()) {
            return ResponseEntity.ok(disputeService.getFreelancerDisputesByEmail(email));
        }
        if (freelancerName != null && !freelancerName.isBlank()) {
            return ResponseEntity.ok(disputeService.getFreelancerDisputes(freelancerName));
        }
        return ResponseEntity.ok(List.of());
    }

    /**
     * Get all disputes that belong to the logged-in client name.
     * Example: GET /api/disputes/client/Savi%20Savi
     */
    @GetMapping("/client/{clientName}")
    public ResponseEntity<List<Dispute>> getClientDisputes(
            @PathVariable String clientName
    ) {
        if (clientName == null || clientName.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(disputeService.getClientDisputes(clientName));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Dispute> getDisputeById(@PathVariable String id) {
        return ResponseEntity.ok(disputeService.getDisputeById(id));
    }

    @PostMapping
    public ResponseEntity<Dispute> createDispute(@RequestBody CreateDisputeRequest request) {
        return ResponseEntity.ok(disputeService.createDispute(request));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<DisputeMessage> addMessage(@PathVariable String id, @RequestBody AddDisputeMessageRequest request) {
        return ResponseEntity.ok(disputeService.addMessage(id, request));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Dispute> resolveDispute(@PathVariable String id, @RequestBody ResolveDisputeRequest request) {
        return ResponseEntity.ok(disputeService.resolveDispute(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Dispute> updateStatus(@PathVariable String id, @RequestBody ResolveDisputeRequest request) {
        return ResponseEntity.ok(disputeService.resolveDispute(id, request));
    }
}
