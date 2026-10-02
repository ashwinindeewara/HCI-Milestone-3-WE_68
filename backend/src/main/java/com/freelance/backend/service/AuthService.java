package com.freelance.backend.service;

import com.freelance.backend.dto.AuthResponse;
import com.freelance.backend.dto.LoginRequest;
import com.freelance.backend.dto.RegisterRequest;
import com.freelance.backend.entity.User;
import com.freelance.backend.entity.UserRole;
import com.freelance.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Hashes password using SHA-256 (BCrypt compatible structure)
     */
    private String hashPassword(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return rawPassword;
        }
    }

    public AuthResponse registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email address is already registered.");
        }

        UserRole role = request.getRole() != null ? request.getRole() : UserRole.FREELANCER;
        String hashedPassword = hashPassword(request.getPassword());

        User newUser = new User(
            request.getFullName(),
            request.getEmail(),
            hashedPassword,
            role
        );

        User savedUser = userRepository.save(newUser);
        String mockJwt = "jwt_token_" + UUID.randomUUID().toString();

        return new AuthResponse(
            mockJwt,
            savedUser.getId(),
            savedUser.getFullName(),
            savedUser.getEmail(),
            savedUser.getRole(),
            "Registration successful!"
        );
    }

    public AuthResponse loginUser(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Invalid email or password."));

        String hashedPassword = hashPassword(request.getPassword());
        if (!user.getPassword().equals(hashedPassword)) {
            throw new RuntimeException("Invalid email or password.");
        }

        String mockJwt = "jwt_token_" + UUID.randomUUID().toString();

        return new AuthResponse(
            mockJwt,
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getRole(),
            "Login successful!"
        );
    }
}
