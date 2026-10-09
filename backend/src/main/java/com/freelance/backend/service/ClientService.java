package com.freelance.backend.service;

import com.freelance.backend.dto.ClientProfileResponse;
import com.freelance.backend.dto.ClientProfileUpdateRequest;
import com.freelance.backend.entity.ClientProfile;
import com.freelance.backend.entity.User;
import com.freelance.backend.repository.ClientProfileRepository;
import com.freelance.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientService {

    private final ClientProfileRepository clientProfileRepository;
    private final UserRepository userRepository;

    public ClientService(
            ClientProfileRepository clientProfileRepository,
            UserRepository userRepository) {

        this.clientProfileRepository = clientProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ClientProfileResponse getClientProfile(Long userId) {

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Get client profile
        ClientProfile profile = clientProfileRepository
                .findByUserId(userId)
                .orElseGet(() -> {
                    ClientProfile newProfile = new ClientProfile();
                    newProfile.setUser(user);
                    newProfile.setMemberSince(java.time.LocalDate.now());
                    return clientProfileRepository.save(newProfile);
                });

        // Build response
        ClientProfileResponse response = new ClientProfileResponse();

        // User information
        response.setUserId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setProfileImageUrl(user.getProfileImageUrl());

        // Client profile information
        response.setLocation(profile.getLocation());
        response.setCompanyName(profile.getCompanyName());
        response.setAbout(profile.getAbout());
        response.setStatus(profile.getStatus());
        response.setSkills(profile.getSkills());

        // Member since comes from User.createdAt
        if (user.getCreatedAt() != null) {
            response.setMemberSince(
                    user.getCreatedAt().getYear()
            );
        }

        return response;
    }

    @Transactional
    public ClientProfileResponse updateClientProfile(
            Long userId, ClientProfileUpdateRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        ClientProfile profile = clientProfileRepository
                .findByUserId(userId)
                .orElseGet(() -> {
                    ClientProfile newProfile = new ClientProfile();
                    newProfile.setUser(user);
                    newProfile.setMemberSince(java.time.LocalDate.now());
                    return clientProfileRepository.save(newProfile);
                });

        profile.setLocation(request.getLocation());
        profile.setCompanyName(request.getCompanyName());
        profile.setAbout(request.getAbout());

        if (request.getSkills() != null) {
            profile.setSkills(request.getSkills());
        }

        clientProfileRepository.save(profile);

        // Return the same DTO used by GET profile
        return getClientProfile(userId);
    }
}
