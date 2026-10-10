package com.freelance.backend.service;

import com.freelance.backend.dto.AddDisputeMessageRequest;
import com.freelance.backend.dto.CreateDisputeRequest;
import com.freelance.backend.dto.ResolveDisputeRequest;
import com.freelance.backend.entity.Dispute;
import com.freelance.backend.entity.DisputeMessage;
import com.freelance.backend.entity.Notification;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.DisputeMessageRepository;
import com.freelance.backend.repository.DisputeRepository;
import com.freelance.backend.repository.ContractRepository;
import com.freelance.backend.repository.FreelancerProfileRepository;
import com.freelance.backend.repository.NotificationRepository;
import com.freelance.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
public class DisputeService {

    private final DisputeRepository disputeRepository;

    public DisputeService(DisputeRepository disputeRepository) {
        this.disputeRepository = disputeRepository;
    }

    @Autowired
    private DisputeMessageRepository messageRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private FreelancerProfileRepository profileRepository;

    @Autowired(required = false)
    private ContractRepository contractRepository;

    public List<Dispute> getAllDisputes() {
        return disputeRepository.findAll();
    }

    public List<Dispute> getFreelancerDisputes(String freelancerName) {
        if (freelancerName == null || freelancerName.isBlank()) {
            return List.of();
        }
        String clean = freelancerName.trim();
        if (clean.contains("@")) {
            return getFreelancerDisputesByEmail(clean);
        }
        List<Dispute> disputes = getAllDisputes();
        String lower = clean.toLowerCase();
        boolean isChathuni = lower.contains("chathuni");
        return disputes.stream()
                .filter(d -> {
                    String fName = d.getFreelancerName() != null ? d.getFreelancerName().trim().toLowerCase() : "";
                    String parties = d.getParties() != null ? d.getParties().trim().toLowerCase() : "";
                    if (isChathuni) {
                        return fName.contains("chathuni") || parties.contains("chathuni");
                    }
                    boolean matchFreelancer = !fName.isEmpty() && (fName.contains(lower) || lower.contains(fName));
                    boolean matchParties = !parties.isEmpty() && parties.contains(lower);
                    return matchFreelancer || matchParties;
                })
                .toList();
    }

    public List<Dispute> getFreelancerDisputesByEmail(String email) {
        if (email == null || email.isBlank()) {
            return List.of();
        }
        String cleanEmail = email.trim();
        List<Dispute> emailOwned = disputeRepository.findAll().stream()
            .filter(d -> d.getFreelancerEmail() != null && d.getFreelancerEmail().equalsIgnoreCase(cleanEmail))
            .toList();
        if (!emailOwned.isEmpty()) return emailOwned;
        if (profileRepository != null) {
            var profileOpt = profileRepository.findByEmailIgnoreCase(cleanEmail);
            if (profileOpt.isPresent() && profileOpt.get().getFullName() != null && !profileOpt.get().getFullName().isBlank()) {
                return getFreelancerDisputes(profileOpt.get().getFullName().trim());
            }
        }
        if (userRepository != null) {
            var userOpt = userRepository.findByEmailIgnoreCase(cleanEmail);
            if (userOpt.isPresent() && userOpt.get().getFullName() != null && !userOpt.get().getFullName().isBlank()) {
                return getFreelancerDisputes(userOpt.get().getFullName().trim());
            }
        }
        List<Dispute> disputes = getAllDisputes();
        String lower = cleanEmail.toLowerCase();
        return disputes.stream()
                .filter(d -> {
                    String fName = d.getFreelancerName() != null ? d.getFreelancerName().trim().toLowerCase() : "";
                    String parties = d.getParties() != null ? d.getParties().trim().toLowerCase() : "";
                    return (!fName.isEmpty() && (fName.contains(lower) || lower.contains(fName))) ||
                           (!parties.isEmpty() && parties.contains(lower));
                })
                .toList();
    }

