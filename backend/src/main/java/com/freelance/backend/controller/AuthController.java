package com.freelance.backend.controller;

import com.freelance.backend.dto.AuthResponse;
import com.freelance.backend.dto.LoginRequest;
import com.freelance.backend.dto.RegisterRequest;
import com.freelance.backend.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        logger.info("POST /auth/register request received for email: {}", request.getEmail());
        AuthResponse response = authService.registerUser(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        logger.info("POST /auth/login request received for email: {}", request.getEmail());
        AuthResponse response = authService.loginUser(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/email")
    public ResponseEntity<AuthResponse> loginEmail(@Valid @RequestBody LoginRequest request) {
        logger.info("POST /auth/login/email request received for email: {}", request.getEmail());
        AuthResponse response = authService.loginUser(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String otp = request.get("otp");
        String email = request.getOrDefault("email", "user@example.com");
        logger.info("POST /auth/login/verify-otp request received for email: {}", email);
        return authService.verifyOtp(email, otp);
    }
}

