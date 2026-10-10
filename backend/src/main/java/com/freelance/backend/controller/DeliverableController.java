package com.freelance.backend.controller;

import com.freelance.backend.dto.DeliverableRequest;
import com.freelance.backend.entity.Deliverable;
import com.freelance.backend.service.MilestoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/deliverables")
@CrossOrigin(origins = "*")
public class DeliverableController {

    @Autowired
    private MilestoneService milestoneService;

    @GetMapping("/{id}")
    public ResponseEntity<Deliverable> getDeliverableById(@PathVariable String id) {
        return ResponseEntity.ok(milestoneService.getDeliverableById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Deliverable> updateDeliverable(
            @PathVariable String id,
            @RequestBody DeliverableRequest request
    ) {
        return ResponseEntity.ok(milestoneService.updateDeliverable(id, request));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Deliverable> approveDeliverable(@PathVariable String id) {
        return ResponseEntity.ok(milestoneService.approveDeliverable(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Deliverable> rejectDeliverable(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> payload
    ) {
        String feedback = payload != null ? payload.get("feedback") : "Revisions needed.";
        return ResponseEntity.ok(milestoneService.rejectDeliverable(id, feedback));
    }
}
