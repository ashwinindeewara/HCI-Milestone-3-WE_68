package com.freelance.backend.service;

import com.freelance.backend.dto.DeliverableRequest;
import com.freelance.backend.dto.CreateDisputeRequest;
import com.freelance.backend.dto.WithdrawalRequest;
import com.freelance.backend.entity.Contract;
import com.freelance.backend.entity.Dispute;
import com.freelance.backend.entity.DisputeMessage;
import com.freelance.backend.entity.Deliverable;
import com.freelance.backend.entity.Milestone;
import com.freelance.backend.entity.Notification;
import com.freelance.backend.entity.Transaction;
import com.freelance.backend.repository.ContractRepository;
import com.freelance.backend.repository.DisputeMessageRepository;
import com.freelance.backend.repository.DisputeRepository;
import com.freelance.backend.repository.DeliverableRepository;
import com.freelance.backend.repository.MilestoneRepository;
import com.freelance.backend.repository.NotificationRepository;
import com.freelance.backend.repository.ProjectRepository;
import com.freelance.backend.repository.TransactionRepository;
import com.freelance.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectNotificationWorkflowTest {

    private static final String CLIENT_EMAIL = "client@example.com";
    private static final String FREELANCER_EMAIL = "freelancer@example.com";

    @Mock private ContractRepository contractRepository;
    @Mock private DisputeRepository disputeRepository;
    @Mock private DisputeMessageRepository disputeMessageRepository;
    @Mock private DeliverableRepository deliverableRepository;
    @Mock private MilestoneRepository milestoneRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProjectService projectService;
    @Mock private TransactionService transactionService;

    private Contract contract;

    @BeforeEach
    void setUp() {
        contract = new Contract("C-1", "Website redesign", "Client Co", "Freelancer", 1000.0,
                "ACTIVE", "2026-10-01", "2026-11-01");
        contract.setClientEmail(CLIENT_EMAIL);
        contract.setFreelancerEmail(FREELANCER_EMAIL);
    }

    @Test
    void signingContractNotifiesOnlyTheAssociatedParties() {
        when(contractRepository.findById("C-1")).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContractService service = new ContractService();
        ReflectionTestUtils.setField(service, "contractRepository", contractRepository);
        ReflectionTestUtils.setField(service, "notificationRepository", notificationRepository);
        ReflectionTestUtils.setField(service, "projectService", projectService);

        service.signContract("C-1", "Freelancer");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(2)).save(captor.capture());
        List<Notification> notifications = captor.getAllValues();
        Notification clientNotice = notifications.stream()
                .filter(notification -> "CONTRACT_SIGNED".equals(notification.getType()))
                .findFirst()
                .orElseThrow();
        Notification freelancerNotice = notifications.stream()
                .filter(notification -> "CONTRACT_ACCEPTED".equals(notification.getType()))
                .findFirst()
                .orElseThrow();

        assertEquals("CLIENT", clientNotice.getRecipientRole());
        assertEquals(CLIENT_EMAIL, clientNotice.getRecipientEmail());
        assertEquals("FREELANCER", freelancerNotice.getRecipientRole());
        assertEquals(FREELANCER_EMAIL, freelancerNotice.getRecipientEmail());
    }

    @Test
    void deliverableSubmissionNotifiesTheContractClient() {
        Milestone milestone = new Milestone("M-1", "C-1", "Design", "Design work",
                500.0, "2026-10-30", "FUNDED");
        when(milestoneRepository.findById("M-1")).thenReturn(Optional.of(milestone));
        when(milestoneRepository.findByContractId("C-1")).thenReturn(List.of(milestone));
        when(deliverableRepository.save(any(Deliverable.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(contractRepository.findById("C-1")).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(projectRepository.findByContractId("C-1")).thenReturn(Optional.empty());

        MilestoneService service = new MilestoneService(milestoneRepository, deliverableRepository);
        ReflectionTestUtils.setField(service, "contractRepository", contractRepository);
        ReflectionTestUtils.setField(service, "projectRepository", projectRepository);
        ReflectionTestUtils.setField(service, "notificationRepository", notificationRepository);
        ReflectionTestUtils.setField(service, "userRepository", userRepository);
        ReflectionTestUtils.setField(service, "projectService", projectService);

        DeliverableRequest request = new DeliverableRequest();
        request.setFileName("design.zip");
        request.setFileSize("2 MB");
        service.addDeliverable("M-1", request);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification notification = captor.getValue();
        assertEquals("DELIVERABLE_SUBMITTED", notification.getType());
        assertEquals("CLIENT", notification.getRecipientRole());
        assertEquals(CLIENT_EMAIL, notification.getRecipientEmail());
        assertEquals("Freelancer", notification.getSenderName());
    }

    @Test
    void paymentReleaseNotifiesTheAssociatedFreelancerOnlyOnce() {
        Milestone milestone = new Milestone("M-1", "C-1", "Design", "Design work",
                500.0, "2026-10-30", "SUBMITTED");
        when(milestoneRepository.findById("M-1")).thenReturn(Optional.of(milestone));
        when(contractRepository.findById("C-1")).thenReturn(Optional.of(contract));
        when(milestoneRepository.save(any(Milestone.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EscrowService service = new EscrowService();
        ReflectionTestUtils.setField(service, "milestoneRepository", milestoneRepository);
        ReflectionTestUtils.setField(service, "transactionService", transactionService);
        ReflectionTestUtils.setField(service, "contractRepository", contractRepository);
        ReflectionTestUtils.setField(service, "notificationRepository", notificationRepository);
        ReflectionTestUtils.setField(service, "userRepository", userRepository);

        service.releasePayment("M-1");
        service.releasePayment("M-1");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification notification = captor.getValue();
        assertEquals("PAYMENT_READY_TO_WITHDRAW", notification.getType());
        assertEquals("FREELANCER", notification.getRecipientRole());
        assertEquals(FREELANCER_EMAIL, notification.getRecipientEmail());
        assertEquals("Client Co", notification.getSenderName());
        verify(transactionService, times(1)).recordTransaction(
                "C-1", "M-1", "Design", 500.0, "RELEASE", "COMPLETED");
    }

    @Test
    void withdrawalNotifiesTheClientForTheProjectFundsWereEarnedFrom() {
        when(contractRepository.findByFreelancerEmailIgnoreCase(FREELANCER_EMAIL)).thenReturn(List.of(contract));
        when(milestoneRepository.findByContractIdIn(List.of("C-1"))).thenReturn(List.of(
                new Milestone("M-1", "C-1", "Design", "Design work", 500.0, "2026-10-30", "RELEASED")));
        when(transactionRepository.findByContractIdIn(List.of("C-1"))).thenReturn(List.of());
        when(transactionService.recordTransaction("C-1", null, "Payout Withdrawal", 250.0,
                "WITHDRAW", "WITHDRAWN"))
                .thenReturn(new Transaction("TXN-1", "FTX-1", "C-1", null, "Payout Withdrawal",
                        250.0, "WITHDRAW", "WITHDRAWN", "Just now"));

        EscrowService service = new EscrowService();
        ReflectionTestUtils.setField(service, "milestoneRepository", milestoneRepository);
        ReflectionTestUtils.setField(service, "transactionService", transactionService);
        ReflectionTestUtils.setField(service, "contractRepository", contractRepository);
        ReflectionTestUtils.setField(service, "notificationRepository", notificationRepository);
        ReflectionTestUtils.setField(service, "transactionRepository", transactionRepository);

        WithdrawalRequest request = new WithdrawalRequest();
        request.setFreelancerEmail(FREELANCER_EMAIL);
        request.setFreelancerName("Freelancer");
        request.setAmount(250.0);

        List<Transaction> transactions = service.withdraw(request);

        assertEquals(1, transactions.size());
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification notification = captor.getValue();
        assertEquals("FREELANCER_WITHDREW_PAYMENT", notification.getType());
        assertEquals("CLIENT", notification.getRecipientRole());
        assertEquals(CLIENT_EMAIL, notification.getRecipientEmail());
        assertEquals("Freelancer", notification.getSenderName());
        assertEquals("C-1", notification.getRelatedEntityId());
        assertEquals("/client-contracts", notification.getActionUrl());
    }

    @Test
    void disputeCreationNotifiesOnlyTheProjectCounterparty() {
        assertDisputeNotificationRecipient("FREELANCER", "CLIENT", CLIENT_EMAIL);
        reset(notificationRepository, disputeRepository, disputeMessageRepository);
        assertDisputeNotificationRecipient("CLIENT", "FREELANCER", FREELANCER_EMAIL);
    }

    private void assertDisputeNotificationRecipient(String reporterRole, String recipientRole, String recipientEmail) {
        when(contractRepository.findById("C-1")).thenReturn(Optional.of(contract));
        when(disputeRepository.save(any(Dispute.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(disputeMessageRepository.findByDisputeIdOrderByIdAsc(anyString())).thenReturn(List.of());

        DisputeService service = new DisputeService(disputeRepository);
        ReflectionTestUtils.setField(service, "messageRepository", disputeMessageRepository);
        ReflectionTestUtils.setField(service, "notificationRepository", notificationRepository);
        ReflectionTestUtils.setField(service, "contractRepository", contractRepository);

        CreateDisputeRequest request = new CreateDisputeRequest();
        request.setContractId("C-1");
        request.setProject("Unrelated project");
        request.setClientName("Wrong client");
        request.setClientEmail("wrong-client@example.com");
        request.setFreelancerName("Wrong freelancer");
        request.setFreelancerEmail("wrong-freelancer@example.com");
        request.setReporterRole(reporterRole);
        request.setIssueType("Payment Delay");
        request.setDescription("Payment issue");

        service.createDispute(request);

        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        Notification notification = notificationCaptor.getValue();
        assertEquals("DISPUTE_CREATED", notification.getType());
        assertEquals(recipientRole, notification.getRecipientRole());
        assertEquals(recipientEmail, notification.getRecipientEmail());
        assertTrue(notification.getRelatedEntityId().startsWith("DSP-"));
        assertEquals("/dispute-details?id=" + notification.getRelatedEntityId(), notification.getActionUrl());

        ArgumentCaptor<DisputeMessage> messageCaptor = ArgumentCaptor.forClass(DisputeMessage.class);
        verify(disputeMessageRepository).save(messageCaptor.capture());
        assertEquals(reporterRole, messageCaptor.getValue().getSenderRole());
    }
}
