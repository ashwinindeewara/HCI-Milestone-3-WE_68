package com.freelance.backend.service;

import com.freelance.backend.entity.ReconciliationRecord;
import com.freelance.backend.repository.ReconciliationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReconciliationService {

    @Autowired
    private ReconciliationRepository reconciliationRepository;

    public List<ReconciliationRecord> getReconciliationRecords() {
        return reconciliationRepository.findAll();
    }

    public List<ReconciliationRecord> runReconciliation() {
        // Logic to run financial batch audit & reconciliation
        return reconciliationRepository.findAll();
    }
}
