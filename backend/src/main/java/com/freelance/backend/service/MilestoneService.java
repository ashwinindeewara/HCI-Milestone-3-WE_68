package com.freelance.backend.service;

import com.freelance.backend.dto.DeliverableRequest;
import com.freelance.backend.entity.*;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
                notif.setRecipientRole("CLIENT");
                setClientRecipientEmail(notif, contract);
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

    @Transactional
    public Deliverable updateDeliverable(String deliverableId, DeliverableRequest request) {
        Deliverable deliverable = getDeliverableById(deliverableId);
        deliverable.setFileName(request.getFileName() != null ? request.getFileName() : deliverable.getFileName());
        deliverable.setFileSize(request.getFileSize() != null ? request.getFileSize() : deliverable.getFileSize());
        deliverable.setNotes(request.getNotes());
        deliverable.setStatus("SUBMITTED");
        deliverable.setFeedback(null);

        Milestone milestone = getMilestoneById(deliverable.getMilestoneId());
        milestone.setStatus("SUBMITTED");
        milestoneRepository.save(milestone);
        recalculateProjectProgress(milestone.getContractId());

        Deliverable savedDeliverable = deliverableRepository.save(deliverable);

        // Notify client and log activity on re-submission
        if (milestone.getContractId() != null) {
            contractRepository.findById(milestone.getContractId()).ifPresent(contract -> {
                Notification notif = new Notification(
                        "Deliverable Re-submitted for " + milestone.getTitle(),
                        contract.getFreelancerName() + " has re-submitted updated work for " + milestone.getTitle() + ". Please review deliverables.",
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
                        "Freelancer " + contract.getFreelancerName() + " re-uploaded '" + savedDeliverable.getFileName() + "' for milestone '" + milestone.getTitle() + "'. Awaiting client approval."
                );
                notif.setRecipientName(contract.getClientName());
                notif.setSenderName(contract.getFreelancerName());
                notif.setRecipientRole("CLIENT");
                setClientRecipientEmail(notif, contract);
                notificationRepository.save(notif);

                projectService.logActivity(
                        "PRJ-" + contract.getId(),
                        contract.getId(),
                        "MILESTONE_DELIVERED",
                        "Re-submitted deliverable '" + savedDeliverable.getFileName() + "' for " + milestone.getTitle(),
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
                        || (includeSubmitted && "APPROVED".equalsIgnoreCase(m.getStatus()))
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
            milestone.setStatus("APPROVED");
            milestoneRepository.save(milestone);

            String contractId = milestone.getContractId();
            if (contractId != null) {
                recalculateProjectProgress(contractId);
                contractRepository.findById(contractId).ifPresent(c -> {
                    projectService.logActivity(
                            "PRJ-" + contractId,
                            contractId,
                            "DELIVERABLE_APPROVED",
                            "Deliverable approved for " + milestone.getTitle() + "; payment is pending.",
                            c.getClientName()
                    );
                });
            }
        }

        return saved;
    }

    @Transactional
    public Milestone requestMilestoneChanges(String milestoneId, String reason) {
        Milestone milestone = getMilestoneById(milestoneId);
        milestone.setStatus("CHANGES_REQUESTED");
        milestoneRepository.save(milestone);

        String feedback = (reason != null && !reason.isBlank()) ? reason.trim() : "Revisions requested by client.";

        List<Deliverable> deliverables = deliverableRepository.findByMilestoneId(milestoneId);
        for (Deliverable d : deliverables) {
            d.setStatus("REJECTED");
            d.setFeedback(feedback);
            deliverableRepository.save(d);
        }

        String contractId = milestone.getContractId();
        if (contractId != null) {
            recalculateProjectProgress(contractId);

            String formattedProjId = contractId.startsWith("PRJ-") ? contractId : "PRJ-" + contractId;
            contractRepository.findById(contractId).ifPresent(c -> {
                Notification notif = new Notification(
                        "Revision Requested: " + milestone.getTitle(),
                        "Client requested changes for " + milestone.getTitle() + ": " + feedback,
                        "Revision Needed",
                        "review",
                        milestone.getAmount() != null ? "$" + String.format("%,.0f", milestone.getAmount()) : "$2,000",
                        "Deliverables",
                        "/project-details?id=" + formattedProjId,
                        "View Project Overview",
                        true,
                        "Just now",
                        "DELIVERABLE_REJECTED",
                        milestone.getId(),
                        "Client has requested revisions on milestone '" + milestone.getTitle() + "'. Feedback provided: \"" + feedback + "\". Please revise and re-upload your files."
                );
                notif.setRecipientName(c.getFreelancerName());
                notif.setSenderName(c.getClientName());
                notif.setRecipientRole("FREELANCER");
                setFreelancerRecipientEmail(notif, c);
                notificationRepository.save(notif);

                projectService.logActivity(
                        formattedProjId,
                        contractId,
                        "DELIVERABLE_REJECTED",
                        "Revision requested for " + milestone.getTitle() + ": " + feedback,
                        c.getClientName()
                );
            });
        }

        return milestone;
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
            requestMilestoneChanges(milestone.getId(), feedback);
        }

        return saved;
    }

    private void setClientRecipientEmail(Notification notification, Contract contract) {
        if (contract.getClientEmail() != null && !contract.getClientEmail().isBlank()) {
            notification.setRecipientEmail(contract.getClientEmail().trim().toLowerCase());
            return;
        }
        resolveUserEmail(contract.getClientName(), UserRole.CLIENT)
                .ifPresent(notification::setRecipientEmail);
    }

    private void setFreelancerRecipientEmail(Notification notification, Contract contract) {
        if (contract.getFreelancerEmail() != null && !contract.getFreelancerEmail().isBlank()) {
            notification.setRecipientEmail(contract.getFreelancerEmail().trim().toLowerCase());
            return;
        }
        resolveUserEmail(contract.getFreelancerName(), UserRole.FREELANCER)
                .ifPresent(notification::setRecipientEmail);
    }

    private Optional<String> resolveUserEmail(String identity, UserRole role) {
        if (identity == null || identity.isBlank()) {
            return Optional.empty();
        }
        String value = identity.trim();
        if (value.contains("@")) {
            return userRepository.findByEmailIgnoreCase(value)
                    .filter(user -> user.getRole() == role)
                    .map(User::getEmail);
        }
        List<User> matches = userRepository.findAll().stream()
                .filter(user -> user.getRole() == role)
                .filter(user -> value.equalsIgnoreCase(user.getFullName())
                        || (role == UserRole.CLIENT && value.equalsIgnoreCase(user.getCompany())))
                .toList();
        return matches.size() == 1 ? Optional.of(matches.get(0).getEmail()) : Optional.empty();
    }
}
