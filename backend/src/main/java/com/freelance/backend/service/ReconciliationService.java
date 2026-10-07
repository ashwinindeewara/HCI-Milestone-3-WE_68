package com.freelance.backend.service;

import com.freelance.backend.dto.ReconciliationCountsDTO;
import com.freelance.backend.entity.ReconciliationRecord;
import com.freelance.backend.entity.Transaction;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.ReconciliationRepository;
import com.freelance.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class ReconciliationService {

    private final ReconciliationRepository reconciliationRepository;
    private final TransactionRepository transactionRepository;

    public ReconciliationService(ReconciliationRepository reconciliationRepository, TransactionRepository transactionRepository) {
        this.reconciliationRepository = reconciliationRepository;
        this.transactionRepository = transactionRepository;
    }

    public List<ReconciliationRecord> getReconciliationRecords(String filterStatus) {
        if (filterStatus == null || filterStatus.isBlank() || "all".equalsIgnoreCase(filterStatus)) {
            return reconciliationRepository.findAll();
        }

        String statusClean = filterStatus.trim().toLowerCase();
        if ("pending".equals(statusClean)) {
            return reconciliationRepository.findByStatusInIgnoreCase(Arrays.asList("PENDING", "IN_REVIEW"));
        } else if ("matched".equals(statusClean)) {
            return reconciliationRepository.findByStatusInIgnoreCase(Arrays.asList("MATCHED", "COMPLETED"));
        } else if ("unmatched".equals(statusClean)) {
            return reconciliationRepository.findByStatusInIgnoreCase(Arrays.asList("UNMATCHED", "DISCREPANCY"));
        }

        return reconciliationRepository.findByStatusIgnoreCase(filterStatus);
    }

    public ReconciliationCountsDTO getReconciliationCounts() {
        long pending = reconciliationRepository.countByStatusInIgnoreCase(Arrays.asList("PENDING", "IN_REVIEW"));
        long matched = reconciliationRepository.countByStatusInIgnoreCase(Arrays.asList("MATCHED", "COMPLETED"));
        long unmatched = reconciliationRepository.countByStatusInIgnoreCase(Arrays.asList("UNMATCHED", "DISCREPANCY"));
        return new ReconciliationCountsDTO(pending, matched, unmatched);
    }

    private ReconciliationRecord findRecordByIdOrReference(String idOrRef) {
        if (idOrRef == null || idOrRef.isBlank()) {
            throw new ResourceNotFoundException("Reconciliation record identifier is required.");
        }

        // Try lookup by numeric primary key
        try {
            Long numericId = Long.parseLong(idOrRef);
            Optional<ReconciliationRecord> byId = reconciliationRepository.findById(numericId);
            if (byId.isPresent()) {
                return byId.get();
            }
        } catch (NumberFormatException ignored) {
        }

        // Try lookup by reference number (e.g. TXN-2847 or FTX-90182)
        return reconciliationRepository.findByReferenceNo(idOrRef)
                .orElseThrow(() -> new ResourceNotFoundException("Reconciliation record not found for: " + idOrRef));
    }

    @Transactional
    public ReconciliationRecord matchRecord(String idOrRef) {
        ReconciliationRecord record = findRecordByIdOrReference(idOrRef);
        record.setStatus("MATCHED");
        if (record.getExpectedAmount() != null) {
            record.setReceivedAmount(record.getExpectedAmount());
            record.setDifference(0.0);
        }

        String currentNotes = record.getNotes() != null ? record.getNotes() : "";
        if (!currentNotes.contains("[MATCHED]")) {
            record.setNotes((currentNotes + " [MATCHED: Verified by Payment Staff]").trim());
        }

        ReconciliationRecord savedRecord = reconciliationRepository.save(record);

        // Synchronize corresponding Transaction status if present
        if (record.getReferenceNo() != null) {
            Optional<Transaction> txnOpt = transactionRepository.findByReferenceNo(record.getReferenceNo());
            if (txnOpt.isEmpty()) {
                txnOpt = transactionRepository.findById(record.getReferenceNo());
            }
            txnOpt.ifPresent(txn -> {
                txn.setStatus("COMPLETED");
                transactionRepository.save(txn);
            });
        }

        return savedRecord;
    }

    @Transactional
    public ReconciliationRecord flagRecord(String idOrRef, String reason) {
        ReconciliationRecord record = findRecordByIdOrReference(idOrRef);
        record.setStatus("DISCREPANCY");

        String flagText = (reason != null && !reason.isBlank()) ? reason : "Flagged for billing audit review.";
        String existingNotes = record.getNotes() != null ? record.getNotes() : "";
        record.setNotes((existingNotes + " [FLAGGED: " + flagText + "]").trim());

        return reconciliationRepository.save(record);
    }

    @Transactional
    public ReconciliationRecord addNoteToRecord(String idOrRef, String noteText) {
        ReconciliationRecord record = findRecordByIdOrReference(idOrRef);
        String existingNotes = record.getNotes() != null ? record.getNotes() : "";
        String newNote = (noteText != null) ? noteText.trim() : "";

        if (!existingNotes.isBlank()) {
            record.setNotes(existingNotes + " | " + newNote);
        } else {
            record.setNotes(newNote);
        }

        return reconciliationRepository.save(record);
    }

    public List<ReconciliationRecord> runReconciliation() {
        return reconciliationRepository.findAll();
    }
}
