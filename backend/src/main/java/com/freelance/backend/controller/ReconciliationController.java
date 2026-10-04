package com.freelance.backend.controller;

import com.freelance.backend.entity.ReconciliationRecord;
import com.freelance.backend.service.ReconciliationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reconciliation")
@CrossOrigin(origins = "*")
public class ReconciliationController {

    @Autowired
    private ReconciliationService reconciliationService;

    @GetMapping
    public ResponseEntity<List<ReconciliationRecord>> getReconciliationRecords() {
        return ResponseEntity.ok(reconciliationService.getReconciliationRecords());
    }

    @PostMapping("/run")
    public ResponseEntity<List<ReconciliationRecord>> runReconciliation() {
        return ResponseEntity.ok(reconciliationService.runReconciliation());
    }
}
