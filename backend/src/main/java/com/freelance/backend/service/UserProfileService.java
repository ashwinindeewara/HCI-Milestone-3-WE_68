package com.freelance.backend.service;

import com.freelance.backend.dto.UpdateProfileRequest;
import com.freelance.backend.dto.UserProfileDTO;
import com.freelance.backend.entity.User;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.FreelancerProfileRepository;
import com.freelance.backend.repository.UserProfilePictureRepository;
import com.freelance.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private static final Logger logger = LoggerFactory.getLogger(UserProfileService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FreelancerProfileRepository freelancerProfileRepository;

    @Autowired
    private UserProfilePictureRepository userProfilePictureRepository;

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

    @Transactional
    public void deleteUserProfile(Long userId) {
        logger.info("[PROFILE DELETE REQUEST] Initiating deletion for User ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.warn("[PROFILE DELETE WARN] User not found with ID: {}", userId);
                    return new ResourceNotFoundException("User not found with id: " + userId);
                });

        String cleanEmail = user.getEmail() != null ? user.getEmail().trim().toLowerCase() : "";
        logger.info("[PROFILE DELETE PROCESS] User found: ID={}, Email={}. Proceeding to delete records.", user.getId(), cleanEmail);

        // 1. Delete associated UserProfilePicture if present
        try {
            if (userProfilePictureRepository.existsById(user.getId())) {
                logger.info("[PROFILE DELETE PROCESS] Removing UserProfilePicture for User ID: {}", user.getId());
                userProfilePictureRepository.deleteById(user.getId());
            }
        } catch (Exception e) {
            logger.warn("Could not delete UserProfilePicture: {}", e.getMessage());
        }

        // 2. Delete associated FreelancerProfile if present
        if (!cleanEmail.isBlank()) {
            try {
                freelancerProfileRepository.findByEmailIgnoreCase(cleanEmail)
                        .ifPresent(fp -> {
                            logger.info("[PROFILE DELETE PROCESS] Removing FreelancerProfile for email: {}", cleanEmail);
                            freelancerProfileRepository.delete(fp);
                        });
            } catch (Exception e) {
                logger.warn("Could not delete FreelancerProfile: {}", e.getMessage());
            }
        }

        // 3. Delete user record from database
        userRepository.delete(user);
        userRepository.flush();
        logger.info("[PROFILE DELETE SUCCESS] User ID: {} permanently deleted from database.", userId);
    }

    @Transactional
    public void deleteUserProfileByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResourceNotFoundException("Email cannot be empty for profile deletion");
        }
        String cleanEmail = email.trim().toLowerCase();
        logger.info("[PROFILE DELETE REQUEST] Initiating deletion for Email: {}", cleanEmail);
        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> {
                    logger.warn("[PROFILE DELETE WARN] User not found with Email: {}", cleanEmail);
                    return new ResourceNotFoundException("User not found with email: " + email);
                });

        deleteUserProfile(user.getId());
    }
}
