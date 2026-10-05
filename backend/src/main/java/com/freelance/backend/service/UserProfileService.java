package com.freelance.backend.service;

import com.freelance.backend.dto.UpdateProfileRequest;
import com.freelance.backend.dto.UserProfileDTO;
import com.freelance.backend.entity.User;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserProfileDTO getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return new UserProfileDTO(user);
    }

    @Transactional(readOnly = true)
    public UserProfileDTO getUserProfileByEmail(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return new UserProfileDTO(user);
    }

    @Transactional
    public UserProfileDTO updateUserProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Update core general user profile details (users table in Neon PostgreSQL)
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation().trim());
        }
        if (request.getAbout() != null) {
            user.setAbout(request.getAbout().trim());
        }
        if (request.getCompany() != null) {
            user.setCompany(request.getCompany().trim());
        }
        if (request.getExperience() != null) {
            user.setExperience(request.getExperience().trim());
        }

        User savedUser = userRepository.save(user);

        return new UserProfileDTO(savedUser);
    }
}
