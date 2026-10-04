package com.freelance.backend.service;

import com.freelance.backend.dto.DeliverableRequest;
import com.freelance.backend.entity.Deliverable;
import com.freelance.backend.entity.Milestone;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.DeliverableRepository;
import com.freelance.backend.repository.MilestoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class MilestoneService {

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private DeliverableRepository deliverableRepository;

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

    public Deliverable addDeliverable(String milestoneId, DeliverableRequest request) {
        Milestone milestone = getMilestoneById(milestoneId);

        String deliverableId = "D-" + System.currentTimeMillis();
        String uploadDate = request.getUploadedAt() != null ? request.getUploadedAt() : LocalDateTime.now().toString().split("T")[0];

        Deliverable deliverable = new Deliverable(
                deliverableId,
                milestoneId,
                request.getFileName(),
                request.getFileSize() != null ? request.getFileSize() : "3.5 MB",
                request.getNotes(),
                uploadDate,
                "PENDING_REVIEW"
        );
        deliverable.setMilestone(milestone);

        Deliverable savedDeliverable = deliverableRepository.save(deliverable);
        
        // Also update milestone status to DELIVERED if it was funded
        if ("FUNDED".equalsIgnoreCase(milestone.getStatus())) {
            milestone.setStatus("DELIVERED");
            milestoneRepository.save(milestone);
        }

        return savedDeliverable;
    }

    public List<Deliverable> getDeliverablesForMilestone(String milestoneId) {
        return deliverableRepository.findByMilestoneId(milestoneId);
    }
}