    public List<Dispute> getClientDisputes(String clientName, String email) {
        String cleanName = clientName == null ? "" : clientName.trim().toLowerCase();
        String cleanEmail = email == null ? "" : email.trim().toLowerCase();
        if (cleanName.isEmpty() && cleanEmail.isEmpty()) return List.of();
        return disputeRepository.findAll().stream()
                .filter(d -> (d.getClientEmail() != null && d.getClientEmail().equalsIgnoreCase(cleanEmail))
                        || (d.getClientName() != null && d.getClientName().trim().equalsIgnoreCase(cleanName)))
                .toList();
    }

    public Dispute getDisputeById(String id) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute case not found: " + id));
        enrichDispute(dispute);
        return dispute;
    }

    public Dispute getDisputeForViewer(String id, String viewerName, String viewerEmail, String role) {
        Dispute dispute = getDisputeById(id);
        if (isAuthorizedViewer(dispute, viewerName, viewerEmail, role)) return dispute;
        throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "You are not a party to this dispute");
    }

    private boolean isAuthorizedViewer(Dispute dispute, String viewerName, String viewerEmail, String role) {
        if ("ADMIN".equalsIgnoreCase(role)) return true;
        String email = viewerEmail == null ? "" : viewerEmail.trim();
        String name = viewerName == null ? "" : viewerName.trim();
        boolean freelancer = !email.isBlank() && dispute.getFreelancerEmail() != null
                && dispute.getFreelancerEmail().equalsIgnoreCase(email);
        boolean client = !email.isBlank() && dispute.getClientEmail() != null
                && dispute.getClientEmail().equalsIgnoreCase(email);
        freelancer = freelancer || (!name.isBlank() && dispute.getFreelancerName() != null
                && dispute.getFreelancerName().equalsIgnoreCase(name));
        client = client || (!name.isBlank() && dispute.getClientName() != null
                && dispute.getClientName().equalsIgnoreCase(name));
        return freelancer || client;
    }

    private void enrichDispute(Dispute dispute) {
        List<DisputeMessage> msgs = messageRepository.findByDisputeIdOrderByIdAsc(dispute.getId());
        dispute.setMessages(msgs);
        dispute.setEvidenceFilesList(dispute.getEvidenceFilesList());
    }

    public Dispute createDispute(CreateDisputeRequest request) {
        String id = "DSP-" + (410 + new Random().nextInt(90));
        Double amount = request.getAmount() != null ? request.getAmount() : 2400.0;
        String freelancer = (request.getFreelancerName() != null && !request.getFreelancerName().isBlank())
                ? request.getFreelancerName() : "Freelancer";
        String client = (request.getClientName() != null && !request.getClientName().isBlank())
                ? request.getClientName() : "TechVentures Inc.";
        String freelancerEmail = request.getFreelancerEmail();
        String clientEmail = request.getClientEmail();
        String project = request.getProject() != null ? request.getProject() : "E-Commerce Redesign";
        String reporterRole = "CLIENT".equalsIgnoreCase(request.getReporterRole()) ? "CLIENT" : "FREELANCER";
        if (contractRepository != null && request.getContractId() != null && !request.getContractId().isBlank()) {
            var projectContract = contractRepository.findById(request.getContractId()).orElse(null);
            if (projectContract != null) {
                project = projectContract.getTitle();
                client = projectContract.getClientName();
                clientEmail = projectContract.getClientEmail();
                freelancer = projectContract.getFreelancerName();
                freelancerEmail = projectContract.getFreelancerEmail();
            }
        }
        String parties = request.getParties() != null ? request.getParties() : (client + " vs. " + freelancer);

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        String todayFormatted = LocalDateTime.now().format(dtf);
        String filedDate = "Filed " + todayFormatted;

        String evidence = request.getEvidenceFile();
        if (evidence == null || evidence.isBlank()) {
            evidence = "";
        }

        Dispute dispute = new Dispute(
                id,
                id,
                project,
                parties,
                request.getIssueType() != null ? request.getIssueType() : "Payment Delay",
                request.getDescription(),
                evidence,
                amount,
                "Under Review",
                "review",
                filedDate,
                2
        );

        dispute.setClientName(client);
        dispute.setFreelancerName(freelancer);
        dispute.setFreelancerEmail(freelancerEmail);
        dispute.setClientEmail(clientEmail);
        dispute.setContractId(request.getContractId());
        dispute.setPriority(request.getPriority() != null ? request.getPriority() : "Medium");
        dispute.setLastUpdatedDate(todayFormatted);

        Dispute saved = disputeRepository.save(dispute);

        // Add initial system / user message to discussion thread
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm a");
        String currentTime = LocalDateTime.now().format(timeFmt);

        DisputeMessage initialMsg = new DisputeMessage(
                saved.getId(),
                "CLIENT".equals(reporterRole) ? client : freelancer,
                reporterRole,
                request.getDescription(),
                currentTime
        );
        messageRepository.save(initialMsg);

        String recipientRole = "CLIENT".equals(reporterRole) ? "FREELANCER" : "CLIENT";
        String reporterName = "CLIENT".equals(reporterRole) ? client : freelancer;
        Notification disputeNotification = new Notification(
                "New Dispute Filed: " + saved.getProject(),
                reporterName + " filed dispute " + saved.getId() + " (" + saved.getIssueType() + ")",
                "Open Dispute",
                "open",
                "$" + String.format("%,.0f", amount),
                "Disputes",
                "/dispute-details?id=" + saved.getId(),
                "View Dispute & Discussion",
                true,
                "Just now",
                "DISPUTE_CREATED",
                saved.getId(),
                reporterName + " filed dispute " + saved.getId() + " for project '" + saved.getProject()
                        + "'. Issue: " + saved.getIssueType() + ". Description: " + request.getDescription()
        );
        setDisputeRecipient(disputeNotification, saved, recipientRole);
        disputeNotification.setSenderName(reporterName);
        notificationRepository.save(disputeNotification);

        enrichDispute(saved);
        return saved;
    }

    @Transactional
    public Dispute updateDispute(String id, CreateDisputeRequest request) {
        Dispute dispute = getDisputeById(id);
        if (request.getProject() != null && !request.getProject().isBlank()) {
            dispute.setProject(request.getProject().trim());
        }
        if (request.getIssueType() != null && !request.getIssueType().isBlank()) {
            dispute.setIssueType(request.getIssueType().trim());
        }
        if (request.getDescription() != null) {
            dispute.setDescription(request.getDescription().trim());
        }
        if (request.getEvidenceFile() != null) {
            dispute.setEvidenceFile(request.getEvidenceFile());
        }
        if (request.getAmount() != null) {
            dispute.setAmount(request.getAmount());
        }
        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            dispute.setPriority(request.getPriority().trim());
        }
        dispute.setLastUpdatedDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")));
        return disputeRepository.save(dispute);
    }

    @Transactional
    public void deleteDispute(String id) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute case not found: " + id));
        messageRepository.deleteByDisputeId(id);
        disputeRepository.delete(dispute);
    }

    public DisputeMessage addMessage(String disputeId, AddDisputeMessageRequest request) {
        Dispute dispute = getDisputeForViewer(
                disputeId, request.getSenderName(), null, request.getSenderRole());

        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm a");
        String currentTime = LocalDateTime.now().format(timeFmt);

        String senderName = request.getSenderName() != null && !request.getSenderName().isBlank()
                ? request.getSenderName() : "Freelancer";
        String senderRole = request.getSenderRole() != null && !request.getSenderRole().isBlank()
                ? request.getSenderRole() : "FREELANCER";

        DisputeMessage msg = new DisputeMessage(
                dispute.getId(),
                senderName,
                senderRole,
                request.getMessage(),
                currentTime
        );

        DisputeMessage savedMsg = messageRepository.save(msg);

        // Update dispute last updated date
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        dispute.setLastUpdatedDate(LocalDateTime.now().format(dtf));
        disputeRepository.save(dispute);

        // Notify the counterparty
        boolean isFromFreelancer = "FREELANCER".equalsIgnoreCase(senderRole);
        String notifTitle = isFromFreelancer
                ? "New Dispute Message from " + senderName
                : "New Response in Dispute " + dispute.getId();

        Notification notif = new Notification(
                notifTitle,
                senderName + ": " + (request.getMessage().length() > 60 ? request.getMessage().substring(0, 60) + "..." : request.getMessage()),
                "Dispute Message",
                "review",
                dispute.getAmount() != null ? "$" + String.format("%,.0f", dispute.getAmount()) : "$2,400",
                "Disputes",
                "/dispute-details?id=" + dispute.getId(),
                "View Conversation",
                true,
                "Just now",
                "DISPUTE_MESSAGE",
                dispute.getId(),
                senderName + " posted a new message in dispute " + dispute.getId() + ": \"" + request.getMessage() + "\""
        );
        String recipientRole = isFromFreelancer ? "CLIENT" : "FREELANCER";
        setDisputeRecipient(notif, dispute, recipientRole);
        notificationRepository.save(notif);

        return savedMsg;
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

        if ("Resolved".equalsIgnoreCase(dispute.getStatus())) {
            dispute.setTimelineStep(3);
        } else if ("Under Review".equalsIgnoreCase(dispute.getStatus())) {
            dispute.setTimelineStep(2);
        } else {
            dispute.setTimelineStep(1);
        }

        if (request.getResolutionNote() != null) {
            dispute.setResolutionNote(request.getResolutionNote());
        }

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        dispute.setLastUpdatedDate(LocalDateTime.now().format(dtf));

        Dispute saved = disputeRepository.save(dispute);

        notificationRepository.saveAll(List.of(
                createDisputeStatusNotification(saved, "CLIENT"),
                createDisputeStatusNotification(saved, "FREELANCER")
        ));

        enrichDispute(saved);
        return saved;
    }

    private Notification createDisputeStatusNotification(Dispute dispute, String recipientRole) {
        Notification notification = new Notification(
                "Dispute " + dispute.getId() + " Status: " + dispute.getStatus(),
                "Dispute regarding " + dispute.getProject() + " has been updated to " + dispute.getStatus() + ".",
                dispute.getStatus(),
                "Resolved".equalsIgnoreCase(dispute.getStatus()) ? "resolved" : "review",
                dispute.getAmount() != null ? "$" + String.format("%,.0f", dispute.getAmount()) : "$2,400",
                "Disputes",
                "/dispute-details?id=" + dispute.getId(),
                "View Resolution Details",
                true,
                "Just now",
                "DISPUTE_STATUS_CHANGED",
                dispute.getId(),
                "Dispute " + dispute.getId() + " for project '" + dispute.getProject() + "' status changed to " + dispute.getStatus() + ". Resolution summary: " + (dispute.getResolutionNote() != null ? dispute.getResolutionNote() : "Concluded by mediator.")
        );
        setDisputeRecipient(notification, dispute, recipientRole);
        return notification;
    }

    private void setDisputeRecipient(Notification notification, Dispute dispute, String recipientRole) {
        boolean isClient = "CLIENT".equals(recipientRole);
        String recipientName = isClient ? dispute.getClientName() : dispute.getFreelancerName();
        String recipientEmail = isClient ? dispute.getClientEmail() : dispute.getFreelancerEmail();

        notification.setRecipientRole(recipientRole);
        notification.setRecipientName(recipientName);
        if (recipientEmail != null && !recipientEmail.isBlank()) {
            notification.setRecipientEmail(recipientEmail.trim());
        } else if (userRepository != null && recipientName != null && !recipientName.isBlank()) {
            com.freelance.backend.entity.UserRole role = isClient
                    ? com.freelance.backend.entity.UserRole.CLIENT
                    : com.freelance.backend.entity.UserRole.FREELANCER;
            userRepository.findAllByFullNameIgnoreCase(recipientName.trim()).stream()
                    .filter(user -> user.getRole() == role)
                    .findFirst()
                    .ifPresent(user -> notification.setRecipientEmail(user.getEmail()));
        }
    }
}
