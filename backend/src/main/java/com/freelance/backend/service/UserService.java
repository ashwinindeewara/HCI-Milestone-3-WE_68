package com.freelance.backend.service;

import com.freelance.backend.entity.User;
import com.freelance.backend.entity.UserRole;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.FreelancerProfileRepository;
import com.freelance.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    @Autowired
    private FreelancerProfileRepository freelancerProfileRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("[USER SEARCH WARN] User not found with ID: {}", id);
                    return new ResourceNotFoundException("User not found with id: " + id);
                });
    }

    @Transactional
    public User updateUserStatus(Long id, String status) {
        User user = getUserById(id);
        user.setStatus(status);
        return userRepository.save(user);
    }

    @Transactional
    public User updateUserRole(Long id, UserRole role) {
        User user = getUserById(id);
        user.setRole(role);
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        logger.info("[USER DELETE REQUEST] Initiating deletion for User ID: {}", id);
        User user = getUserById(id);
        logger.info("[USER DELETE PROCESS] Found user: ID={}, Email={}. Proceeding to delete.", user.getId(), user.getEmail());

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            String cleanEmail = user.getEmail().trim().toLowerCase();
            freelancerProfileRepository.findByEmailIgnoreCase(cleanEmail)
                    .ifPresent(fp -> {
                        logger.info("[USER DELETE PROCESS] Deleting associated FreelancerProfile for email: {}", cleanEmail);
                        freelancerProfileRepository.delete(fp);
                    });
        }
        userRepository.delete(user);
        logger.info("[USER DELETE SUCCESS] User ID: {} permanently deleted from database.", id);
    }
}
