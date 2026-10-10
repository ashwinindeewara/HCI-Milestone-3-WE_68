package com.freelance.backend.controller;

import com.freelance.backend.dto.ReconciliationCountsDTO;
import com.freelance.backend.dto.ReconciliationFlagRequest;
import com.freelance.backend.dto.ReconciliationNoteRequest;
import com.freelance.backend.entity.ReconciliationRecord;
import com.freelance.backend.service.ReconciliationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/reconciliation", "/api/reconciliation", "/api/v1/staff/reconcile", "/api/staff/reconcile"})
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ReconciliationController {

    private final ReconciliationService reconciliationService;

    public ReconciliationController(ReconciliationService reconciliationService) {
        this.reconciliationService = reconciliationService;
    }

    @GetMapping
    public ResponseEntity<List<ReconciliationRecord>> getReconciliationRecords(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(reconciliationService.getReconciliationRecords(status));
    }

    @GetMapping("/counts")
    public ResponseEntity<ReconciliationCountsDTO> getReconciliationCounts() {
        return ResponseEntity.ok(reconciliationService.getReconciliationCounts());
    }

    @PostMapping("/{id}/match")
    public ResponseEntity<ReconciliationRecord> matchRecord(@PathVariable String id) {
        return ResponseEntity.ok(reconciliationService.matchRecord(id));
    }

    @PostMapping("/{id}/flag")
    public ResponseEntity<ReconciliationRecord> flagRecord(
            @PathVariable String id,
            @RequestBody(required = false) ReconciliationFlagRequest request) {
        String reason = (request != null) ? request.getReason() : null;
        return ResponseEntity.ok(reconciliationService.flagRecord(id, reason));
    }

    @PostMapping("/{id}/note")
    public ResponseEntity<ReconciliationRecord> addNote(
            @PathVariable String id,
            @RequestBody(required = false) ReconciliationNoteRequest request) {
        String notes = (request != null) ? request.getNotes() : null;
        return ResponseEntity.ok(reconciliationService.addNoteToRecord(id, notes));
    }

    @PostMapping("/run")
    public ResponseEntity<List<ReconciliationRecord>> runReconciliation() {
        return ResponseEntity.ok(reconciliationService.runReconciliation());
    }
}
