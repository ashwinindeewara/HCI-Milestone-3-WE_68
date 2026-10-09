package com.freelance.backend.controller;

import com.freelance.backend.dto.DeliverableRequest;
import com.freelance.backend.entity.Deliverable;
import com.freelance.backend.entity.Milestone;
import com.freelance.backend.service.MilestoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/milestones")
@CrossOrigin(origins = "*")
public class MilestoneController {

    private final MilestoneService milestoneService;

    public MilestoneController(MilestoneService milestoneService) {
        this.milestoneService = milestoneService;
    }

    @GetMapping("/contract/{contractId}")
    public ResponseEntity<List<Milestone>> getMilestonesByContract(@PathVariable String contractId) {
        return ResponseEntity.ok(milestoneService.getMilestonesByContract(contractId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Milestone> getMilestoneById(@PathVariable String id) {
        return ResponseEntity.ok(milestoneService.getMilestoneById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Milestone> updateStatus(@PathVariable String id, @RequestParam String status) {
        return ResponseEntity.ok(milestoneService.updateMilestoneStatus(id, status));
    }

    @PostMapping("/{milestoneId}/deliverables")
    public ResponseEntity<Deliverable> uploadDeliverable(
            @PathVariable String milestoneId,
            @RequestBody DeliverableRequest request) {
        return ResponseEntity.ok(milestoneService.addDeliverable(milestoneId, request));
    }

    @GetMapping("/{milestoneId}/deliverables")
    public ResponseEntity<List<Deliverable>> getDeliverables(@PathVariable String milestoneId) {
        return ResponseEntity.ok(milestoneService.getDeliverablesForMilestone(milestoneId));
    }
    @PostMapping("/{id}/request-changes")
    public ResponseEntity<Milestone> requestChanges(
            @PathVariable String id,
            @RequestBody(required = false) java.util.Map<String, String> payload
    ) {
        String reason = payload != null ? payload.get("reason") : "Revisions requested by client.";
        return ResponseEntity.ok(milestoneService.requestMilestoneChanges(id, reason));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Milestone> approveMilestone(@PathVariable String id) {
        List<Deliverable> deliverables = milestoneService.getDeliverablesForMilestone(id);
        if (!deliverables.isEmpty()) {
            milestoneService.approveDeliverable(deliverables.get(0).getId());
        } else {
            milestoneService.updateMilestoneStatus(id, "COMPLETED");
        }
        return ResponseEntity.ok(milestoneService.getMilestoneById(id));
    }

    @DeleteMapping("/deliverables/{deliverableId}")
    public ResponseEntity<Void> deleteDeliverable(@PathVariable String deliverableId) {
        milestoneService.deleteDeliverable(deliverableId);
        return ResponseEntity.noContent().build();
    }
}
