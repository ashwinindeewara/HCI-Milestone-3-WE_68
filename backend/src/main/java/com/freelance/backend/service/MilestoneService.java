package com.freelance.backend.service;

import com.freelance.backend.dto.DeliverableRequest;
import com.freelance.backend.entity.*;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final DeliverableRepository deliverableRepository;

    public MilestoneService(MilestoneRepository milestoneRepository, DeliverableRepository deliverableRepository) {
        this.milestoneRepository = milestoneRepository;
        this.deliverableRepository = deliverableRepository;
    }

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ProjectService projectService;

    public List<Milestone> getMilestonesByContract(String contractId) {
        return milestoneRepository.findByContractId(contractId);
    }

    public Milestone getMilestoneById(String id) {
        return milestoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found with id: " + id));
    }

    public Milestone updateMilestoneStatus(String id, String status) {
        Milestone milestone = getMilestoneById(id);
        milestone.setStatus(status);
        return milestoneRepository.save(milestone);
    }

    @Transactional
    public Deliverable addDeliverable(String milestoneId, DeliverableRequest request) {
        Milestone milestone = getMilestoneById(milestoneId);

        String deliverableId = "D-" + System.currentTimeMillis();
        String uploadDate = request.getUploadedAt() != null ? request.getUploadedAt() : LocalDateTime.now().toString().split("T")[0];

        Deliverable deliverable = new Deliverable(
                deliverableId,
                milestoneId,
                request.getFileName() != null ? request.getFileName() : "deliverable-assets.zip",
                request.getFileSize() != null ? request.getFileSize() : "4.2 MB",
                request.getNotes(),
                uploadDate,
                "SUBMITTED"
        );
        deliverable.setMilestone(milestone);

        Deliverable savedDeliverable = deliverableRepository.save(deliverable);

        // Update milestone status to SUBMITTED
        milestone.setStatus("SUBMITTED");
        milestoneRepository.save(milestone);
        recalculateProjectProgress(milestone.getContractId());

        // Notify client and log activity
        if (milestone.getContractId() != null) {
            contractRepository.findById(milestone.getContractId()).ifPresent(contract -> {
                Notification notif = new Notification(
                        "Deliverable Submitted for " + milestone.getTitle(),
                        contract.getFreelancerName() + " has submitted work for " + milestone.getTitle() + ". Please review deliverables.",
                        "Submitted",
                        "review",
                        milestone.getAmount() != null ? "$" + String.format("%,.0f", milestone.getAmount()) : "$2,000",
                        "Deliverables",
                        "/client-milestone-review?contractId=" + contract.getId() + "&milestoneId=" + milestone.getId(),
                        "Review Deliverable",
                        true,
                        "Just now",
                        "DELIVERABLE_SUBMITTED",
                        milestone.getId(),
                        "Freelancer " + contract.getFreelancerName() + " uploaded '" + savedDeliverable.getFileName() + "' for milestone '" + milestone.getTitle() + "'. Awaiting client approval."
                );
                notif.setRecipientName(contract.getClientName());
                notif.setSenderName(contract.getFreelancerName());
                findUserEmail(contract.getClientName()).ifPresent(notif::setRecipientEmail);
                notificationRepository.save(notif);

                projectService.logActivity(
                        "PRJ-" + contract.getId(),
                        contract.getId(),
                        "MILESTONE_DELIVERED",
                        "Submitted deliverable '" + savedDeliverable.getFileName() + "' for " + milestone.getTitle(),
                        contract.getFreelancerName()
                );
            });
        }

        return savedDeliverable;
    }

    public List<Deliverable> getDeliverablesForMilestone(String milestoneId) {
        return deliverableRepository.findByMilestoneId(milestoneId);
    }
    @Transactional
    public void deleteDeliverable(String deliverableId) {
        Deliverable deliverable = getDeliverableById(deliverableId);
        Milestone milestone = milestoneRepository.findById(deliverable.getMilestoneId()).orElse(null);
        deliverableRepository.delete(deliverable);
        if (milestone == null) return;

        boolean hasActiveDeliverable = deliverableRepository.findByMilestoneId(milestone.getId()).stream()
                .anyMatch(d -> !"REJECTED".equalsIgnoreCase(d.getStatus()));
        if (!hasActiveDeliverable) {
            milestone.setStatus("FUNDED");
            milestoneRepository.save(milestone);
        }
        recalculateProjectProgress(milestone.getContractId());
    }

    private void recalculateProjectProgress(String contractId) {
        if (contractId == null) return;
        List<Milestone> allMilestones = milestoneRepository.findByContractId(contractId);
        int progress = calculateProgress(allMilestones, true);
        contractRepository.findById(contractId).ifPresent(contract -> {
            contract.setCompletionPercentage(progress);
            contractRepository.save(contract);
        });
        projectRepository.findByContractId(contractId).ifPresent(project -> {
            project.setCompletionPercentage(progress);
            if (progress < 100 && "COMPLETED".equalsIgnoreCase(project.getStatus())) project.setStatus("ACTIVE");
            projectRepository.save(project);
        });
    }

    private int calculateProgress(List<Milestone> milestones, boolean includeSubmitted) {
        long completedCount = milestones.stream()
                .filter(m -> "COMPLETED".equalsIgnoreCase(m.getStatus())
                        || "RELEASED".equalsIgnoreCase(m.getStatus())
                        || (includeSubmitted && "SUBMITTED".equalsIgnoreCase(m.getStatus())))
                .count();
        if (milestones.isEmpty()) return 0;
        if (milestones.size() == 3) {
            return switch ((int) completedCount) {
                case 1 -> 30;
                case 2 -> 65;
                case 3 -> 100;
                default -> 0;
            };
        }
        return (int) ((completedCount * 100) / milestones.size());
    }

    public Deliverable getDeliverableById(String id) {
        return deliverableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deliverable not found with id: " + id));
    }

    @Transactional
    public Deliverable approveDeliverable(String deliverableId) {
        Deliverable deliverable = getDeliverableById(deliverableId);
        deliverable.setStatus("APPROVED");
        Deliverable saved = deliverableRepository.save(deliverable);

        Milestone milestone = milestoneRepository.findById(deliverable.getMilestoneId())
                .orElse(null);

        if (milestone != null) {
            milestone.setStatus("COMPLETED");
            milestoneRepository.save(milestone);

            String contractId = milestone.getContractId();
            if (contractId != null) {
                // Update project & contract progress
                List<Milestone> allMilestones = milestoneRepository.findByContractId(contractId);
                int progress = calculateProgress(allMilestones, true);

                contractRepository.findById(contractId).ifPresent(c -> {
                    c.setCompletionPercentage(progress);
                    if (progress >= 100) {
                        c.setStatus("COMPLETED");
                        c.setActiveStatusBadge("Completed & Paid");
                    }
                    contractRepository.save(c);

                    // Create transaction for payout / fund release
                    String txnId = "TXN-" + (2850 + new Random().nextInt(500));
                    String refNo = "FTX-" + (90190 + new Random().nextInt(500));
                    DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a");
                    String now = LocalDateTime.now().format(dtf);

                    Transaction txn = new Transaction(
                            txnId,
                            refNo,
                            contractId,
                            milestone.getId(),
                            milestone.getTitle(),
                            milestone.getAmount() != null ? milestone.getAmount() : 2000.0,
                            "RELEASE",
                            "COMPLETED",
                            now
                    );
                    transactionRepository.save(txn);

                    // Notify Freelancer
                    Notification notif = new Notification(
                            "Milestone Approved & Payment Released!",
                            "Client approved deliverables for " + milestone.getTitle() + ". $" + String.format("%,.0f", milestone.getAmount()) + " has been released to your balance.",
                            "Approved",
                            "approved",
                            milestone.getAmount() != null ? "$" + String.format("%,.0f", milestone.getAmount()) : "$2,000",
                            "Payments",
                            "/(tabs)/escrow",
                            "View Payment Details",
                            true,
                            "Just now",
                            "DELIVERABLE_APPROVED",
                            milestone.getId(),
                            "Congratulations! Client approved your deliverable for milestone '" + milestone.getTitle() + "'. Funds of $" + String.format("%,.0f", milestone.getAmount()) + " have been credited to your payout balance."
                    );
                    notif.setRecipientName(c.getFreelancerName());
                    notif.setSenderName(c.getClientName());
                    findUserEmail(c.getFreelancerName()).ifPresent(notif::setRecipientEmail);
                    notificationRepository.save(notif);

                    projectService.logActivity(
                            "PRJ-" + contractId,
                            contractId,
                            "DELIVERABLE_APPROVED",
                            "Deliverable approved and funds released for " + milestone.getTitle(),
                            c.getClientName()
                    );
                });

                projectRepository.findByContractId(contractId).ifPresent(p -> {
                    p.setCompletionPercentage(progress);
                    if (progress >= 100) {
                        p.setStatus("COMPLETED");
                        p.setStatusBadge("Completed & Paid");
                    }
                    projectRepository.save(p);
                });
            }
        }

        return saved;
    }

    @Transactional
    public Deliverable rejectDeliverable(String deliverableId, String feedback) {
        Deliverable deliverable = getDeliverableById(deliverableId);
        deliverable.setStatus("REJECTED");
        deliverable.setFeedback(feedback != null ? feedback : "Revisions requested by client.");
        Deliverable saved = deliverableRepository.save(deliverable);

        Milestone milestone = milestoneRepository.findById(deliverable.getMilestoneId())
                .orElse(null);

        if (milestone != null) {
            milestone.setStatus("IN_PROGRESS");
            milestoneRepository.save(milestone);
            recalculateProjectProgress(milestone.getContractId());

            String contractId = milestone.getContractId();
            if (contractId != null) {
                contractRepository.findById(contractId).ifPresent(c -> {
                    Notification notif = new Notification(
                            "Deliverable Revision Requested: " + milestone.getTitle(),
                            "Client requested changes for " + milestone.getTitle() + ": " + deliverable.getFeedback(),
                            "Revision Needed",
                            "review",
                            milestone.getAmount() != null ? "$" + String.format("%,.0f", milestone.getAmount()) : "$2,000",
                            "Deliverables",
                            "/project-details?id=" + contractId,
                            "View Milestone & Resubmit",
                            true,
                            "Just now",
                            "DELIVERABLE_REJECTED",
                            milestone.getId(),
                            "Client has requested revisions on milestone '" + milestone.getTitle() + "'. Feedback provided: \"" + deliverable.getFeedback() + "\". Please revise and re-upload your files."
                    );
                    notif.setRecipientName(c.getFreelancerName());
                    notif.setSenderName(c.getClientName());
                    findUserEmail(c.getFreelancerName()).ifPresent(notif::setRecipientEmail);
                    notificationRepository.save(notif);

                    projectService.logActivity(
                            "PRJ-" + contractId,
                            contractId,
                            "DELIVERABLE_REJECTED",
                            "Revision requested for " + milestone.getTitle() + ": " + deliverable.getFeedback(),
                            c.getClientName()
                    );
                });
            }
        }

        return saved;
    }

    private java.util.Optional<String> findUserEmail(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return java.util.Optional.empty();
        }
        return userRepository.findByFullNameIgnoreCase(fullName.trim()).map(User::getEmail);
    }
}
