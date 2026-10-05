package com.freelance.backend.service;

import com.freelance.backend.dto.FreelancerProfileDTO;
import com.freelance.backend.entity.FeaturedProject;
import com.freelance.backend.entity.FreelancerProfile;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.FreelancerProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class FreelancerProfileService {

    @Autowired
    private FreelancerProfileRepository profileRepository;

    @Autowired
    private FileStorageService fileStorageService;

    public FreelancerProfile getDefaultProfile() {
        return profileRepository.findByEmail("chathuniimalsha.com")
                .orElseGet(() -> profileRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("No freelancer profiles found.")));
    }

    public FreelancerProfile getProfileByEmail(String email) {
        return profileRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Freelancer profile not found for email: " + email));
    }

    @Transactional
    public FreelancerProfile updateProfile(String email, FreelancerProfileDTO dto) {
        FreelancerProfile profile = profileRepository.findByEmail(email)
                .orElseGet(() -> {
                    FreelancerProfile newProfile = new FreelancerProfile();
                    newProfile.setEmail(email);
                    return newProfile;
                });

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            profile.setFullName(dto.getFullName());
        }
        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            profile.setTitle(dto.getTitle());
        }
        if (dto.getAvatarUrl() != null) {
            profile.setAvatarUrl(dto.getAvatarUrl());
        }
        if (dto.getRating() != null) {
            profile.setRating(dto.getRating());
        }
        if (dto.getReviewCount() != null) {
            profile.setReviewCount(dto.getReviewCount());
        }
        if (dto.getCompletedProjects() != null) {
            profile.setCompletedProjects(dto.getCompletedProjects());
        }
        if (dto.getHourlyRate() != null) {
            profile.setHourlyRate(dto.getHourlyRate());
        }
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            profile.setStatus(dto.getStatus());
        }
        if (dto.getAbout() != null) {
            profile.setAbout(dto.getAbout());
        }
        if (dto.getLocation() != null) {
            profile.setLocation(dto.getLocation());
        }
        if (dto.getPhone() != null) {
            profile.setPhone(dto.getPhone());
        }
        if (dto.getExperience() != null) {
            profile.setExperience(dto.getExperience());
        }
        if (dto.getEducation() != null) {
            profile.setEducation(dto.getEducation());
        }
        if (dto.getSkills() != null) {
            profile.setSkills(new ArrayList<>(dto.getSkills()));
        }

        if (dto.getFeaturedProjects() != null) {
            profile.getFeaturedProjects().clear();
            for (FreelancerProfileDTO.FeaturedProjectDTO pDto : dto.getFeaturedProjects()) {
                FeaturedProject fp = new FeaturedProject(
                        pDto.getId() != null ? pDto.getId() : "p-" + System.currentTimeMillis(),
                        pDto.getTitle(),
                        pDto.getCategory(),
                        pDto.getYear(),
                        pDto.getImageUri()
                );
                profile.addProject(fp);
            }
        }

        profile.setUpdatedAt(LocalDateTime.now());
        return profileRepository.save(profile);
    }

    @Transactional
    public FreelancerProfile addSkill(String email, String skill) {
        FreelancerProfile profile = getProfileByEmail(email);
        if (skill != null && !skill.isBlank() && !profile.getSkills().contains(skill)) {
            profile.getSkills().add(skill.trim());
            profile.setUpdatedAt(LocalDateTime.now());
            return profileRepository.save(profile);
        }
        return profile;
    }

    @Transactional
    public FreelancerProfile removeSkill(String email, String skill) {
        FreelancerProfile profile = getProfileByEmail(email);
        profile.getSkills().remove(skill);
        profile.setUpdatedAt(LocalDateTime.now());
        return profileRepository.save(profile);
    }

    @Transactional
    public FreelancerProfile uploadProfileImage(String email, org.springframework.web.multipart.MultipartFile file) {
        FreelancerProfile profile = getProfileByEmail(email);
        com.freelance.backend.entity.FileAttachment attachment = fileStorageService.storeFile(file, "PROFILE", profile.getId().toString(), profile.getFullName());
        profile.setAvatarUrl("/api/files/" + attachment.getId() + "/preview");
        profile.setUpdatedAt(LocalDateTime.now());
        return profileRepository.save(profile);
    }
}
