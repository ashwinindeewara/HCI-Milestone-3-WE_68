package com.freelance.backend.service;

import com.freelance.backend.dto.EscrowSummaryDTO;
import com.freelance.backend.entity.Milestone;
import com.freelance.backend.exception.BadRequestException;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.MilestoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EscrowService {

    private final MilestoneRepository milestoneRepository;
    private final TransactionService transactionService;

    public EscrowService(MilestoneRepository milestoneRepository, TransactionService transactionService) {
        this.milestoneRepository = milestoneRepository;
        this.transactionService = transactionService;
    }

    public EscrowSummaryDTO getEscrowSummary() {
        List<Milestone> milestones = milestoneRepository.findAll();

        Double totalFunded = milestones.stream()
                .filter(m -> "FUNDED".equalsIgnoreCase(m.getStatus()) || "DELIVERED".equalsIgnoreCase(m.getStatus()))
                .mapToDouble(Milestone::getAmount)
                .sum();

        Double totalReleased = milestones.stream()
                .filter(m -> "RELEASED".equalsIgnoreCase(m.getStatus()))
                .mapToDouble(Milestone::getAmount)
                .sum();

        Double availableBalance = 3200.0; // Default available balance for freelancer/platform user

        return new EscrowSummaryDTO(totalFunded, totalFunded, totalReleased, availableBalance);
    }

    public Milestone fundMilestone(String milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));

        milestone.setStatus("FUNDED");
        Milestone updated = milestoneRepository.save(milestone);

        // Record Transaction
        transactionService.recordTransaction(
                updated.getContractId(),
                updated.getId(),
                updated.getTitle(),
                updated.getAmount(),
                "FUND",
                "COMPLETED"
        );

        return updated;
    }

    public Milestone releasePayment(String milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));

        milestone.setStatus("RELEASED");
        Milestone updated = milestoneRepository.save(milestone);

        // Record Transaction
        transactionService.recordTransaction(
                updated.getContractId(),
                updated.getId(),
                updated.getTitle(),
                updated.getAmount(),
                "RELEASE",
                "COMPLETED"
        );

        return updated;
    }
}
