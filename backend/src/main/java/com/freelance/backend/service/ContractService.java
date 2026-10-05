package com.freelance.backend.service;

import com.freelance.backend.entity.Contract;
import com.freelance.backend.entity.Notification;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.ContractRepository;
import com.freelance.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ContractService {

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ProjectService projectService;

    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    public Contract getContractById(String id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + id));
    }

    public Contract createContract(Contract contract) {
        Contract saved = contractRepository.save(contract);

        // Automatically create and trigger the first notification for the new contract
        String amountFormatted = saved.getTotalBudget() != null
                ? "$" + String.format("%,.0f", saved.getTotalBudget())
                : "$8,500";

        String client = saved.getClientName() != null && !saved.getClientName().isBlank()
                ? saved.getClientName()
                : "TechVentures Inc.";

        Notification notif = new Notification(
                saved.getTitle() != null ? saved.getTitle() : "New Project Contract",
                "New contract offer from " + client + " • Signature Required",
                "New Contract",
                "contract",
                amountFormatted,
                "Contracts",
                "/contract-details?id=" + saved.getId(),
                "View Contract & Sign",
                true,
                "Just now",
                "CONTRACT_RECEIVED",
                saved.getId(),
                "Client " + client + " has sent you a new contract proposal for '" + saved.getTitle() + "' with total budget of " + amountFormatted + ". Review milestones and sign to start work."
        );
        notificationRepository.save(notif);

        return saved;
    }

    public Contract updateContractStatus(String id, String status) {
        Contract contract = getContractById(id);
        contract.setStatus(status);

        if ("ACTIVE".equalsIgnoreCase(status) || "IN_PROGRESS".equalsIgnoreCase(status)) {
            Notification notif = new Notification(
                    contract.getTitle(),
                    "Contract activated with " + contract.getClientName() + " • Escrow Funded",
                    "Contract Active",
                    "approved",
                    contract.getTotalBudget() != null ? "$" + String.format("%,.0f", contract.getTotalBudget()) : "$8,500",
                    "Contracts",
                    "/project-details?id=" + contract.getId(),
                    "View Project Milestones",
                    true,
                    "Just now",
                    "CONTRACT_ACTIVE",
                    contract.getId(),
                    "Contract " + contract.getId() + " is now active. Escrow funds have been secured and project workspace initialized."
            );
            notificationRepository.save(notif);
        }

        return contractRepository.save(contract);
    }

    public List<Contract> getFreelancerContracts(String freelancerName) {
        if (freelancerName != null && !freelancerName.isBlank()) {
            return contractRepository.findAll().stream()
                    .filter(c -> freelancerName.equalsIgnoreCase(c.getFreelancerName()))
                    .toList();
        }
        return contractRepository.findAll();
    }

    public Contract acceptContract(String id, String signerName) {
        return signContract(id, signerName);
    }

    public Contract signContract(String id, String signerName) {
        Contract contract = getContractById(id);
        contract.setIsSigned(true);
        contract.setStatus("ACCEPTED");
        if (signerName != null && !signerName.isBlank()) {
            contract.setSignatoryName(signerName);
        }
        contract.setSignedDate("Oct 05, 2024");

        Contract savedContract = contractRepository.save(contract);

        // Requirement 10: Accept Contract -> Automatically Create / Activate Project!
        projectService.createOrActivateProjectFromContract(savedContract);

        // Freelancer confirmation notification
        Notification notifFreelancer = new Notification(
                contract.getTitle(),
                "Contract accepted & project activated for " + contract.getClientName(),
                "Contract Active",
                "approved",
                contract.getTotalBudget() != null ? "$" + String.format("%,.0f", contract.getTotalBudget()) : "$8,000",
                "Contracts",
                "/project-details?id=" + contract.getId(),
                "View Project Overview",
                true,
                "Just now",
                "CONTRACT_ACCEPTED",
                contract.getId(),
                "You have accepted and signed the contract for '" + contract.getTitle() + "'. Project PRJ-" + contract.getId() + " is now active."
        );
        notificationRepository.save(notifFreelancer);

        // Client notification
        Notification notifClient = new Notification(
                "Contract Signed by " + contract.getFreelancerName(),
                contract.getFreelancerName() + " has signed the contract for " + contract.getTitle() + ". Project is now active.",
                "Contract Signed",
                "contract",
                contract.getTotalBudget() != null ? "$" + String.format("%,.0f", contract.getTotalBudget()) : "$8,000",
                "Contracts",
                "/project-details?id=" + contract.getId(),
                "View Project Details",
                true,
                "Just now",
                "CONTRACT_SIGNED",
                contract.getId(),
                "Freelancer " + contract.getFreelancerName() + " has officially signed the contract for " + contract.getTitle() + "."
        );
        notificationRepository.save(notifClient);

        return savedContract;
    }

    public Contract rejectContract(String id, String reason) {
        Contract contract = getContractById(id);
        contract.setStatus("REJECTED");
        contract.setIsSigned(false);
        Contract saved = contractRepository.save(contract);

        String rejectionReason = (reason != null && !reason.isBlank()) ? reason : "Terms not accepted";

        Notification notifClient = new Notification(
                "Contract Declined by " + contract.getFreelancerName(),
                contract.getFreelancerName() + " declined the contract for " + contract.getTitle() + ". Reason: " + rejectionReason,
                "Contract Rejected",
                "open",
                contract.getTotalBudget() != null ? "$" + String.format("%,.0f", contract.getTotalBudget()) : "$8,000",
                "Contracts",
                "/contract-details?id=" + contract.getId(),
                "Review Contract Terms",
                true,
                "Just now",
                "CONTRACT_REJECTED",
                contract.getId(),
                "Freelancer " + contract.getFreelancerName() + " declined contract " + contract.getId() + ". Reason: " + rejectionReason
        );
        notificationRepository.save(notifClient);

        return saved;
    }
}
