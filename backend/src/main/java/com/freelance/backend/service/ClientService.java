package com.freelance.backend.service;

import com.freelance.backend.dto.UserProfileDTO;
import com.freelance.backend.entity.User;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientService {

    private final UserRepository userRepository;

    public ClientService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileDTO getClientProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return new UserProfileDTO(user);
    }

    @Transactional
    public UserProfileDTO updateClientProfile(Long userId, UserProfileDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (request.getLocation() != null) user.setLocation(request.getLocation());
        if (request.getAbout() != null) user.setAbout(request.getAbout());
        if (request.getCompany() != null) user.setCompany(request.getCompany());
        if (request.getFullName() != null) user.setFullName(request.getFullName());

        User saved = userRepository.save(user);
        return new UserProfileDTO(saved);
    }

    @Transactional
    public void deleteClientProfile(Long userId) {
        userRepository.findById(userId).ifPresent(userRepository::delete);
    }

    @Transactional
    public void deleteClientProfileByEmail(String email) {
        if (email != null && !email.isBlank()) {
            userRepository.findByEmailIgnoreCase(email.trim()).ifPresent(userRepository::delete);
        }
    }
}
