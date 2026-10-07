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
import com.freelance.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
public class DisputeService {

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private DisputeMessageRepository messageRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Dispute> getAllDisputes() {
        return disputeRepository.findAll();
    }

    public List<Dispute> getFreelancerDisputes(String freelancerName) {
        List<Dispute> disputes = getAllDisputes();
        if (freelancerName != null && !freelancerName.isBlank()) {
            String lower = freelancerName.trim().toLowerCase();
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
        return disputes;
    }

    public Dispute getDisputeById(String id) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute case not found: " + id));
        enrichDispute(dispute);
        return dispute;
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
        String parties = request.getParties() != null ? request.getParties() : (client + " vs. " + freelancer);

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        String todayFormatted = LocalDateTime.now().format(dtf);
        String filedDate = "Filed " + todayFormatted;

        String evidence = request.getEvidenceFile();
        if (evidence == null || evidence.isBlank()) {
            evidence = "contract-agreement.pdf,approved-screens-specs.png";
        }

        Dispute dispute = new Dispute(
                id,
                id,
                request.getProject() != null ? request.getProject() : "E-Commerce Redesign",
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
        dispute.setContractId(request.getContractId());
        dispute.setPriority(request.getPriority() != null ? request.getPriority() : "Medium");
        dispute.setLastUpdatedDate(todayFormatted);

        Dispute saved = disputeRepository.save(dispute);

        // Add initial system / user message to discussion thread
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm a");
        String currentTime = LocalDateTime.now().format(timeFmt);

        DisputeMessage initialMsg = new DisputeMessage(
                saved.getId(),
                freelancer,
                "FREELANCER",
                request.getDescription(),
                currentTime
        );
        messageRepository.save(initialMsg);

        // Automatically create a notification for the client
        Notification notifClient = new Notification(
                "New Dispute Filed: " + saved.getProject(),
                "Freelancer " + freelancer + " filed dispute " + saved.getId() + " (" + saved.getIssueType() + ")",
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
                "Freelancer " + freelancer + " filed dispute " + saved.getId() + " for project '" + saved.getProject() + "'. Issue: " + saved.getIssueType() + ". Description: " + request.getDescription()
        );
        notificationRepository.save(notifClient);

        enrichDispute(saved);
        return saved;
    }

    public DisputeMessage addMessage(String disputeId, AddDisputeMessageRequest request) {
        Dispute dispute = getDisputeById(disputeId);

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

        Notification notif = new Notification(
                "Dispute " + saved.getId() + " Status: " + saved.getStatus(),
                "Dispute regarding " + saved.getProject() + " has been updated to " + saved.getStatus() + ".",
                saved.getStatus(),
                "Resolved".equalsIgnoreCase(saved.getStatus()) ? "resolved" : "review",
                saved.getAmount() != null ? "$" + String.format("%,.0f", saved.getAmount()) : "$2,400",
                "Disputes",
                "/dispute-details?id=" + saved.getId(),
                "View Resolution Details",
                true,
                "Just now",
                "DISPUTE_STATUS_CHANGED",
                saved.getId(),
                "Dispute " + saved.getId() + " for project '" + saved.getProject() + "' status changed to " + saved.getStatus() + ". Resolution summary: " + (saved.getResolutionNote() != null ? saved.getResolutionNote() : "Concluded by mediator.")
        );
        notificationRepository.save(notif);

        enrichDispute(saved);
        return saved;
    }
}
