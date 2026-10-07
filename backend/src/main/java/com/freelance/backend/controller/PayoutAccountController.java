package com.freelance.backend.controller;

import com.freelance.backend.entity.PayoutAccount;
import com.freelance.backend.service.PayoutAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payout-accounts")
@CrossOrigin(origins = "*")
public class PayoutAccountController {

    @Autowired
    private PayoutAccountService payoutAccountService;

    @GetMapping
    public ResponseEntity<List<PayoutAccount>> getAccounts(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String freelancerName
    ) {
        return ResponseEntity.ok(payoutAccountService.getAccounts(email, freelancerName));
    }

    @PostMapping
    public ResponseEntity<PayoutAccount> createAccount(@RequestBody PayoutAccount account) {
        return ResponseEntity.ok(payoutAccountService.saveAccount(account));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PayoutAccount> updateAccount(
            @PathVariable String id,
            @RequestBody PayoutAccount account
    ) {
        account.setId(id);
        return ResponseEntity.ok(payoutAccountService.saveAccount(account));
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<PayoutAccount> setDefaultAccount(
            @PathVariable String id,
            @RequestParam(required = false) String email
    ) {
        return ResponseEntity.ok(payoutAccountService.setDefault(id, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable String id) {
        payoutAccountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}
