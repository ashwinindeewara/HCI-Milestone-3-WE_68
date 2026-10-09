package com.freelance.backend.service;

import com.freelance.backend.entity.*;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private ProjectActivityRepository activityRepository;

    @Autowired
    private FileAttachmentRepository fileAttachmentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private FreelancerProfileRepository profileRepository;

    public List<Project> getAllProjects() {
        return projectRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Project> getFreelancerProjects(String freelancerName) {
        if (freelancerName == null || freelancerName.isBlank()) {
            return List.of();
        }

        String clean = freelancerName.trim();
        if (clean.contains("@")) {
            return getFreelancerProjectsByEmail(clean);
        }

        return projectRepository.findByFreelancerNameIgnoreCase(clean);
    }

    public List<Project> getFreelancerProjectsByEmail(String email) {
        if (email == null || email.isBlank()) {
            return List.of();
        }

        return projectRepository.findByFreelancerEmailIgnoreCase(email.trim());
    }

    public Project getProjectById(String id) {
        return projectRepository.findById(id)
                .orElseGet(() -> projectRepository.findByContractId(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Project not found with id or contractId: " + id
                                )));
    }

    public List<Milestone> getProjectMilestones(String projectId) {
        Project project = getProjectById(projectId);
        return milestoneRepository.findByContractId(project.getContractId());
    }

    public List<ProjectActivity> getProjectActivities(String projectId) {
        return activityRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    public List<FileAttachment> getProjectFiles(String projectId) {
        Project project = getProjectById(projectId);
        List<FileAttachment> files =
                fileAttachmentRepository.findByRelatedEntityIdOrderByCreatedAtDesc(projectId);

        if (project.getContractId() != null
                && !project.getContractId().equals(projectId)) {
            List<FileAttachment> contractFiles =
                    fileAttachmentRepository.findByRelatedEntityIdOrderByCreatedAtDesc(
                            project.getContractId()
                    );

            for (FileAttachment file : contractFiles) {
                if (!files.contains(file)) {
                    files.add(file);
                }
            }
        }

        return files;
    }

    /**
     * Returns files attached directly to the milestone, project, or related contract.
     * The exact relatedEntityId used depends on how FileStorageService stored each upload.
     */
    public List<FileAttachment> getMilestoneDeliverables(
            String projectId,
            String milestoneId
    ) {
        Project project = getProjectById(projectId);
        findMilestoneForProject(project, milestoneId);

        List<FileAttachment> result = new ArrayList<>();
        addUniqueFiles(result, milestoneId);
        addUniqueFiles(result, project.getId());

        if (project.getContractId() != null) {
            addUniqueFiles(result, project.getContractId());
        }

        return result;
    }

    private void addUniqueFiles(List<FileAttachment> target, String relatedEntityId) {
        if (relatedEntityId == null || relatedEntityId.isBlank()) {
            return;
        }

        List<FileAttachment> found =
                fileAttachmentRepository.findByRelatedEntityIdOrderByCreatedAtDesc(
                        relatedEntityId
                );

        for (FileAttachment file : found) {
            if (!target.contains(file)) {
                target.add(file);
            }
        }
    }

    /**
     * Messages are currently stored in ProjectActivity because the supplied service
     * has no dedicated project-message entity/repository. The activity type contains
     * the milestone ID and sender role so messages can be retrieved per milestone.
     *
     * For a production chat feature, a dedicated ProjectMessage entity/repository
     * is preferable.
     */
    public List<Map<String, Object>> getMilestoneMessages(
            String projectId,
            String milestoneId
    ) {
        Project project = getProjectById(projectId);
        findMilestoneForProject(project, milestoneId);

        String typePrefix = messageTypePrefix(milestoneId);
        List<ProjectActivity> activities =
                activityRepository.findByProjectIdOrderByCreatedAtDesc(project.getId());

        List<Map<String, Object>> messages = new ArrayList<>();

        // The repository returns newest first; reverse iteration displays oldest first.
        for (int i = activities.size() - 1; i >= 0; i--) {
            ProjectActivity activity = activities.get(i);
            String type = activity.getType();

            if (type == null || !type.startsWith(typePrefix)) {
                continue;
            }

            String role = type.substring(typePrefix.length());
            Map<String, Object> message = new LinkedHashMap<>();
            message.put("id", activity.getId());
            message.put("milestoneId", milestoneId);
            message.put("content", activity.getDescription());
            message.put("senderName", activity.getPerformedBy());
            message.put("role", role);
            message.put("senderRole", role);
            message.put("createdAt", activity.getCreatedAt());
            messages.add(message);
        }

        return messages;
    }

    @Transactional
    public Map<String, Object> sendMilestoneMessage(
            String projectId,
            String milestoneId,
            Map<String, Object> payload
    ) {
        if (payload == null) {
            throw new IllegalArgumentException("A message body is required.");
        }

        Project project = getProjectById(projectId);
        findMilestoneForProject(project, milestoneId);

        Object rawContent = payload.get("content");
        String content = rawContent == null ? "" : rawContent.toString().trim();

        if (content.isBlank()) {
            throw new IllegalArgumentException("Message content cannot be empty.");
        }

        String role = valueOrDefault(payload.get("senderRole"), "CLIENT")
                .toUpperCase(Locale.ROOT);
        if (!List.of("CLIENT", "FREELANCER", "ADMIN", "PAYMENT_STAFF").contains(role)) {
            throw new IllegalArgumentException("Unsupported senderRole: " + role);
        }

        String senderName = valueOrDefault(
                payload.get("senderName"),
                role
        );

        ProjectActivity activity = new ProjectActivity(
                project.getId(),
                project.getContractId(),
                messageTypePrefix(milestoneId) + role,
                content,
                senderName
        );

        ProjectActivity saved = activityRepository.save(activity);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", saved.getId());
        response.put("milestoneId", milestoneId);
        response.put("content", saved.getDescription());
        response.put("senderName", saved.getPerformedBy());
        response.put("role", role);
        response.put("senderRole", role);
        response.put("createdAt", saved.getCreatedAt());
        return response;
    }

    @Transactional
    public Milestone updateMilestoneStatus(
            String projectId,
            String milestoneId,
            String status,
            Map<String, Object> payload
    ) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("The status query parameter is required.");
        }

        Project project = getProjectById(projectId);
        Milestone milestone = findMilestoneForProject(project, milestoneId);

        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
        List<String> allowedStatuses = List.of(
                "PENDING",
                "FUNDED",
                "SUBMITTED",
                "PENDING_REVIEW",
                "DELIVERED",
                "APPROVED",
                "CHANGES_REQUESTED",
                "RELEASED",
                "COMPLETED",
                "REJECTED"
        );

        if (!allowedStatuses.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Unsupported milestone status: " + status);
        }

        milestone.setStatus(normalizedStatus);
        Milestone saved = milestoneRepository.save(milestone);

        String reason = payload == null || payload.get("reason") == null
                ? ""
                : payload.get("reason").toString().trim();

        String description = "Milestone '" + saved.getTitle()
                + "' status changed to " + normalizedStatus
                + (reason.isBlank() ? "" : ". Reason: " + reason);

        logActivity(
                project.getId(),
                project.getContractId(),
                "MILESTONE_STATUS_UPDATED",
                description,
                "CLIENT"
        );

        return saved;
    }

    private Milestone findMilestoneForProject(Project project, String milestoneId) {
        if (milestoneId == null || milestoneId.isBlank()) {
            throw new IllegalArgumentException("Milestone ID is required.");
        }

        String contractId = project.getContractId();
        if (contractId == null || contractId.isBlank()) {
            throw new ResourceNotFoundException(
                    "Project has no linked contract: " + project.getId()
            );
        }

        return milestoneRepository.findByContractId(contractId)
                .stream()
                .filter(m -> milestoneId.equals(String.valueOf(m.getId())))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Milestone " + milestoneId
                                + " was not found under project " + project.getId()
                ));
    }

    private String messageTypePrefix(String milestoneId) {
        return "MILESTONE_MESSAGE|" + milestoneId + "|";
    }

    private String valueOrDefault(Object value, String fallback) {
        if (value == null || value.toString().isBlank()) {
            return fallback;
        }
        return value.toString().trim();
    }

    @Transactional
    public Project createOrActivateProjectFromContract(Contract contract) {
        return projectRepository.findByContractId(contract.getId())
                .map(existing -> {
                    existing.setStatus("ACTIVE");
                    existing.setStatusBadge("On Track");

                    if (existing.getFreelancerEmail() == null
                            || existing.getFreelancerEmail().isBlank()) {
                        existing.setFreelancerEmail(contract.getFreelancerEmail());
                    }

                    existing.setUpdatedAt(LocalDateTime.now());
                    Project saved = projectRepository.save(existing);

                    logActivity(
                            saved.getId(),
                            contract.getId(),
                            "PROJECT_ACTIVATED",
                            "Project status set to Active after contract signature",
                            contract.getFreelancerName()
                    );

                    return saved;
                })
                .orElseGet(() -> {
                    String projectId = "PRJ-" + contract.getId();
                    String timeline = contract.getTimeline() != null
                            ? contract.getTimeline()
                            : (contract.getStartDate() + " - " + contract.getEndDate());
                    String dueDate = contract.getDueDate() != null
                            ? contract.getDueDate()
                            : contract.getEndDate();
                    Double escrow = contract.getInEscrowAmount() != null
                            ? contract.getInEscrowAmount()
                            : 0.0;

                    Project project = new Project(
                            projectId,
                            contract.getId(),
                            contract.getTitle(),
                            contract.getClientName(),
                            contract.getFreelancerName(),
                            contract.getDescription(),
                            "ACTIVE",
                            0,
                            contract.getTotalBudget(),
                            escrow,
                            timeline,
                            dueDate,
                            "On Track"
                    );

                    project.setStartDate(contract.getStartDate());
                    project.setEndDate(contract.getEndDate());
                    project.setFreelancerEmail(contract.getFreelancerEmail());

                    Project saved = projectRepository.save(project);

                    logActivity(
                            saved.getId(),
                            contract.getId(),
                            "CONTRACT_ACCEPTED",
                            "Contract signed and project activated by "
                                    + contract.getFreelancerName(),
                            contract.getFreelancerName()
                    );

                    return saved;
                });
    }

    public ProjectActivity logActivity(
            String projectId,
            String contractId,
            String type,
            String description,
            String performedBy
    ) {
        ProjectActivity activity = new ProjectActivity(
                projectId,
                contractId,
                type,
                description,
                performedBy
        );
        return activityRepository.save(activity);
    }
}
