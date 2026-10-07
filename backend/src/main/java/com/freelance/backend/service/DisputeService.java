package com.freelance.backend.service;

import com.freelance.backend.dto.CreateDisputeRequest;
import com.freelance.backend.dto.ResolveDisputeRequest;
import com.freelance.backend.entity.Dispute;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.DisputeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
public class DisputeService {

    private final DisputeRepository disputeRepository;

    public DisputeService(DisputeRepository disputeRepository) {
        this.disputeRepository = disputeRepository;
    }

    public List<Dispute> getAllDisputes() {
        return disputeRepository.findAll();
    }

    public Dispute getDisputeById(String id) {
        return disputeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute case not found: " + id));
    }

    public Dispute createDispute(CreateDisputeRequest request) {
        String id = "DSP-" + (400 + new Random().nextInt(100));
        Double amount = request.getAmount() != null ? request.getAmount() : 1200.0;
        String parties = request.getParties() != null ? request.getParties() : "Client vs Freelancer";

        Dispute dispute = new Dispute(
                id,
                id,
                request.getProject(),
                parties,
                request.getIssueType(),
                request.getDescription(),
                request.getEvidenceFile(),
                amount,
                "Open",
                "open"
        );

        return disputeRepository.save(dispute);
    }

    public Dispute resolveDispute(String id, ResolveDisputeRequest request) {
        Dispute dispute = getDisputeById(id);
        if (request.getStatus() != null) {
            dispute.setStatus(request.getStatus());
        } else {
            dispute.setStatus("Resolved");
        }

        if (request.getStatusType() != null) {
            dispute.setStatusType(request.getStatusType());
        } else {
            dispute.setStatusType("resolved");
        }

        if (request.getResolutionNote() != null) {
            dispute.setResolutionNote(request.getResolutionNote());
        }

        return disputeRepository.save(dispute);
    }
}
