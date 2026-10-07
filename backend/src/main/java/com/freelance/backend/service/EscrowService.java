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

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private com.freelance.backend.repository.ContractRepository contractRepository;


    public EscrowSummaryDTO getEscrowSummary() {
        return getEscrowSummary(null);
    }

    public EscrowSummaryDTO getEscrowSummary(String freelancerName) {
        if (freelancerName != null && !freelancerName.isBlank()) {
            List<com.freelance.backend.entity.Contract> freelancerContracts = contractRepository.findByFreelancerNameIgnoreCase(freelancerName.trim());

            if (freelancerContracts.isEmpty()) {
                return new EscrowSummaryDTO(0.0, 0.0, 0.0, 0.0);
            }

            List<String> contractIds = freelancerContracts.stream().map(com.freelance.backend.entity.Contract::getId).toList();
            List<Milestone> milestones = milestoneRepository.findByContractIdIn(contractIds);

            Double totalFunded = milestones.stream()
                    .filter(m -> "FUNDED".equalsIgnoreCase(m.getStatus()) || "DELIVERED".equalsIgnoreCase(m.getStatus()))
                    .mapToDouble(Milestone::getAmount)
                    .sum();

            Double totalReleased = milestones.stream()
                    .filter(m -> "RELEASED".equalsIgnoreCase(m.getStatus()))
                    .mapToDouble(Milestone::getAmount)
                    .sum();

            return new EscrowSummaryDTO(totalFunded, totalFunded, totalReleased, totalReleased);
        }

        List<Milestone> milestones = milestoneRepository.findAll();

        Double totalFunded = milestones.stream()
                .filter(m -> "FUNDED".equalsIgnoreCase(m.getStatus()) || "DELIVERED".equalsIgnoreCase(m.getStatus()))
                .mapToDouble(Milestone::getAmount)
                .sum();

        Double totalReleased = milestones.stream()
                .filter(m -> "RELEASED".equalsIgnoreCase(m.getStatus()))
                .mapToDouble(Milestone::getAmount)
                .sum();

        Double availableBalance = totalReleased > 0 ? totalReleased : 0.0;

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
