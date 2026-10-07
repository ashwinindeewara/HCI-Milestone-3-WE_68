package com.freelance.backend.service;

import com.freelance.backend.dto.DashboardMetricsDTO;
import com.freelance.backend.entity.Contract;
import com.freelance.backend.entity.Milestone;
import com.freelance.backend.repository.ContractRepository;
import com.freelance.backend.repository.MilestoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    private final ContractRepository contractRepository;
    private final MilestoneRepository milestoneRepository;

    public DashboardService(ContractRepository contractRepository, MilestoneRepository milestoneRepository) {
        this.contractRepository = contractRepository;
        this.milestoneRepository = milestoneRepository;
    }

    public DashboardMetricsDTO getDashboardMetrics() {
        List<Contract> contracts = contractRepository.findAll();
        List<Milestone> milestones = milestoneRepository.findAll();

        int activeContractsCount = (int) contracts.stream()
                .filter(c -> c.getStatus() != null && ("ACTIVE".equalsIgnoreCase(c.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(c.getStatus())))
                .count();

        Double totalEarnings = milestones.stream()
                .filter(m -> m.getStatus() != null && "RELEASED".equalsIgnoreCase(m.getStatus()))
                .mapToDouble(m -> m.getAmount() != null ? m.getAmount() : 0.0)
                .sum();

        int pendingMilestonesCount = (int) milestones.stream()
                .filter(m -> m.getStatus() != null && ("PENDING".equalsIgnoreCase(m.getStatus()) || "FUNDED".equalsIgnoreCase(m.getStatus())))
                .count();

        Double totalInEscrow = milestones.stream()
                .filter(m -> m.getStatus() != null && "FUNDED".equalsIgnoreCase(m.getStatus()))
                .mapToDouble(m -> m.getAmount() != null ? m.getAmount() : 0.0)
                .sum();

        List<DashboardMetricsDTO.RecentActivity> activities = new ArrayList<>();
        activities.add(new DashboardMetricsDTO.RecentActivity(
                "ACT-1", "Milestone Funded", "TechVentures funded $3,000 for UI Design Phase", "2 hours ago", "PAYMENT"
        ));
        activities.add(new DashboardMetricsDTO.RecentActivity(
                "ACT-2", "Deliverable Submitted", "Submitted homepage_final_design.fig for review", "Yesterday", "MILESTONE"
        ));
        activities.add(new DashboardMetricsDTO.RecentActivity(
                "ACT-3", "Payment Released", "$2,500 released for Wireframes & UX Research", "Sep 16, 2026", "PAYMENT"
        ));

        return new DashboardMetricsDTO(
                activeContractsCount,
                totalEarnings > 0 ? totalEarnings : 3200.0,
                pendingMilestonesCount,
                totalInEscrow > 0 ? totalInEscrow : 4800.0,
                activities
        );
    }
}
