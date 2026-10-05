package com.freelance.backend.config;

import com.freelance.backend.entity.*;
import com.freelance.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private DeliverableRepository deliverableRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private ReconciliationRepository reconciliationRepository;

    @Autowired
    private SecurityLogRepository securityLogRepository;

    private String hashPassword(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return rawPassword;
        }
    }

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedContractsAndMilestones();
        seedTransactions();
        seedDisputes();
        seedReconciliationRecords();
        seedSecurityLogs();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            userRepository.save(new User("Chathuni Imalsha", "chathuniimalsha.com", hashPassword("Password123!"), UserRole.FREELANCER, "Active"));
            userRepository.save(new User("Ruwan Sadeepa", "ruwansadeepa67@gmail.com", hashPassword("Password123!"), UserRole.CLIENT, "Active"));
            userRepository.save(new User("Amaya Perera", "amayaperera2003@gmail.com", hashPassword("Password123!"), UserRole.FREELANCER, "Suspended"));
            userRepository.save(new User("Akila Deshan", "akiladesh99@gmail.com", hashPassword("Password123!"), UserRole.CLIENT, "Active"));
            userRepository.save(new User("System Admin", "admin@freelance.com", hashPassword("Admin123!"), UserRole.ADMIN, "Active"));
            userRepository.save(new User("Payment Staff", "staff@freelance.com", hashPassword("Staff123!"), UserRole.PAYMENT_STAFF, "Active"));
        }
    }

    private void seedContractsAndMilestones() {
        if (contractRepository.count() == 0) {
            // Contract 1
            Contract c1 = new Contract(
                    "C-101",
                    "E-Commerce Mobile App Redesign",
                    "TechVentures Inc.",
                    "Chathuni Imalsha",
                    8500.0,
                    "IN_PROGRESS",
                    "2026-09-01",
                    "2026-11-30"
            );
            contractRepository.save(c1);

            Milestone m1 = new Milestone("M-1", "C-101", "1. Wireframes & UX Research", "Complete user flow diagrams and low-fidelity prototypes.", 2500.0, "2026-09-15", "RELEASED");
            m1.setContract(c1);
            milestoneRepository.save(m1);

            Deliverable d1 = new Deliverable("D-1", "M-1", "ux_research_v1.pdf", "4.2 MB", "Initial user interviews and wireframes attached.", "2026-09-14", "APPROVED");
            d1.setMilestone(m1);
            deliverableRepository.save(d1);

            Milestone m2 = new Milestone("M-2", "C-101", "2. UI Design Phase & Design System", "High-fidelity Figma screens and component library.", 3000.0, "2026-10-15", "FUNDED");
            m2.setContract(c1);
            milestoneRepository.save(m2);

            Deliverable d2 = new Deliverable("D-2", "M-2", "homepage_final_design.fig", "12.8 MB", "High fidelity interface prototype ready for review.", "2026-10-01", "PENDING_REVIEW");
            d2.setMilestone(m2);
            deliverableRepository.save(d2);

            Milestone m3 = new Milestone("M-3", "C-101", "3. React Native Mobile App Frontend", "Implement Expo mobile app screens and backend integration.", 3000.0, "2026-11-30", "PENDING");
            m3.setContract(c1);
            milestoneRepository.save(m3);

            // Contract 2
            Contract c2 = new Contract(
                    "C-102",
                    "Marketing Brand Strategy & Assets",
                    "Apex Solutions Ltd.",
                    "Chathuni Imalsha",
                    4200.0,
                    "ACTIVE",
                    "2026-09-20",
                    "2026-10-25"
            );
            contractRepository.save(c2);

            Milestone m4 = new Milestone("M-4", "C-102", "1. Brand Guidelines & Logo Assets", "Vector logo files, typography, and brand identity manual.", 1800.0, "2026-10-05", "FUNDED");
            m4.setContract(c2);
            milestoneRepository.save(m4);

            Milestone m5 = new Milestone("M-5", "C-102", "2. Social Media Marketing Kit", "Templates and promo banners for launch campaign.", 2400.0, "2026-10-25", "PENDING");
            m5.setContract(c2);
            milestoneRepository.save(m5);
        }
    }

    private void seedTransactions() {
        List<Transaction> initialTxns = java.util.Arrays.asList(
            new Transaction("TXN-2847", "FTX-90182", "C-101", "M-1", "Wireframes & UX Research", 2500.0, "RELEASE", "COMPLETED", "2026-09-16 10:30 AM"),
            new Transaction("TXN-2848", "FTX-90183", "C-101", "M-2", "UI Design Phase & Design System", 3000.0, "FUND", "COMPLETED", "2026-09-28 02:15 PM"),
            new Transaction("TXN-2849", "FTX-90184", "C-102", "M-4", "Brand Guidelines & Logo Assets", 1800.0, "FUND", "COMPLETED", "2026-10-01 09:45 AM"),
            new Transaction("TXN-2846", "FTX-90125", "C-102", "M-5", "API Integration Escrow Fund", 1200.0, "FUND", "PENDING", "Today, 11:15 AM"),
            new Transaction("TXN-2845", "FTX-90126", "C-103", "M-1", "Illustrations & Branding Release", 4800.0, "RELEASE", "COMPLETED", "Yesterday"),
            new Transaction("TXN-2844", "FTX-90127", "C-104", "M-3", "React Landing Page Gateway Deposit", 950.0, "FUND", "FAILED", "Oct 12, 2024"),
            new Transaction("TXN-2843", "FTX-90128", "C-105", "M-1", "Mobile App UI Audit Settlement", 1500.0, "FUND", "FAILED", "Oct 11, 2024"),
            new Transaction("TXN-2842", "FTX-90129", "C-106", "M-2", "Escrow Refund Settlement", 650.0, "REFUND", "REFUNDED", "Oct 10, 2024"),
            new Transaction("TXN-2841", "FTX-90130", "C-107", "M-1", "Database Migration Project Escrow", 2400.0, "FUND", "PENDING", "Oct 09, 2024")
        );
        for (Transaction tx : initialTxns) {
            if (!transactionRepository.existsById(tx.getId())) {
                transactionRepository.save(tx);
            }
        }
    }

    private void seedDisputes() {
        if (disputeRepository.count() == 0) {
            disputeRepository.save(new Dispute("DSP-409", "DSP-409", "UI Design Assets Delayed", "Ruwan vs. Chathuni", "Delay", "Delays in submitting UI kit assets.", "Contract_Milestone_Proof.pdf", 1400.0, "Under Review", "review"));
            disputeRepository.save(new Dispute("DSP-408", "DSP-408", "E-Commerce Back-end Bugs", "Ruwan vs. Amaya", "Quality", "Backend response formatting error.", "Work_Submission_Screenshot.png", 850.0, "Open", "open"));
            disputeRepository.save(new Dispute("DSP-401", "DSP-401", "Brand Style Guide Final Release", "Akila vs. Vihaga", "Copyright", "Disagreement over logo vector rights.", "Brand_Agreement.pdf", 3100.0, "Resolved", "resolved"));
        }
    }

    private void seedReconciliationRecords() {
        if (reconciliationRepository.count() == 0) {
            reconciliationRepository.save(new ReconciliationRecord("TXN-2847", "BATCH-202610-A", 3150.0, 3150.0, "MATCHED", "2026-09-16", "Successfully settled via Escrow pool"));
            reconciliationRepository.save(new ReconciliationRecord("TXN-2846", "BATCH-202610-A", 1200.0, 1195.0, "DISCREPANCY", "2026-09-28", "Under-received by $5.00 due to wire transfer fees"));
            reconciliationRepository.save(new ReconciliationRecord("TXN-2845", "BATCH-202610-B", 4800.0, 4800.0, "MATCHED", "2026-10-01", "Payment verified by Gateway"));
            reconciliationRepository.save(new ReconciliationRecord("TXN-2844", "BATCH-202610-C", 2250.0, 2250.0, "PENDING", "2026-10-04", "Awaiting bank processing confirmation"));
            reconciliationRepository.save(new ReconciliationRecord("TXN-2843", "BATCH-202610-C", 1750.0, 0.0, "UNMATCHED", "2026-10-04", "Gateway reference missing"));
            reconciliationRepository.save(new ReconciliationRecord("TXN-2842", "BATCH-202610-D", 950.0, 950.0, "MATCHED", "2026-10-05", "Direct deposit matched"));
        }
    }


    private void seedSecurityLogs() {
        if (securityLogRepository.count() == 0) {
            securityLogRepository.save(new SecurityLog("USER_LOGIN", "chathuniimalsha.com", "192.168.1.45", "SUCCESS"));
            securityLogRepository.save(new SecurityLog("FUNDS_RELEASED", "ruwansadeepa67@gmail.com", "192.168.1.12", "SUCCESS"));
            securityLogRepository.save(new SecurityLog("DISPUTE_FILED", "ruwansadeepa67@gmail.com", "192.168.1.12", "SUCCESS"));
        }
    }
}
