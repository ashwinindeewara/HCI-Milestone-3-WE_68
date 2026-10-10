package com.freelance.backend.service;

import com.freelance.backend.dto.EscrowSummaryDTO;
import com.freelance.backend.dto.WithdrawalRequest;
import com.freelance.backend.entity.Contract;
import com.freelance.backend.entity.Milestone;
import com.freelance.backend.entity.Notification;
import com.freelance.backend.entity.User;
import com.freelance.backend.entity.UserRole;
import com.freelance.backend.exception.BadRequestException;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.MilestoneRepository;
import com.freelance.backend.repository.NotificationRepository;
import com.freelance.backend.repository.TransactionRepository;
import com.freelance.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EscrowService {

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private com.freelance.backend.repository.ContractRepository contractRepository;

    @Autowired(required = false)
    private com.freelance.backend.repository.UserRepository userRepository;

    @Autowired(required = false)
    private com.freelance.backend.repository.FreelancerProfileRepository profileRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    public EscrowSummaryDTO getEscrowSummary() {
        return getEscrowSummary(null);
    }

    public EscrowSummaryDTO getEscrowSummary(String freelancerName) {
        if (freelancerName != null && !freelancerName.isBlank()) {
            String name = freelancerName.trim();
            if (name.contains("@")) {
                if (profileRepository != null) {
                    var p = profileRepository.findByEmailIgnoreCase(name);
                    if (p.isPresent() && p.get().getFullName() != null && !p.get().getFullName().isBlank()) {
                        name = p.get().getFullName().trim();
                    }
                }
                if (userRepository != null && name.contains("@")) {
                    var u = userRepository.findByEmailIgnoreCase(name);
                    if (u.isPresent() && u.get().getFullName() != null && !u.get().getFullName().isBlank()) {
                        name = u.get().getFullName().trim();
                    }
                }
            }
            List<com.freelance.backend.entity.Contract> freelancerContracts = contractRepository.findByFreelancerNameIgnoreCase(name);

            if (freelancerContracts.isEmpty()) {
                return new EscrowSummaryDTO(0.0, 0.0, 0.0, 0.0);
            }

            List<String> contractIds = freelancerContracts.stream().map(com.freelance.backend.entity.Contract::getId).toList();
            List<Milestone> milestones = milestoneRepository.findByContractIdIn(contractIds);

            Double totalFunded = milestones.stream()
                    .filter(m -> "FUNDED".equalsIgnoreCase(m.getStatus()) || "DELIVERED".equalsIgnoreCase(m.getStatus()) || "SUBMITTED".equalsIgnoreCase(m.getStatus()))
                    .mapToDouble(Milestone::getAmount)
                    .sum();

            Double totalReleased = milestones.stream()
                    .filter(m -> "RELEASED".equalsIgnoreCase(m.getStatus()) || "COMPLETED".equalsIgnoreCase(m.getStatus()))
                    .mapToDouble(Milestone::getAmount)
                    .sum();

            double totalWithdrawn = transactionRepository.findByContractIdIn(contractIds).stream()
                    .filter(transaction -> "WITHDRAW".equalsIgnoreCase(transaction.getType())
                            && "WITHDRAWN".equalsIgnoreCase(transaction.getStatus()))
                    .mapToDouble(transaction -> Math.abs(transaction.getAmount() == null ? 0 : transaction.getAmount()))
                    .sum();
            return new EscrowSummaryDTO(totalFunded, totalFunded, totalReleased,
                    Math.max(0, totalReleased - totalWithdrawn));
        }

        List<Milestone> milestones = milestoneRepository.findAll();

        Double totalFunded = milestones.stream()
                .filter(m -> "FUNDED".equalsIgnoreCase(m.getStatus()) || "DELIVERED".equalsIgnoreCase(m.getStatus()) || "SUBMITTED".equalsIgnoreCase(m.getStatus()))
                .mapToDouble(Milestone::getAmount)
                .sum();

        Double totalReleased = milestones.stream()
                .filter(m -> "RELEASED".equalsIgnoreCase(m.getStatus()) || "COMPLETED".equalsIgnoreCase(m.getStatus()))
                .mapToDouble(Milestone::getAmount)
                .sum();

        Double availableBalance = totalReleased > 0 ? totalReleased : 0.0;

        return new EscrowSummaryDTO(totalFunded, totalFunded, totalReleased, availableBalance);
    }

    public Milestone fundMilestone(String milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseGet(() -> milestoneRepository.findAll().stream()
                        .filter(m -> m.getId().equalsIgnoreCase(milestoneId) || milestoneId.contains(m.getId()))
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId)));

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

    @Transactional
    public Milestone releasePayment(String milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));

        if ("RELEASED".equalsIgnoreCase(milestone.getStatus())) {
            return milestone;
        }

        if (milestone.getContractId() == null || milestone.getContractId().isBlank()) {
            throw new BadRequestException("Milestone is not associated with a project contract.");
        }

        Contract contract = contractRepository.findById(milestone.getContractId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Contract not found for milestone: " + milestone.getId()));
        String status = milestone.getStatus() == null ? "" : milestone.getStatus();
        if (!List.of("SUBMITTED", "DELIVERED", "APPROVED", "COMPLETED")
                .stream().anyMatch(status::equalsIgnoreCase)) {
            throw new BadRequestException("Only submitted or approved work can be paid.");
        }

        milestone.setStatus("RELEASED");
        Milestone released = milestoneRepository.save(milestone);
        transactionService.recordTransaction(
                contract.getId(),
                released.getId(),
                released.getTitle(),
                released.getAmount(),
                "RELEASE",
                "COMPLETED"
        );

        Notification notification = new Notification(
                "Payment Ready to Withdraw",
                contract.getClientName() + " released payment for " + released.getTitle()
                        + ". $" + String.format("%,.2f", released.getAmount())
                        + " is available in your balance.",
                "Payment Released",
                "approved",
                "$" + String.format("%,.2f", released.getAmount()),
                "Payments",
                "/(tabs)/escrow",
                "Withdraw Payment",
                true,
                "Just now",
                "PAYMENT_READY_TO_WITHDRAW",
                released.getId(),
                "Client " + contract.getClientName() + " paid for milestone '"
                        + released.getTitle() + "' on project '" + contract.getTitle()
                        + "'. The payment is ready to withdraw."
        );
        notification.setRecipientName(contract.getFreelancerName());
        notification.setSenderName(contract.getClientName());
        notification.setRecipientRole("FREELANCER");
        if (contract.getFreelancerEmail() != null && !contract.getFreelancerEmail().isBlank()) {
            notification.setRecipientEmail(contract.getFreelancerEmail().trim().toLowerCase());
        } else {
            resolveFreelancerEmail(contract.getFreelancerName())
                    .ifPresent(notification::setRecipientEmail);
        }
        notificationRepository.save(notification);

        return released;
    }

    @Transactional
    public List<com.freelance.backend.entity.Transaction> withdraw(WithdrawalRequest request) {
        if (request.getAmount() == null || !Double.isFinite(request.getAmount()) || request.getAmount() <= 0) {
            throw new BadRequestException("Withdrawal amount must be greater than zero.");
        }
        String email = request.getFreelancerEmail() == null ? "" : request.getFreelancerEmail().trim();
        String name = request.getFreelancerName() == null ? "" : request.getFreelancerName().trim();
        if (email.isBlank() && name.isBlank()) {
            throw new BadRequestException("Freelancer identity is required to withdraw funds.");
        }

        List<Contract> contracts;
        if (!email.isBlank()) {
            contracts = contractRepository.findByFreelancerEmailIgnoreCase(email);
        } else if (!name.isBlank()) {
            contracts = contractRepository.findByFreelancerNameIgnoreCase(name);
        } else {
            contracts = List.of();
        }
        if (contracts.isEmpty()) {
            throw new BadRequestException("No project contracts were found for this freelancer.");
        }

        List<String> contractIds = contracts.stream().map(Contract::getId).toList();
        Map<String, Double> releasedAmounts = milestoneRepository.findByContractIdIn(contractIds).stream()
                .filter(milestone -> "RELEASED".equalsIgnoreCase(milestone.getStatus())
                        || "COMPLETED".equalsIgnoreCase(milestone.getStatus()))
                .collect(Collectors.groupingBy(Milestone::getContractId,
                        Collectors.summingDouble(milestone -> milestone.getAmount() == null ? 0 : milestone.getAmount())));
        Map<String, Double> withdrawnAmounts = transactionRepository.findByContractIdIn(contractIds).stream()
                .filter(transaction -> "WITHDRAW".equalsIgnoreCase(transaction.getType())
                        && "WITHDRAWN".equalsIgnoreCase(transaction.getStatus()))
                .collect(Collectors.groupingBy(com.freelance.backend.entity.Transaction::getContractId,
                        Collectors.summingDouble(transaction -> Math.abs(transaction.getAmount() == null ? 0 : transaction.getAmount()))));

        double remaining = Math.round(request.getAmount() * 100.0) / 100.0;
        List<com.freelance.backend.entity.Transaction> withdrawals = new ArrayList<>();
        for (Contract contract : contracts) {
            double available = Math.max(0, releasedAmounts.getOrDefault(contract.getId(), 0.0)
                    - withdrawnAmounts.getOrDefault(contract.getId(), 0.0));
            double allocation = Math.round(Math.min(available, remaining) * 100.0) / 100.0;
            if (allocation <= 0) {
                continue;
            }

            com.freelance.backend.entity.Transaction transaction = transactionService.recordTransaction(
                    contract.getId(),
                    null,
                    "Payout Withdrawal",
                    allocation,
                    "WITHDRAW",
                    "WITHDRAWN");
            withdrawals.add(transaction);

            Notification notification = new Notification(
                    "Freelancer Withdrew Payment",
                    contract.getFreelancerName() + " withdrew $" + String.format("%,.2f", allocation)
                            + " earned from " + contract.getTitle() + ".",
                    "Payment Withdrawn",
                    "approved",
                    "$" + String.format("%,.2f", allocation),
                    "Payments",
                    "/client-contracts",
                    "View My Projects",
                    true,
                    "Just now",
                    "FREELANCER_WITHDREW_PAYMENT",
                    contract.getId(),
                    contract.getFreelancerName() + " withdrew $" + String.format("%,.2f", allocation)
                            + " from earnings for project '" + contract.getTitle() + "'.");
            notification.setRecipientRole("CLIENT");
            notification.setRecipientName(contract.getClientName());
            String clientEmail = contract.getClientEmail();
            if ((clientEmail == null || clientEmail.isBlank()) && userRepository != null
                    && contract.getClientName() != null && !contract.getClientName().isBlank()) {
                List<User> clients = userRepository.findAllByFullNameIgnoreCase(contract.getClientName().trim()).stream()
                        .filter(user -> user.getRole() == UserRole.CLIENT)
                        .toList();
                if (clients.size() == 1) {
                    clientEmail = clients.get(0).getEmail();
                }
            }
            if (clientEmail != null && !clientEmail.isBlank()) {
                notification.setRecipientEmail(clientEmail.trim().toLowerCase());
            }
            notification.setSenderName(contract.getFreelancerName());
            notificationRepository.save(notification);

            remaining = Math.round((remaining - allocation) * 100.0) / 100.0;
            if (remaining <= 0) {
                break;
            }
        }

        if (remaining > 0) {
            throw new BadRequestException("Withdrawal exceeds the available released balance.");
        }
        return withdrawals;
    }

    private Optional<String> resolveFreelancerEmail(String name) {
        if (userRepository == null || name == null || name.isBlank()) {
            return Optional.empty();
        }
        List<User> matches = userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.FREELANCER)
                .filter(user -> name.trim().equalsIgnoreCase(user.getFullName()))
                .toList();
        return matches.size() == 1 ? Optional.of(matches.get(0).getEmail()) : Optional.empty();
    }
}
