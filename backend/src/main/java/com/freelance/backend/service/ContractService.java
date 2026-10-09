package com.freelance.backend.service;

import com.freelance.backend.entity.Contract;
import com.freelance.backend.entity.Notification;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.ContractRepository;
import com.freelance.backend.repository.NotificationRepository;
import com.freelance.backend.repository.FreelancerProfileRepository;
import com.freelance.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

import static org.springframework.data.jpa.domain.AbstractPersistable_.id;

@Service
public class ContractService {

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ProjectService projectService;

    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private FreelancerProfileRepository profileRepository;

    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    public Contract getContractById(String id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + id));
    }

    public List<Contract> getContractForClient(String name) {
        if (name == null || name.isBlank()) {
            return List.of();
        }

        return contractRepository.findByClientNameOrFreelancerName(name.trim(), null);
    }

    public Contract createContract(Contract contract) {
        if (contract.getMilestones() != null) {
            for (com.freelance.backend.entity.Milestone m : contract.getMilestones()) {
                m.setContract(contract);
                if (m.getContractId() == null || m.getContractId().isBlank()) {
                    m.setContractId(contract.getId());
                }
            }
        }
        if (contract.getFreelancerEmail() != null && !contract.getFreelancerEmail().isBlank()) {
            contract.setFreelancerEmail(contract.getFreelancerEmail().trim().toLowerCase());
        } else if (contract.getFreelancerName() != null && userRepository != null) {
            List<com.freelance.backend.entity.User> matches = userRepository.findAllByFullNameIgnoreCase(contract.getFreelancerName().trim())
                    .stream()
                    .filter(user -> user.getRole() == com.freelance.backend.entity.UserRole.FREELANCER)
                    .toList();
            if (matches.size() == 1) {
                contract.setFreelancerEmail(matches.get(0).getEmail().trim().toLowerCase());
            }
        }
        return contractRepository.save(contract);
    }

    public Contract updateContractStatus(String id, String status) {
        Contract contract = getContractById(id);
        contract.setStatus(status);

        if ("PENDING".equalsIgnoreCase(status) || "OFFERED".equalsIgnoreCase(status) || "SENT".equalsIgnoreCase(status)) {
            String amountFormatted = contract.getTotalBudget() != null
                    ? "$" + String.format("%,.0f", contract.getTotalBudget())
                    : "$8,500";

            String freelancer = contract.getFreelancerName();
            String client = contract.getClientName() != null && !contract.getClientName().isBlank()
                    ? contract.getClientName()
                    : "TechVentures Inc.";

            Notification notif = new Notification(
                    freelancer,
                    client,
                    contract.getTitle() != null ? contract.getTitle() : "New Project Contract",
                    "New contract offer from " + client + " • Signature Required",
                    "New Contract",
                    "contract",
                    amountFormatted,
                    "Contracts",
                    "/contract-details?id=" + contract.getId(),
                    "View Contract & Sign",
                    true,
                    "Just now",
                    "CONTRACT_RECEIVED",
                    contract.getId(),
                    "Client " + client + " has selected you and sent a contract offer for '" + contract.getTitle() + "' with total budget of " + amountFormatted + ". Review milestones and sign to start work."
            );
            if (contract.getFreelancerEmail() != null && !contract.getFreelancerEmail().isBlank()) {
                notif.setRecipientEmail(contract.getFreelancerEmail().trim().toLowerCase());
            } else if (userRepository != null) {
                userRepository.findByFullNameIgnoreCase(freelancer).ifPresent(user -> notif.setRecipientEmail(user.getEmail()));
            }
            notificationRepository.save(notif);
        }

        if ("ACTIVE".equalsIgnoreCase(status) || "IN_PROGRESS".equalsIgnoreCase(status)) {
            Notification notif = new Notification(
                    contract.getFreelancerName(),
                    contract.getClientName(),
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
            if (contract.getFreelancerEmail() != null && !contract.getFreelancerEmail().isBlank()) {
                notif.setRecipientEmail(contract.getFreelancerEmail().trim().toLowerCase());
            } else if (userRepository != null) {
                userRepository.findByFullNameIgnoreCase(contract.getFreelancerName()).ifPresent(user -> notif.setRecipientEmail(user.getEmail()));
            }
            notificationRepository.save(notif);
        }

        return contractRepository.save(contract);
    }

    public List<Contract> getFreelancerContracts(String freelancerName) {
        if (freelancerName == null || freelancerName.isBlank()) {
            return List.of();
        }
        String clean = freelancerName.trim();
        if (clean.contains("@")) {
            return getFreelancerContractsByEmail(clean);
        }
        return contractRepository.findByFreelancerNameIgnoreCase(clean);
    }

    public List<Contract> getFreelancerContractsByEmail(String email) {
        if (email == null || email.isBlank()) {
            return List.of();
        }
        String cleanEmail = email.trim();
        return contractRepository.findByFreelancerEmailIgnoreCase(cleanEmail);
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
                contract.getFreelancerName(),
                contract.getClientName(),
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
                contract.getClientName(),
                contract.getFreelancerName(),
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
                contract.getClientName(),
                contract.getFreelancerName(),
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

    public void deleteContract(String id) {
        contractRepository.deleteById(id);
    }
}
