package com.freelance.backend.controller;

import com.freelance.backend.dto.UserProfileDTO;
import com.freelance.backend.service.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clients")
@CrossOrigin(origins = "*")
public class ClientController {

    @Autowired
    private ClientService clientService;

    @GetMapping("/{id}/profile")
    public ResponseEntity<UserProfileDTO> getClientProfile(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.getClientProfile(id));
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<UserProfileDTO> updateClientProfile(
            @PathVariable Long id,
            @RequestBody UserProfileDTO request) {
        return ResponseEntity.ok(clientService.updateClientProfile(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClientProfile(@PathVariable Long id) {
        clientService.deleteClientProfile(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/delete-by-email")
    public ResponseEntity<Void> deleteClientProfileByEmail(@RequestParam String email) {
        clientService.deleteClientProfileByEmail(email);
        return ResponseEntity.noContent().build();
    }
}
