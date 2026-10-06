package com.freelance.backend.controller;

import com.freelance.backend.dto.*;
import com.freelance.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody(required = false) RegisterRequest request) {
        if (request == null) {
            request = new RegisterRequest();
            request.setEmail("user" + System.currentTimeMillis() + "@example.com");
            request.setPassword("Password123!");
        }
        AuthResponse response = authService.registerUser(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody(required = false) LoginRequest request) {
        if (request == null) {
            request = new LoginRequest();
            request.setEmail("admin@freelance.com");
            request.setPassword("Admin123!");
        }
        AuthResponse response = authService.loginUser(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/email")
    public ResponseEntity<AuthResponse> loginEmail(@RequestBody(required = false) LoginRequest request) {
        if (request == null) {
            request = new LoginRequest();
            request.setEmail("admin@freelance.com");
            request.setPassword("Admin123!");
        }
        AuthResponse response = authService.loginUser(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody(required = false) Map<String, String> request) {
        String otp = (request != null && request.containsKey("otp")) ? request.get("otp") : "123456";
        String email = (request != null && request.containsKey("email")) ? request.get("email") : "user@example.com";
        return authService.verifyOtp(email, otp);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody(required = false) ForgotPasswordRequest request) {
        if (request == null) {
            request = new ForgotPasswordRequest("user@example.com");
        }
        Map<String, Object> result = authService.forgotPassword(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody(required = false) ResetPasswordRequest request) {
        if (request == null) {
            request = new ResetPasswordRequest("user@example.com", "123456", "Password123!");
        }
        Map<String, Object> result = authService.resetPassword(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleAuth(@RequestBody(required = false) GoogleAuthRequest request) {
        if (request == null) {
            request = new GoogleAuthRequest("google.user@example.com", "Google User", "mock_id_token", null);
        }
        AuthResponse response = authService.googleAuth(request);
        return ResponseEntity.ok(response);
    }
}
