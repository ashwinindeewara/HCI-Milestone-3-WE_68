package com.freelance.backend.controller;

import com.freelance.backend.dto.CreateDisputeRequest;
import com.freelance.backend.dto.ResolveDisputeRequest;
import com.freelance.backend.entity.Dispute;
import com.freelance.backend.service.DisputeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disputes")
@CrossOrigin(origins = "*")
public class DisputeController {

    @Autowired
    private DisputeService disputeService;

    @GetMapping
    public ResponseEntity<List<Dispute>> getAllDisputes() {
        return ResponseEntity.ok(disputeService.getAllDisputes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Dispute> getDisputeById(@PathVariable String id) {
        return ResponseEntity.ok(disputeService.getDisputeById(id));
    }

    @PostMapping
    public ResponseEntity<Dispute> createDispute(@RequestBody CreateDisputeRequest request) {
        return ResponseEntity.ok(disputeService.createDispute(request));
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
