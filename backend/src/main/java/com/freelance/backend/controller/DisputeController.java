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
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String clientName,
            @RequestParam(required = false) String clientEmail
    ) {
        if (email != null && !email.isBlank()) {
            return ResponseEntity.ok(disputeService.getFreelancerDisputesByEmail(email));
        }
        if (freelancerName != null && !freelancerName.isBlank()) {
            return ResponseEntity.ok(disputeService.getFreelancerDisputes(freelancerName));
        }
        if ((clientName != null && !clientName.isBlank()) || (clientEmail != null && !clientEmail.isBlank())) {
            return ResponseEntity.ok(disputeService.getClientDisputes(clientName, clientEmail));
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Dispute> getDisputeById(
            @PathVariable String id,
            @RequestParam(required = false) String viewerName,
            @RequestParam(required = false) String viewerEmail,
            @RequestParam(required = false) String role
    ) {
        return ResponseEntity.ok(disputeService.getDisputeForViewer(id, viewerName, viewerEmail, role));
    }

    @PostMapping
    public ResponseEntity<Dispute> createDispute(@RequestBody CreateDisputeRequest request) {
        return ResponseEntity.ok(disputeService.createDispute(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Dispute> updateDispute(
            @PathVariable String id,
            @RequestBody CreateDisputeRequest request
    ) {
        return ResponseEntity.ok(disputeService.updateDispute(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDispute(@PathVariable String id) {
        disputeService.deleteDispute(id);
        return ResponseEntity.noContent().build();
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
