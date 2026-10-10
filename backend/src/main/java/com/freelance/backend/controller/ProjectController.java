package com.freelance.backend.controller;

import com.freelance.backend.entity.FileAttachment;
import com.freelance.backend.entity.Milestone;
import com.freelance.backend.entity.Project;
import com.freelance.backend.entity.ProjectActivity;
import com.freelance.backend.service.FileStorageService;
import com.freelance.backend.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = {
                "http://localhost:8081",
                "http://127.0.0.1:8081"
}, allowedHeaders = "*", methods = {
                RequestMethod.GET,
                RequestMethod.POST,
                RequestMethod.PUT,
                RequestMethod.PATCH,
                RequestMethod.DELETE,
                RequestMethod.OPTIONS
})
public class ProjectController {

        @Autowired
        private ProjectService projectService;

        @Autowired
        private FileStorageService fileStorageService;

        @GetMapping("/api/projects")
        public ResponseEntity<List<Project>> getAllProjects(
                        @RequestParam(required = false) String freelancerName,
                        @RequestParam(required = false) String email) {
                if (email != null && !email.isBlank()) {
                        return ResponseEntity.ok(projectService.getFreelancerProjectsByEmail(email));
                }

                if (freelancerName != null && !freelancerName.isBlank()) {
                        return ResponseEntity.ok(projectService.getFreelancerProjects(freelancerName));
                }
                return ResponseEntity.ok(List.of());
        }

        @GetMapping("/api/freelancer/projects")
        public ResponseEntity<List<Project>> getFreelancerProjects(
                        @RequestParam(required = false) String freelancerName,
                        @RequestParam(required = false) String email) {
                if (email != null && !email.isBlank()) {
                        return ResponseEntity.ok(projectService.getFreelancerProjectsByEmail(email));
                }

                if (freelancerName != null && !freelancerName.isBlank()) {
                        return ResponseEntity.ok(projectService.getFreelancerProjects(freelancerName));
                }

                return ResponseEntity.ok(List.of());
        }

        @GetMapping("/api/client/projects")
        public ResponseEntity<List<Project>> getClientProjects(@RequestParam String clientName) {
                return ResponseEntity.ok(projectService.getClientProjects(clientName));
        }

        @GetMapping("/api/projects/{id}")
        public ResponseEntity<Project> getProjectById(@PathVariable String id) {
                return ResponseEntity.ok(projectService.getProjectById(id));
        }

        @GetMapping("/api/projects/{id}/milestones")
        public ResponseEntity<List<Milestone>> getProjectMilestones(@PathVariable String id) {
                return ResponseEntity.ok(projectService.getProjectMilestones(id));
        }

        @GetMapping("/api/projects/{id}/activities")
        public ResponseEntity<List<ProjectActivity>> getProjectActivities(@PathVariable String id) {
                return ResponseEntity.ok(projectService.getProjectActivities(id));
        }

        @GetMapping("/api/projects/{id}/files")
        public ResponseEntity<List<FileAttachment>> getProjectFiles(@PathVariable String id) {
                return ResponseEntity.ok(projectService.getProjectFiles(id));
        }

        @PostMapping("/api/projects/{id}/files")
        public ResponseEntity<FileAttachment> uploadProjectFile(
                        @PathVariable String id,
                        @RequestParam("file") MultipartFile file,
                        @RequestParam(required = false, defaultValue = "Freelancer") String uploadedBy,
                        @RequestParam(required = false) String uploadedByEmail) {

                FileAttachment attachment = fileStorageService.storeFile(file, "PROJECT", id, uploadedBy,
                                uploadedByEmail);
                projectService.logActivity(id, id, "FILE_UPLOADED",
                                "Uploaded file: " + attachment.getOriginalFileName(), uploadedBy);
                return ResponseEntity.ok(attachment);
        }

        // Get submitted deliverables for one milestone.
        @GetMapping("/api/projects/{projectId}/milestones/{milestoneId}/deliverables")
        public ResponseEntity<?> getMilestoneDeliverables(
                        @PathVariable String projectId,
                        @PathVariable String milestoneId) {
                return ResponseEntity.ok(projectService.getMilestoneDeliverables(projectId, milestoneId));
        }

        // Get conversation messages for one milestone.
        @GetMapping("/api/projects/{projectId}/milestones/{milestoneId}/messages")
        public ResponseEntity<?> getMilestoneMessages(
                        @PathVariable String projectId,
                        @PathVariable String milestoneId) {
                return ResponseEntity.ok(projectService.getMilestoneMessages(projectId, milestoneId));
        }

        // Save a message in the milestone conversation.
        @PostMapping("/api/projects/{projectId}/milestones/{milestoneId}/messages")
        public ResponseEntity<?> sendMilestoneMessage(
                        @PathVariable String projectId,
                        @PathVariable String milestoneId,
                        @RequestBody Map<String, Object> payload) {
                return ResponseEntity.ok(
                                projectService.sendMilestoneMessage(projectId, milestoneId, payload));
        }

        // Approve a milestone or request changes.
        @PatchMapping("/api/projects/{projectId}/milestones/{milestoneId}/status")
        public ResponseEntity<?> updateMilestoneStatus(
                        @PathVariable String projectId,
                        @PathVariable String milestoneId,
                        @RequestParam String status,
                        @RequestBody(required = false) Map<String, Object> payload) {
                // Temporary diagnostic log: confirm that Spring registered and entered this
                return ResponseEntity.ok(projectService.updateMilestoneStatus(projectId, milestoneId, status,
                                payload == null ? Map.of() : payload));
        }
}
