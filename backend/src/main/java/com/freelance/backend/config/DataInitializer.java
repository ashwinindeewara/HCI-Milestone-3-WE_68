package com.freelance.backend.config;

import com.freelance.backend.entity.*;
import com.freelance.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
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
    private DisputeMessageRepository disputeMessageRepository;

    @Autowired
    private ReconciliationRepository reconciliationRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SecurityLogRepository securityLogRepository;

    @Autowired
    private FreelancerProfileRepository profileRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectActivityRepository activityRepository;

    @Autowired
    private FileAttachmentRepository fileAttachmentRepository;

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
        seedProjects();
        seedTransactions();
        seedDisputes();
        seedReconciliationRecords();
        seedSecurityLogs();
        seedFreelancerProfiles();
        seedNotifications();
    }

    private void seedUser(String fullName, String email, String password, UserRole role, String status) {
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            userRepository.save(new User(fullName, email, hashPassword(password), role, status));
        } else {
            user.setPassword(hashPassword(password));
            user.setStatus("Active");
            userRepository.save(user);
        }
    }

    private void seedUsers() {
        seedUser("Chathuni Imalsha", "chathuniimalsha.com", "Password123!", UserRole.FREELANCER, "Active");
        seedUser("Chathuni Imalsha", "chathuniimalsha@gmail.com", "Password123!", UserRole.FREELANCER, "Active");
        seedUser("Chathuni Imalsha", "chathuni@design.com", "Password123!", UserRole.FREELANCER, "Active");
        seedUser("Ruwan Sadeepa", "ruwansadeepa67@gmail.com", "Password123!", UserRole.CLIENT, "Active");
        seedUser("Amaya Perera", "amayaperera2003@gmail.com", "Password123!", UserRole.FREELANCER, "Suspended");
        seedUser("Akila Deshan", "akiladesh99@gmail.com", "Password123!", UserRole.CLIENT, "Active");
        seedUser("System Admin", "admin@freelance.com", "Admin123!", UserRole.ADMIN, "Active");
        seedUser("Payment Staff", "staff@freelance.com", "Staff123!", UserRole.PAYMENT_STAFF, "Active");
    }

    private void seedFreelancerProfiles() {
        if (profileRepository.count() == 0) {
            FreelancerProfile profile = new FreelancerProfile(
                    "chathuniimalsha.com",
                    "Chathuni Imalsha",
                    "UI/UX Designer",
                    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
                    4.8,
                    23,
                    18,
                    65.0,
                    "Available",
                    "Productive UI/UX designer with 4+ years of expertise. Specializing in high-fidelity design systems, mobile workflows, and interactive prototyping."
            );
            profile.setLocation("Colombo, Sri Lanka");
            profile.setPhone("+94 77 123 4567");
            profile.setExperience("4+ years of professional UX/UI design & product development");
            profile.setEducation("B.Sc. in Software Engineering, SLIIT");

            profile.setSkills(new ArrayList<>(Arrays.asList(
                    "Figma", "UI Design", "UX Research", "Prototyping", "Design Systems"
            )));

            FeaturedProject p1 = new FeaturedProject(
                    "p1",
                    "SaaS Finance Portal",
                    "Web Design",
                    "2024",
                    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80"
            );
            profile.addProject(p1);

            FeaturedProject p2 = new FeaturedProject(
                    "p2",
                    "FitTrack App",
                    "iOS Design",
                    "2023",
                    "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80"
            );
            profile.addProject(p2);

            profileRepository.save(profile);
        }
    }

    private void seedContractsAndMilestones() {
        if (contractRepository.count() == 0) {
            // Contract 1: E-Commerce Redesign
            Contract c1 = new Contract(
                    "C-101",
                    "E-Commerce Redesign",
                    "TechVentures Inc.",
                    "Chathuni Imalsha",
                    8000.0,
                    "NEW",
                    "2026-09-01",
                    "2026-11-30"
            );
            c1.setTimeline("Sep 01 - Nov 30, 2024");
            c1.setDueDate("Due Oct 15, 2024");
            c1.setCurrentMilestoneTitle("Milestone: UI Design Phase");
            c1.setCompletionPercentage(65);
            c1.setInEscrowAmount(2400.0);
            c1.setActiveStatusBadge("On Track");
            c1.setPaymentTerms("Milestone-based (Escrow Protection)");
            c1.setDescription("This project focuses on rebuilding the entire frontend buyer experience of the flagship TechVentures e-commerce application. Focus points include visual brand alignment, mobile optimization, and interactive prototype delivery.");
            c1.setKeyDeliverables("Full UX Research and interactive wireframes\nFigma Design System setup & component library\n24 High-fidelity viewport layouts (desktop & mobile)");
            c1.setSignatoryName("Sarah Chen");
            c1.setSignedDate("Signed Oct 05, 2024");
            c1.setIsSigned(false);
            contractRepository.save(c1);

            Milestone m1 = new Milestone("M-1", "C-101", "1. Wireframes approved", "Complete user flow diagrams and low-fidelity prototypes.", 2000.0, "2026-09-15", "RELEASED");
            m1.setContract(c1);
            milestoneRepository.save(m1);

            Milestone m2 = new Milestone("M-2", "C-101", "2. Design system finalized", "High-fidelity Figma screens and component library.", 3000.0, "2026-10-15", "FUNDED");
            m2.setContract(c1);
            milestoneRepository.save(m2);

            Milestone m3 = new Milestone("M-3", "C-101", "3. High-fidelity handover", "Interactive prototype, design tokens, and developer handover assets.", 3000.0, "2026-11-30", "PENDING");
            m3.setContract(c1);
            milestoneRepository.save(m3);

            // Contract 2: Mobile App Contract
            Contract c2 = new Contract(
                    "C-102",
                    "Mobile App Contract",
                    "Global Retail Corp",
                    "Chathuni Imalsha",
                    12500.0,
                    "PENDING",
                    "2026-10-15",
                    "2027-01-15"
            );
            c2.setTimeline("Oct 15 - Jan 15");
            c2.setDueDate("Due Nov 01, 2024");
            c2.setCurrentMilestoneTitle("Milestone: API Integration");
            c2.setCompletionPercentage(30);
            c2.setInEscrowAmount(3800.0);
            c2.setActiveStatusBadge("On Track");
            c2.setPaymentTerms("Milestone-based (Escrow Protection)");
            c2.setDescription("End-to-end mobile app development and cross-platform UI implementation with secure backend REST API integration.");
            c2.setKeyDeliverables("Architecture blueprint & API schemas\nAuthentication, Product Catalog & Checkout flows\nTesting, QA and deployment to App Store and Google Play");
            c2.setSignatoryName("Marcus Vance");
            c2.setSignedDate("Signed Oct 12, 2024");
            c2.setIsSigned(false);
            contractRepository.save(c2);

            Milestone m4 = new Milestone("M-4", "C-102", "1. Architecture & Wireframes", "System architecture & user wireframes.", 3500.0, "2026-10-25", "RELEASED");
            m4.setContract(c2);
            milestoneRepository.save(m4);

            Milestone m5 = new Milestone("M-5", "C-102", "2. API & Payment Integration", "Secure payment gateway integration and client APIs.", 4500.0, "2026-11-20", "FUNDED");
            m5.setContract(c2);
            milestoneRepository.save(m5);

            Milestone m6 = new Milestone("M-6", "C-102", "3. Store Deployment & Launch", "App store bundle release and store submission.", 4500.0, "2027-01-15", "PENDING");
            m6.setContract(c2);
            milestoneRepository.save(m6);

            // Contract 3: Marketing Brand Strategy
            Contract c3 = new Contract(
                    "C-103",
                    "Marketing Brand Strategy",
                    "Apex Ventures",
                    "Chathuni Imalsha",
                    4500.0,
                    "COMPLETED",
                    "2026-08-01",
                    "2026-09-30"
            );
            c3.setTimeline("Aug 01 - Sep 30");
            c3.setDueDate("Due Sep 30, 2024");
            c3.setCurrentMilestoneTitle("Milestone: Final Assets Handover");
            c3.setCompletionPercentage(100);
            c3.setInEscrowAmount(0.0);
            c3.setActiveStatusBadge("Completed & Paid");
            c3.setPaymentTerms("Milestone-based (Escrow Protection)");
            c3.setDescription("Complete corporate rebranding package including brand guidelines, typography system, high-resolution vector assets, and marketing collateral templates.");
            c3.setKeyDeliverables("Brand Guideline PDF & Visual Identity Matrix\nLogo vectors in SVG, PNG, EPS formats\nSocial media kit & email template system");
            c3.setSignatoryName("Elena Rostova");
            c3.setSignedDate("Signed Aug 01, 2024");
            c3.setIsSigned(true);
            contractRepository.save(c3);

            Milestone m7 = new Milestone("M-7", "C-103", "1. Brand Identity Concept", "Vector logo files and identity manual.", 1500.0, "2026-08-15", "RELEASED");
            m7.setContract(c3);
            milestoneRepository.save(m7);

            Milestone m8 = new Milestone("M-8", "C-103", "2. Collateral & Media Assets", "Templates and promo banners for launch campaign.", 1500.0, "2026-09-01", "RELEASED");
            m8.setContract(c3);
            milestoneRepository.save(m8);

            Milestone m9 = new Milestone("M-9", "C-103", "3. Final Assets Handover", "Final asset delivery and source vectors.", 1500.0, "2026-09-30", "RELEASED");
            m9.setContract(c3);
            milestoneRepository.save(m9);
        }
    }

    private void seedTransactions() {
        List<Transaction> initialTxns = Arrays.asList(
                new Transaction("TXN-2847", "FTX-90182", "C-101", "M-1", "Wireframes & UX Research", 2500.0, "RELEASE",
                        "COMPLETED", "2026-09-16 10:30 AM"),
                new Transaction("TXN-2848", "FTX-90183", "C-101", "M-2", "UI Design Phase & Design System", 3000.0,
                        "FUND", "COMPLETED", "2026-09-28 02:15 PM"),
                new Transaction("TXN-2849", "FTX-90184", "C-102", "M-4", "Brand Guidelines & Logo Assets", 1800.0,
                        "FUND", "COMPLETED", "2026-10-01 09:45 AM"),
                new Transaction("TXN-2846", "FTX-90125", "C-102", "M-5", "API Integration Escrow Fund", 1200.0, "FUND",
                        "PENDING", "Today, 11:15 AM"),
                new Transaction("TXN-2845", "FTX-90126", "C-103", "M-1", "Illustrations & Branding Release", 4800.0,
                        "RELEASE", "COMPLETED", "Yesterday"),
                new Transaction("TXN-2844", "FTX-90127", "C-104", "M-3", "React Landing Page Gateway Deposit", 950.0,
                        "FUND", "FAILED", "Oct 12, 2024"),
                new Transaction("TXN-2843", "FTX-90128", "C-105", "M-1", "Mobile App UI Audit Settlement", 1500.0,
                        "FUND", "FAILED", "Oct 11, 2024"),
                new Transaction("TXN-2842", "FTX-90129", "C-106", "M-2", "Escrow Refund Settlement", 650.0, "REFUND",
                        "REFUNDED", "Oct 10, 2024"),
                new Transaction("TXN-2841", "FTX-90130", "C-107", "M-1", "Database Migration Project Escrow", 2400.0,
                        "FUND", "PENDING", "Oct 09, 2024"));
        
        for (Transaction tx : initialTxns) {
            if (!transactionRepository.existsById(tx.getId())) {
                transactionRepository.save(tx);
            }
        }
    }

    private void seedDisputes() {
        if (disputeRepository.count() == 0) {
            Dispute d1 = new Dispute(
                    "DSP-409",
                    "DSP-409",
                    "E-Commerce Redesign",
                    "TechVentures Inc. vs. Chathuni",
                    "Payment Delay",
                    "Completed Milestone: UI Design Phase. Deliverable was uploaded on time and approved by client internally, but the payment escrow remains locked.",
                    "contract-agreement.pdf,approved-screens-specs.png",
                    2400.0,
                    "Under Review",
                    "review",
                    "Filed Oct 10, 2024",
                    2
            );
            disputeRepository.save(d1);

            disputeMessageRepository.save(new DisputeMessage(
                    "DSP-409",
                    "Sarah",
                    "FREELANCER",
                    "I have submitted all the design source files. Client approved via Slack chat.",
                    "10:45 AM"
            ));
            disputeMessageRepository.save(new DisputeMessage(
                    "DSP-409",
                    "Admin",
                    "ADMIN",
                    "Understood. We are verifying the timeline with the client. Please hold on.",
                    "11:20 AM"
            ));

            Dispute d2 = new Dispute(
                    "DSP-408",
                    "DSP-408",
                    "Mobile App Contract",
                    "Global Retail Corp vs. Chathuni",
                    "Scope Disagreement",
                    "Scope disagreement regarding additional API integrations beyond initial statement of work.",
                    "Contract_Milestone_Proof.pdf",
                    3800.0,
                    "Open",
                    "open",
                    "Filed Oct 12, 2024",
                    1
            );
            disputeRepository.save(d2);

            disputeMessageRepository.save(new DisputeMessage(
                    "DSP-408",
                    "Sarah",
                    "FREELANCER",
                    "Client requested extra microservice integrations not covered under Milestone 2 scope.",
                    "09:15 AM"
            ));

            Dispute d3 = new Dispute(
                    "DSP-401",
                    "DSP-401",
                    "Logo & Brand Identity",
                    "Apex Global Media vs. Chathuni",
                    "Milestone Discrepancy",
                    "Milestone discrepancy resolved for vector exports and brand stylebook delivery.",
                    "Brand_Agreement.pdf",
                    450.0,
                    "Resolved",
                    "resolved",
                    "Filed Sep 15, 2024",
                    3
            );
            disputeRepository.save(d3);

            disputeMessageRepository.save(new DisputeMessage(
                    "DSP-401",
                    "Admin",
                    "ADMIN",
                    "All deliverables accepted by client. Escrow funds released successfully.",
                    "02:00 PM"
            ));
        }
    }

    private void seedReconciliationRecords() {
        if (reconciliationRepository.count() == 0) {
            reconciliationRepository.save(new ReconciliationRecord("TXN-2847", "BATCH-202610-A", 3150.0, 3150.0,
                    "MATCHED", "2026-09-16", "Successfully settled via Escrow pool"));
            reconciliationRepository.save(new ReconciliationRecord("TXN-2846", "BATCH-202610-A", 1200.0, 1195.0,
                    "DISCREPANCY", "2026-09-28", "Under-received by $5.00 due to wire transfer fees"));
            reconciliationRepository.save(new ReconciliationRecord("TXN-2845", "BATCH-202610-B", 4800.0, 4800.0,
                    "MATCHED", "2026-10-01", "Payment verified by Gateway"));
            reconciliationRepository.save(new ReconciliationRecord("TXN-2844", "BATCH-202610-C", 2250.0, 2250.0,
                    "PENDING", "2026-10-04", "Awaiting bank processing confirmation"));
            reconciliationRepository.save(new ReconciliationRecord("TXN-2843", "BATCH-202610-C", 1750.0, 0.0,
                    "UNMATCHED", "2026-10-04", "Gateway reference missing"));
            reconciliationRepository.save(new ReconciliationRecord("TXN-2842", "BATCH-202610-D", 950.0, 950.0,
                    "MATCHED", "2026-10-05", "Direct deposit matched"));
        }
    }


    private void seedSecurityLogs() {
        if (securityLogRepository.count() == 0) {
            securityLogRepository.save(new SecurityLog("USER_LOGIN", "chathuni@design.com", "192.168.1.45", "SUCCESS"));
            securityLogRepository
                    .save(new SecurityLog("FUNDS_RELEASED", "ruwansadeepa67@gmail.com", "192.168.1.12", "SUCCESS"));
            securityLogRepository
                    .save(new SecurityLog("DISPUTE_FILED", "ruwansadeepa67@gmail.com", "192.168.1.12", "SUCCESS"));
        }
    }

    private void seedNotifications() {
        if (notificationRepository.count() == 0) {
            notificationRepository.save(new Notification(
                    "Brand Identity & Marketing Assets",
                    "Milestone 1 Funded • Due Oct 05, 2024",
                    "In Escrow",
                    "escrow",
                    "$1,800",
                    "Payments",
                    "/(tabs)/escrow",
                    "View Escrow Status",
                    false,
                    "3 days ago",
                    "PAYMENT_ESCROW",
                    "PRJ-C-103",
                    "Escrow funds of $1,800 for Milestone 1: Brand Strategy & Moodboards have been deposited by Acme Corp. Work can commence safely."
            ));

            notificationRepository.save(new Notification(
                    "Logo & Brand Identity",
                    "Milestone Discrepancy • Filed Sep 15, 2024",
                    "Resolved",
                    "resolved",
                    "$450",
                    "Disputes",
                    "/dispute-details?id=DSP-401",
                    "View Details & Discussion",
                    false,
                    "1 day ago",
                    "DISPUTE_STATUS_CHANGED",
                    "DSP-401",
                    "Dispute DSP-401 has been marked as Resolved following agreement on final vector asset deliverables."
            ));

            notificationRepository.save(new Notification(
                    "Mobile App Contract",
                    "Scope Disagreement • Filed Oct 12, 2024",
                    "Open",
                    "open",
                    "$3,800",
                    "Disputes",
                    "/dispute-details?id=DSP-408",
                    "View Details & Discussion",
                    true,
                    "1 hr ago",
                    "DISPUTE_MESSAGE",
                    "DSP-408",
                    "New comment on dispute DSP-408 regarding additional screen variations requested outside original statement of work."
            ));

            notificationRepository.save(new Notification(
                    "E-Commerce Redesign",
                    "Payment Delay • Filed Oct 10, 2024",
                    "Under Review",
                    "review",
                    "$2,400",
                    "Disputes",
                    "/dispute-details?id=DSP-409",
                    "View Details & Discussion",
                    true,
                    "2 min ago",
                    "DISPUTE_MESSAGE",
                    "DSP-409",
                    "Platform mediator updated dispute DSP-409: Reviewing milestone completion evidence and chat logs with TechVentures Inc."
            ));

            // First / Topmost Notification: New Contract Offer
            notificationRepository.save(new Notification(
                    "E-Commerce Mobile App Redesign",
                    "New contract offer from TechVentures Inc. • Signature Required",
                    "New Contract",
                    "contract",
                    "$8,500",
                    "Contracts",
                    "/contract-details?id=C-101",
                    "View Contract & Sign",
                    true,
                    "Just now",
                    "CONTRACT_RECEIVED",
                    "C-101",
                    "TechVentures Inc. has offered you a new fixed-price contract for 'E-Commerce Mobile App Redesign' totaling $8,500 across 3 funded milestones. Review terms and accept to launch the project."
            ));
        }
    }

    private void seedProjects() {
        if (projectRepository.count() == 0) {
            Project p1 = new Project(
                    "PRJ-C-101",
                    "C-101",
                    "E-Commerce Redesign",
                    "TechVentures Inc.",
                    "Chathuni Imalsha",
                    "This project focuses on rebuilding the entire frontend buyer experience of the flagship TechVentures e-commerce application. Focus points include visual brand alignment, mobile optimization, and interactive prototype delivery.",
                    "ACTIVE",
                    65,
                    8000.0,
                    2400.0,
                    "Sep 01 - Nov 30, 2024",
                    "Due Oct 15, 2024",
                    "On Track"
            );
            projectRepository.save(p1);

            activityRepository.save(new ProjectActivity("PRJ-C-101", "C-101", "CONTRACT_ACCEPTED", "Contract signed and project activated by Chathuni Imalsha", "Chathuni Imalsha"));
            activityRepository.save(new ProjectActivity("PRJ-C-101", "C-101", "MILESTONE_DELIVERED", "Submitted wireframes and low-fi prototype", "Chathuni Imalsha"));
            activityRepository.save(new ProjectActivity("PRJ-C-101", "C-101", "DELIVERABLE_APPROVED", "Wireframes approved by Sarah Chen", "Sarah Chen"));

            Project p2 = new Project(
                    "PRJ-C-102",
                    "C-102",
                    "Mobile App Contract",
                    "Global Retail Corp",
                    "Chathuni Imalsha",
                    "End-to-end mobile app development and cross-platform UI implementation with secure backend REST API integration.",
                    "ACTIVE",
                    30,
                    12500.0,
                    3800.0,
                    "Oct 15 - Jan 15, 2025",
                    "Due Nov 01, 2024",
                    "On Track"
            );
            projectRepository.save(p2);

            activityRepository.save(new ProjectActivity("PRJ-C-102", "C-102", "CONTRACT_ACCEPTED", "Contract accepted by Chathuni Imalsha", "Chathuni Imalsha"));
            activityRepository.save(new ProjectActivity("PRJ-C-102", "C-102", "ESCROW_DEPOSITED", "Escrow deposit funded by Marcus Vance ($3,800)", "Marcus Vance"));

            Project p3 = new Project(
                    "PRJ-C-103",
                    "C-103",
                    "Marketing Brand Strategy",
                    "Apex Ventures",
                    "Chathuni Imalsha",
                    "Complete corporate rebranding package including brand guidelines, typography system, high-resolution vector assets, and marketing collateral templates.",
                    "COMPLETED",
                    100,
                    4500.0,
                    0.0,
                    "Aug 01 - Sep 30, 2024",
                    "Completed Sep 30, 2024",
                    "Completed & Paid"
            );
            projectRepository.save(p3);

            activityRepository.save(new ProjectActivity("PRJ-C-103", "C-103", "PROJECT_COMPLETED", "All milestones completed and escrow released", "System"));
        }
    }
}
