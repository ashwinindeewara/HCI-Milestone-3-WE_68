package com.freelance.backend.service;

import com.freelance.backend.entity.*;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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
        String cleanEmail = email.trim();
        return projectRepository.findByFreelancerEmailIgnoreCase(cleanEmail);
    }

    public List<Project> getClientProjects(String clientName) {
        if (clientName == null || clientName.isBlank()) {
            return List.of();
        }
        return projectRepository.findByClientNameIgnoreCase(clientName.trim());
    }

    public Project getProjectById(String id) {
        return projectRepository.findById(id)
                .orElseGet(() -> projectRepository.findByContractId(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Project not found with id or contractId: " + id)));
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
        List<FileAttachment> files = fileAttachmentRepository.findByRelatedEntityIdOrderByCreatedAtDesc(projectId);
        if (project.getContractId() != null && !project.getContractId().equals(projectId)) {
            List<FileAttachment> contractFiles = fileAttachmentRepository.findByRelatedEntityIdOrderByCreatedAtDesc(project.getContractId());
            for (FileAttachment cf : contractFiles) {
                if (!files.contains(cf)) {
                    files.add(cf);
                }
            }
        }
        return files;
    }

    @Transactional
    public Project createOrActivateProjectFromContract(Contract contract) {
        return projectRepository.findByContractId(contract.getId())
                .map(existing -> {
                    existing.setStatus("ACTIVE");
                    existing.setStatusBadge("On Track");
                    if (existing.getFreelancerEmail() == null || existing.getFreelancerEmail().isBlank()) {
                        existing.setFreelancerEmail(contract.getFreelancerEmail());
                    }
                    existing.setUpdatedAt(LocalDateTime.now());
                    Project saved = projectRepository.save(existing);
                    logActivity(saved.getId(), contract.getId(), "PROJECT_ACTIVATED", "Project status set to Active after contract signature", contract.getFreelancerName());
                    return saved;
                })
                .orElseGet(() -> {
                    String projectId = "PRJ-" + contract.getId();
                    String timeline = contract.getTimeline() != null ? contract.getTimeline() : (contract.getStartDate() + " - " + contract.getEndDate());
                    String dueDate = contract.getDueDate() != null ? contract.getDueDate() : contract.getEndDate();
                    Double escrow = contract.getInEscrowAmount() != null ? contract.getInEscrowAmount() : 0.0;
                    Integer completion = 0;

                    Project project = new Project(
                            projectId,
                            contract.getId(),
                            contract.getTitle(),
                            contract.getClientName(),
                            contract.getFreelancerName(),
                            contract.getDescription(),
                            "ACTIVE",
                            completion,
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

                    // Log initial activity
                    logActivity(saved.getId(), contract.getId(), "CONTRACT_ACCEPTED", "Contract signed and project activated by " + contract.getFreelancerName(), contract.getFreelancerName());

                    return saved;
                });
    }

    public ProjectActivity logActivity(String projectId, String contractId, String type, String description, String performedBy) {
        ProjectActivity activity = new ProjectActivity(projectId, contractId, type, description, performedBy);
        return activityRepository.save(activity);
    }
}
