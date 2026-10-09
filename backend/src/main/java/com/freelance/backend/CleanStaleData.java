package com.freelance.backend;

import com.freelance.backend.repository.TransactionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CleanStaleData implements CommandLineRunner {
    private final TransactionRepository transactionRepository;

    public CleanStaleData(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        transactionRepository.findAll().stream()
            .filter(t -> t.getMilestoneTitle() != null && t.getMilestoneTitle().contains("Account Suspension Appeal"))
            .forEach(t -> {
                System.out.println("Deleting stale transaction: " + t.getId());
                transactionRepository.delete(t);
            });
    }
}
