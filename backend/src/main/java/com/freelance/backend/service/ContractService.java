package com.freelance.backend.service;

import com.freelance.backend.entity.Contract;
import com.freelance.backend.entity.Notification;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.ContractRepository;
import com.freelance.backend.repository.NotificationRepository;
import com.freelance.backend.repository.FreelancerProfileRepository;
import com.freelance.backend.repository.UserRepository;
import com.freelance.backend.repository.MilestoneRepository;
import com.freelance.backend.repository.ProjectRepository;
import com.freelance.backend.entity.Milestone;
import com.freelance.backend.entity.Project;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Locale;

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

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired(required = false)
    private ProjectRepository projectRepository;

    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    /** Returns contracts created for the supplied client/company name. */
    public List<Contract> getContractsForClient(String clientName) {
        if (clientName == null || clientName.isBlank()) {
            return List.of();
        }
        return contractRepository.findByClientNameOrFreelancerName(clientName.trim(), null);
    }

    public Contract getContractById(String id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + id));
    }

    /**
     * Records a client milestone-funding action in the existing schema.
     * The contract's in_escrow_amount is increased by the milestone amount,
     * and the milestone row is marked FUNDED. Repeated calls are idempotent
     * for milestones already marked as funded/approved/released/completed.
     *
     * NOTE: This is a demo status-recording flow, not a real card/bank charge.
     */
    @Transactional
    public Map<String, Object> recordMilestonePayment(
            String contractId,
            String milestoneId,
            String paymentMethod
    ) {
        if (milestoneId == null || milestoneId.isBlank()) {
            throw new IllegalArgumentException("Milestone ID is required.");
        }

        String normalizedMethod = paymentMethod == null
                ? "CARD"
                : paymentMethod.trim().toUpperCase(Locale.ROOT);
        if (!List.of("CARD", "BANK").contains(normalizedMethod)) {
            throw new IllegalArgumentException("Payment method must be CARD or BANK.");
        }

        Contract contract = getContractById(contractId);
        Milestone milestone = milestoneRepository.findByContractId(contractId)
                .stream()
                .filter(item -> milestoneId.equals(String.valueOf(item.getId())))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Milestone " + milestoneId + " was not found for contract " + contractId
                ));

        Object rawAmount = milestone.getAmount();
        double milestoneAmount;
        try {
            milestoneAmount = rawAmount instanceof Number
                    ? ((Number) rawAmount).doubleValue()
                    : Double.parseDouble(String.valueOf(rawAmount));
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("Milestone has an invalid amount.");
        }
        if (!Double.isFinite(milestoneAmount) || milestoneAmount <= 0) {
            throw new IllegalArgumentException("Milestone amount must be greater than zero.");
        }

        String existingMilestoneStatus = milestone.getStatus() == null
                ? "PENDING"
                : milestone.getStatus().trim().toUpperCase(Locale.ROOT);
        boolean alreadyFunded = List.of(
                "FUNDED", "APPROVED", "RELEASED", "COMPLETED"
        ).contains(existingMilestoneStatus);

        double currentEscrow = contract.getInEscrowAmount() == null
                ? 0.0
                : contract.getInEscrowAmount();

        if (!alreadyFunded) {
            if (List.of("REJECTED", "CANCELLED", "CANCELED").contains(existingMilestoneStatus)) {
                throw new IllegalStateException(
                        "A rejected or cancelled milestone cannot be funded."
                );
            }

            milestone.setStatus("FUNDED");
            milestoneRepository.save(milestone);

            currentEscrow = Math.round((currentEscrow + milestoneAmount) * 100.0) / 100.0;
            contract.setInEscrowAmount(currentEscrow);
            contractRepository.save(contract);

            // Keep an existing Project row's escrow value aligned with contracts.in_escrow_amount.
            if (projectRepository != null) {
                final double escrowToPersist = currentEscrow;
                projectRepository.findByContractId(contractId).ifPresent(project -> {
                    project.setInEscrowAmount(escrowToPersist);
                    projectRepository.save(project);
                });
            }
        }

        double platformFee = Math.round(milestoneAmount * 0.05 * 100.0) / 100.0;
        double totalCharged = Math.round((milestoneAmount + platformFee) * 100.0) / 100.0;
        double budget = contract.getTotalBudget() == null ? 0.0 : contract.getTotalBudget();
        String paymentStatus = currentEscrow <= 0.0
                ? "NOT_PAID"
                : (budget > 0.0 && currentEscrow + 0.000001 >= budget
                ? "PAID"
                : "PARTIALLY_PAID");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("paymentMade", true);
        response.put("alreadyPaid", alreadyFunded);
        response.put("paymentStatus", paymentStatus);
        response.put("contractId", contractId);
        response.put("milestoneId", milestoneId);
        response.put("milestoneTitle", milestone.getTitle());
        response.put("milestoneStatus", alreadyFunded ? existingMilestoneStatus : "FUNDED");
        response.put("milestoneAmount", Math.round(milestoneAmount * 100.0) / 100.0);
        response.put("platformFee", platformFee);
        response.put("totalCharged", totalCharged);
        response.put("inEscrowAmount", currentEscrow);
        response.put("paymentMethod", normalizedMethod);
        response.put("message", alreadyFunded
                ? "This milestone was already recorded as funded. No additional escrow amount was added."
                : "Milestone funding status recorded successfully.");
        response.put("note", "Demo only: no real card or bank transaction was processed.");
        return response;
    }

    /**
     * Returns whether a contract has any funded milestones and the current
     * escrow total. The value is derived from the existing contract and milestone
     * rows, so no new database columns are required.
     */
    public Map<String, Object> getPaymentStatus(String contractId) {
        Contract contract = getContractById(contractId);
        List<Milestone> milestones = milestoneRepository.findByContractId(contractId);
        long fundedCount = milestones.stream()
                .filter(m -> m.getStatus() != null && List.of(
                        "FUNDED", "APPROVED", "RELEASED", "COMPLETED"
                ).contains(m.getStatus().trim().toUpperCase(Locale.ROOT)))
                .count();
        double escrow = contract.getInEscrowAmount() == null ? 0.0 : contract.getInEscrowAmount();
        boolean paymentMade = fundedCount > 0 || escrow > 0.0;
        double budget = contract.getTotalBudget() == null ? 0.0 : contract.getTotalBudget();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("contractId", contractId);
        response.put("paymentMade", paymentMade);
        response.put("paymentStatus", !paymentMade ? "NOT_PAID"
                : (budget > 0.0 && escrow + 0.000001 >= budget ? "PAID" : "PARTIALLY_PAID"));
        response.put("inEscrowAmount", escrow);
        response.put("totalBudget", budget);
        response.put("fundedMilestones", fundedCount);
        response.put("totalMilestones", milestones.size());
        response.put("milestones", milestones.stream().map(m -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", m.getId());
            row.put("title", m.getTitle());
            row.put("amount", m.getAmount());
            row.put("status", m.getStatus());
            row.put("paymentMade", m.getStatus() != null && List.of(
                    "FUNDED", "APPROVED", "RELEASED", "COMPLETED"
            ).contains(m.getStatus().trim().toUpperCase(Locale.ROOT)));
            return row;
        }).toList());
        return response;
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
