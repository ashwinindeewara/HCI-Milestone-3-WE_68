package com.freelance.backend.service;

import com.freelance.backend.dto.FreelancerProfileDTO;
import com.freelance.backend.dto.FreelancerListingDTO;
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
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class FreelancerProfileService {

    private static final Logger logger = LoggerFactory.getLogger(FreelancerProfileService.class);

    @Autowired
    private FreelancerProfileRepository profileRepository;

    @Autowired
    private com.freelance.backend.repository.UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    public List<FreelancerListingDTO> getAllFreelancerProfiles() {
        Map<Long, FreelancerListingDTO> profiles = new LinkedHashMap<>();
        for (FreelancerProfileRepository.FreelancerProfileListingRow row : profileRepository.findAllForListing()) {
            FreelancerListingDTO profile = profiles.computeIfAbsent(
                    row.getId(),
                    id -> new FreelancerListingDTO(
                            id,
                            row.getFullName(),
                            row.getTitle(),
                            row.getRating(),
                            row.getCompletedProjects(),
                            row.getHourlyRate(),
                            row.getStatus()
                    )
            );
            profile.addSkill(row.getSkill());
        }
        return List.copyOf(profiles.values());
    }

    public FreelancerProfile getProfileById(Long id) {
        return profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Freelancer profile not found with id: " + id));
    }

    public FreelancerProfile getDefaultProfile() {
        return profileRepository.findAll().stream().findFirst()
                .orElseGet(() -> new FreelancerProfile("freelancer@example.com", "Freelancer"));
    }

    public FreelancerProfile getProfileByEmail(String email) {
        if (email == null || email.isBlank()) {
            return getDefaultProfile();
        }
        String cleanEmail = email.trim().toLowerCase();
        return profileRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseGet(() -> {
                    String name = userRepository.findByEmailIgnoreCase(cleanEmail)
                            .map(com.freelance.backend.entity.User::getFullName)
                            .orElse("Freelancer");
                    FreelancerProfile freshProfile = new FreelancerProfile(cleanEmail, name);
                    return profileRepository.save(freshProfile);
                });
    }

    @Transactional
    public FreelancerProfile updateProfile(String email, FreelancerProfileDTO dto) {
        String cleanEmail = (email != null && !email.isBlank()) ? email.trim().toLowerCase() : (dto.getEmail() != null ? dto.getEmail().trim().toLowerCase() : "freelancer@example.com");
        FreelancerProfile profile = profileRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseGet(() -> {
                    String name = (dto.getFullName() != null && !dto.getFullName().isBlank())
                            ? dto.getFullName()
                            : userRepository.findByEmailIgnoreCase(cleanEmail)
                            .map(com.freelance.backend.entity.User::getFullName)
                            .orElse("Freelancer");
                    FreelancerProfile newProfile = new FreelancerProfile(cleanEmail, name);
                    return profileRepository.save(newProfile);
                });

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            profile.setFullName(dto.getFullName());
            // Sync with User table so navbar/session reflects the updated name
            userRepository.findByEmail(cleanEmail).ifPresent(u -> {
                u.setFullName(dto.getFullName());
                userRepository.save(u);
            });
        }
        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            profile.setTitle(dto.getTitle());
        }
        if (dto.getAvatarUrl() != null && !dto.getAvatarUrl().isBlank()) {
            String av = dto.getAvatarUrl();
            if (av.startsWith("data:image/") && av.contains(";base64,")) {
                try {
                    String[] parts = av.split(";base64,");
                    String meta = parts[0];
                    String base64Data = parts[1];
                    byte[] data = java.util.Base64.getDecoder().decode(base64Data);
                    String mimeType = meta.replace("data:", "");
                    String ext = "png";
                    if (mimeType.contains("jpeg") || mimeType.contains("jpg")) ext = "jpg";
                    else if (mimeType.contains("webp")) ext = "webp";
                    else if (mimeType.contains("gif")) ext = "gif";
                    String fileName = "avatar_" + System.currentTimeMillis() + "." + ext;
                    
                    com.freelance.backend.util.ByteArrayMultipartFile customFile =
                            new com.freelance.backend.util.ByteArrayMultipartFile(data, fileName, mimeType);
                    com.freelance.backend.entity.FileAttachment attachment =
                            fileStorageService.storeFile(customFile, "PROFILE", profile.getId() != null ? profile.getId().toString() : "PROFILE", profile.getFullName());
                    profile.setAvatarUrl("/api/files/" + attachment.getId() + "/preview");
                } catch (Exception ex) {
                    profile.setAvatarUrl(av);
                }
            } else {
                profile.setAvatarUrl(av);
            }
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
            java.util.Map<String, FeaturedProject> existingMap = new java.util.HashMap<>();
            for (FeaturedProject p : profile.getFeaturedProjects()) {
                if (p.getId() != null) {
                    existingMap.put(p.getId(), p);
                }
            }

            java.util.List<FeaturedProject> updatedList = new java.util.ArrayList<>();
            for (FreelancerProfileDTO.FeaturedProjectDTO pDto : dto.getFeaturedProjects()) {
                String img = pDto.getImageUri();
                if (img != null && img.startsWith("data:image/") && img.contains(";base64,")) {
                    try {
                        String[] parts = img.split(";base64,");
                        String meta = parts[0];
                        String base64Data = parts[1];
                        byte[] data = java.util.Base64.getDecoder().decode(base64Data);
                        String mimeType = meta.replace("data:", "");
                        String ext = "png";
                        if (mimeType.contains("jpeg") || mimeType.contains("jpg")) ext = "jpg";
                        String fileName = "project_" + System.currentTimeMillis() + "." + ext;
                        com.freelance.backend.util.ByteArrayMultipartFile customFile =
                                new com.freelance.backend.util.ByteArrayMultipartFile(data, fileName, mimeType);
                        com.freelance.backend.entity.FileAttachment attachment =
                                fileStorageService.storeFile(customFile, "PROJECT", pDto.getId() != null ? pDto.getId() : "PROJECT", profile.getFullName());
                        img = "/api/files/" + attachment.getId() + "/preview";
                    } catch (Exception ignored) {}
                }

                String pTitle = (pDto.getTitle() != null && !pDto.getTitle().isBlank()) ? pDto.getTitle() : "Featured Project";
                String pCategory = pDto.getCategory() != null ? pDto.getCategory() : "";
                String pYear = (pDto.getYear() != null && !pDto.getYear().isBlank()) ? pDto.getYear() : "2024";
                String pImg = img != null ? img : "";
                String pId = (pDto.getId() != null && !pDto.getId().isBlank()) ? pDto.getId() : "p-" + java.util.UUID.randomUUID().toString().substring(0, 8);

                if (existingMap.containsKey(pId)) {
                    FeaturedProject existing = existingMap.get(pId);
                    existing.setTitle(pTitle);
                    existing.setCategory(pCategory);
                    existing.setYear(pYear);
                    existing.setImageUri(pImg);
                    updatedList.add(existing);
                } else {
                    FeaturedProject newFp = new FeaturedProject(pId, pTitle, pCategory, pYear, pImg);
                    newFp.setProfile(profile);
                    updatedList.add(newFp);
                }
            }

            profile.getFeaturedProjects().clear();
            profile.getFeaturedProjects().addAll(updatedList);
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

    @Transactional
    public void deleteProfileById(Long id) {
        logger.info("[FREELANCER PROFILE DELETE REQUEST] Initiating deletion for Profile ID: {}", id);
        FreelancerProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("[FREELANCER PROFILE DELETE WARN] Profile not found with ID: {}", id);
                    return new ResourceNotFoundException("FreelancerProfile not found with id: " + id);
                });

        logger.info("[FREELANCER PROFILE DELETE PROCESS] Profile record found: ID={}, Email={}, Name={}. Executing database delete.", profile.getId(), profile.getEmail(), profile.getFullName());
        String email = profile.getEmail();
        profileRepository.delete(profile);

        if (email != null && !email.isBlank()) {
            userRepository.findByEmailIgnoreCase(email.trim().toLowerCase())
                    .ifPresent(u -> {
                        logger.info("[FREELANCER PROFILE DELETE PROCESS] Removing matching User entity with Email: {}", u.getEmail());
                        userRepository.delete(u);
                    });
        }
        logger.info("[FREELANCER PROFILE DELETE SUCCESS] Profile ID: {} permanently deleted from database.", id);
    }

    @Transactional
    public void deleteProfileByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResourceNotFoundException("Email cannot be empty for profile deletion");
        }
        String cleanEmail = email.trim().toLowerCase();
        logger.info("[FREELANCER PROFILE DELETE REQUEST] Initiating deletion for Email: {}", cleanEmail);
        
        boolean deletedAny = false;

        profileRepository.findByEmailIgnoreCase(cleanEmail).ifPresent(profile -> {
            logger.info("[FREELANCER PROFILE DELETE PROCESS] Profile record found: ID={}, Email={}. Executing database delete.", profile.getId(), profile.getEmail());
            profileRepository.delete(profile);
        });

        userRepository.findByEmailIgnoreCase(cleanEmail).ifPresent(user -> {
            logger.info("[FREELANCER PROFILE DELETE PROCESS] Removing matching User entity with Email: {}", user.getEmail());
            userRepository.delete(user);
            userRepository.flush();
        });
        
        logger.info("[FREELANCER PROFILE DELETE SUCCESS] Profile for Email: {} permanently deleted from database.", cleanEmail);
    }
}
