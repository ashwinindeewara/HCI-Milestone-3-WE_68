package com.freelance.backend.controller;

import com.freelance.backend.dto.ClientProfileResponse;
import com.freelance.backend.dto.ClientProfileUpdateRequest;
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
    public ResponseEntity<ClientProfileResponse> getClientProfile( @PathVariable Long id) {
        return ResponseEntity.ok( clientService.getClientProfile(id));
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<ClientProfileResponse> updateClientProfile(
            @PathVariable Long id,
            @RequestBody ClientProfileUpdateRequest request) {

        return ResponseEntity.ok( clientService.updateClientProfile(id, request) );
    }
}
