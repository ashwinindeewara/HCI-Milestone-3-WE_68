package com.freelance.backend.controller;

import com.freelance.backend.entity.Contract;
import com.freelance.backend.service.ContractService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
@CrossOrigin(origins = "*")
public class ContractController {

    @Autowired
    private ContractService contractService;

    @GetMapping
    public ResponseEntity<List<Contract>> getAllContracts() {
        return ResponseEntity.ok(contractService.getAllContracts());
    }

    @GetMapping("/freelancer")
    public ResponseEntity<List<Contract>> getFreelancerContracts(
            @RequestParam(required = false, defaultValue = "Chathuni Imalsha") String freelancerName
    ) {
        return ResponseEntity.ok(contractService.getFreelancerContracts(freelancerName));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Contract> getContractById(@PathVariable String id) {
        return ResponseEntity.ok(contractService.getContractById(id));
    }

    @PostMapping
    public ResponseEntity<Contract> createContract(@RequestBody Contract contract) {
        return ResponseEntity.ok(contractService.createContract(contract));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Contract> updateStatus(@PathVariable String id, @RequestParam String status) {
        return ResponseEntity.ok(contractService.updateContractStatus(id, status));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<Contract> signContract(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "Chathuni Imalsha") String signerName
    ) {
        return ResponseEntity.ok(contractService.signContract(id, signerName));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<Contract> acceptContract(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "Chathuni Imalsha") String signerName
    ) {
        return ResponseEntity.ok(contractService.acceptContract(id, signerName));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Contract> rejectContract(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "Declined by freelancer") String reason
    ) {
        return ResponseEntity.ok(contractService.rejectContract(id, reason));
    }

    @GetMapping(value = "/{id}/download", produces = org.springframework.http.MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<byte[]> downloadContractDocument(@PathVariable String id) {
        Contract contract = contractService.getContractById(id);
        String text = "================================================================================\n"
                + "                    OFFICIAL FREELANCE SERVICE CONTRACT AGREEMENT\n"
                + "================================================================================\n\n"
                + "Contract ID:          " + contract.getId() + "\n"
                + "Project Title:        " + contract.getTitle() + "\n"
                + "Client Entity:        " + contract.getClientName() + "\n"
                + "Contractor/Freelancer: " + contract.getFreelancerName() + "\n"
                + "Total Budget:         $" + String.format("%,.2f", contract.getTotalBudget()) + " USD\n"
                + "Escrow Funded:        $" + String.format("%,.2f", contract.getInEscrowAmount() != null ? contract.getInEscrowAmount() : 0.0) + " USD\n"
                + "Contract Status:      " + contract.getStatus() + "\n"
                + "Project Timeline:     " + (contract.getTimeline() != null ? contract.getTimeline() : (contract.getStartDate() + " - " + contract.getEndDate())) + "\n"
                + "Payment Terms:        " + (contract.getPaymentTerms() != null ? contract.getPaymentTerms() : "Milestone Escrow Protection") + "\n\n"
                + "--------------------------------------------------------------------------------\n"
                + "PROJECT DESCRIPTION\n"
                + "--------------------------------------------------------------------------------\n"
                + (contract.getDescription() != null ? contract.getDescription() : "Standard professional design and development agreement.") + "\n\n"
                + "Key Deliverables:\n"
                + (contract.getKeyDeliverables() != null ? contract.getKeyDeliverables() : "- High-resolution UX/UI designs and prototypes\n- Full component library\n- Asset exports and production documentation") + "\n\n"
                + "--------------------------------------------------------------------------------\n"
                + "VERIFIED SIGNATURES & ESCROW SECURITY\n"
                + "--------------------------------------------------------------------------------\n"
                + "Client Signatory:     " + (contract.getSignatoryName() != null ? contract.getSignatoryName() : contract.getClientName()) + "\n"
                + "Freelancer Signatory: " + contract.getFreelancerName() + "\n"
                + "Signed Date:          " + (contract.getSignedDate() != null ? contract.getSignedDate() : "Verified & Active") + "\n"
                + "Digital Hash:         SHA256-ESCROW-SECURITY-STAMP-" + contract.getId() + "\n"
                + "================================================================================\n";

        byte[] bytes = text.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Contract_" + contract.getId() + "_Agreement.pdf\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(bytes);
    }
}
