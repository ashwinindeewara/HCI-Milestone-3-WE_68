package com.freelance.backend.controller;

import com.freelance.backend.service.SupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/support", "/api/support", "/support", "/api/v1", "/api", ""})
@CrossOrigin(origins = "*")
public class SupportController {

    @Autowired
    private SupportService supportService;

    @PostMapping({"/ticket", "/support/ticket", "/contact", "/support/contact"})
    public ResponseEntity<Map<String, Object>> submitSupportTicket(@RequestBody(required = false) Map<String, Object> request) {
        return ResponseEntity.ok(supportService.submitSupportTicket(request));
    }
}

