package com.freelance.backend.service;

import com.freelance.backend.entity.PayoutAccount;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.PayoutAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PayoutAccountService {

    @Autowired
    private PayoutAccountRepository payoutAccountRepository;

    public List<PayoutAccount> getAccounts(String email, String freelancerName) {
        String targetEmail = (email != null && !email.isBlank()) ? email.trim() : "";
        if (!targetEmail.isEmpty()) {
            List<PayoutAccount> list = payoutAccountRepository.findByUserEmailOrderByCreatedAtDesc(targetEmail);
            if (!list.isEmpty()) {
                return list;
            }
        }

        if (freelancerName != null && !freelancerName.isBlank()) {
            List<PayoutAccount> list = payoutAccountRepository.findByFreelancerNameIgnoreCase(freelancerName.trim());
            if (!list.isEmpty()) {
                return list;
            }
        }

        // Only for default Chathuni account if empty:
        boolean isChathuni = targetEmail.contains("chathuni") || (freelancerName != null && freelancerName.toLowerCase().contains("chathuni"));
        if (isChathuni) {
            return seedChathuniDefaults(targetEmail.isEmpty() ? "chathuniimalsha.com" : targetEmail);
        }

        return List.of();
    }

    private List<PayoutAccount> seedChathuniDefaults(String email) {
        PayoutAccount a1 = new PayoutAccount(
                "acc-chathuni-1",
                email,
                "Chathuni Imalsha",
                "Chase Bank (Checking)",
                "Direct Deposit (ACH) • Checking • Routing: 12200049",
                "Account ending in 4421 • Chathuni Imalsha",
                true,
                "🏛️",
                "Chase Bank",
                "Chathuni Imalsha",
                "4421",
                "12200049",
                "Direct Deposit (ACH)",
                "Checking"
        );
        PayoutAccount a2 = new PayoutAccount(
                "acc-chathuni-2",
                email,
                "Chathuni Imalsha",
                "PayPal Business",
                "Instant Wallet Transfer • USD Preferred",
                "chathuni.design@agency.io",
                false,
                "🅿️",
                "PayPal",
                "Chathuni Imalsha",
                "chathuni.design@agency.io",
                "",
                "PayPal Wallet",
                "Checking"
        );
        PayoutAccount a3 = new PayoutAccount(
                "acc-chathuni-3",
                email,
                "Chathuni Imalsha",
                "Visa Business Debit",
                "Instant Card Payout • Available 24/7",
                "Card ending in 8821 • Expires 08/27",
                false,
                "💳",
                "Visa Business",
                "Chathuni Imalsha",
                "8821",
                "",
                "Instant Debit Card",
                "Checking"
        );
        payoutAccountRepository.saveAll(List.of(a1, a2, a3));
        return payoutAccountRepository.findByUserEmailOrderByCreatedAtDesc(email);
    }

    @Transactional
    public PayoutAccount saveAccount(PayoutAccount account) {
        if (account.getId() == null || account.getId().isBlank()) {
            account.setId("acc-" + UUID.randomUUID().toString().substring(0, 8));
        }

        String email = account.getUserEmail() != null ? account.getUserEmail().trim() : "";
        if (!email.isEmpty() && Boolean.TRUE.equals(account.getIsDefault())) {
            List<PayoutAccount> existing = payoutAccountRepository.findByUserEmailOrderByCreatedAtDesc(email);
            for (PayoutAccount a : existing) {
                if (!a.getId().equals(account.getId())) {
                    a.setIsDefault(false);
                    payoutAccountRepository.save(a);
                }
            }
        }

        return payoutAccountRepository.save(account);
    }

    @Transactional
    public PayoutAccount setDefault(String id, String email) {
        PayoutAccount target = payoutAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payout account not found: " + id));

        String userEmail = (email != null && !email.isBlank()) ? email.trim() : target.getUserEmail();
        List<PayoutAccount> all = payoutAccountRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        for (PayoutAccount a : all) {
            a.setIsDefault(a.getId().equals(id));
            payoutAccountRepository.save(a);
        }

        target.setIsDefault(true);
        return payoutAccountRepository.save(target);
    }

    @Transactional
    public void deleteAccount(String id) {
        payoutAccountRepository.deleteById(id);
    }
}
