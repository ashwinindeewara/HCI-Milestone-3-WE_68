package com.freelance.backend.controller;

import com.freelance.backend.dto.FreelancerProfileDTO;
import com.freelance.backend.dto.FreelancerListingDTO;
import com.freelance.backend.entity.FreelancerProfile;
import com.freelance.backend.service.FreelancerProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/freelancer/profile")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class FreelancerProfileController {

    @Autowired
    private FreelancerProfileService profileService;

    @GetMapping
    public ResponseEntity<FreelancerProfile> getProfile(
            @RequestParam(value = "id", required = false) Long id,
            @RequestParam(value = "email", required = false) String email
    ) {
        if (id != null) {
            return ResponseEntity.ok(profileService.getProfileById(id));
        }
        if (email != null && !email.isBlank()) {
            return ResponseEntity.ok(profileService.getProfileByEmail(email));
        }
        return ResponseEntity.ok(profileService.getDefaultProfile());
    }

    @GetMapping("/all")
    public ResponseEntity<List<FreelancerListingDTO>> getAllProfiles() {
        List<FreelancerListingDTO> profiles = profileService.getAllFreelancerProfiles();
        return ResponseEntity.ok(profiles);
    }

    @GetMapping("/{email}")
    public ResponseEntity<FreelancerProfile> getProfileByEmail(@PathVariable String email) {
        return ResponseEntity.ok(profileService.getProfileByEmail(email));
    }

    @PutMapping
    public ResponseEntity<FreelancerProfile> updateDefaultProfile(
            @RequestParam(value = "email", required = false) String emailParam,
            @RequestBody FreelancerProfileDTO dto
    ) {
        String email = (emailParam != null && !emailParam.isBlank())
                ? emailParam
                : dto.getEmail();
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(profileService.updateProfile(email.trim().toLowerCase(), dto));
    }

    @PutMapping("/{email}")
    public ResponseEntity<FreelancerProfile> updateProfileByEmail(@PathVariable String email, @RequestBody FreelancerProfileDTO dto) {
        return ResponseEntity.ok(profileService.updateProfile(email.trim().toLowerCase(), dto));
    }

    @PostMapping("/skills")
    public ResponseEntity<FreelancerProfile> addSkill(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String skill = payload.get("skill");
        return ResponseEntity.ok(profileService.addSkill(email.trim().toLowerCase(), skill));
    }

    @DeleteMapping("/skills")
    public ResponseEntity<FreelancerProfile> removeSkill(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String skill = payload.get("skill");
        return ResponseEntity.ok(profileService.removeSkill(email.trim().toLowerCase(), skill));
    }

    @PostMapping("/image")
    public ResponseEntity<FreelancerProfile> uploadImage(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "email", required = false) String emailParam,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        String email = emailParam;
        if (email == null || email.isBlank()) {
            email = request.getParameter("email");
        }
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(profileService.uploadProfileImage(email.trim().toLowerCase(), file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfileById(@PathVariable Long id) {
        profileService.deleteProfileById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteProfile(
            @RequestParam(value = "id", required = false) Long id,
            @RequestParam(value = "email", required = false) String email
    ) {
        if (id != null) {
            profileService.deleteProfileById(id);
        } else if (email != null && !email.isBlank()) {
            profileService.deleteProfileByEmail(email);
        } else {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.noContent().build();
    }
}
