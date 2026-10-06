package com.freelance.backend.controller;

import com.freelance.backend.dto.FreelancerProfileDTO;
import com.freelance.backend.entity.FreelancerProfile;
import com.freelance.backend.service.FreelancerProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/freelancer/profile")
@CrossOrigin(origins = "*")
public class FreelancerProfileController {

    @Autowired
    private FreelancerProfileService profileService;

    @GetMapping
    public ResponseEntity<FreelancerProfile> getDefaultProfile() {
        return ResponseEntity.ok(profileService.getDefaultProfile());
    }

    @GetMapping("/{email}")
    public ResponseEntity<FreelancerProfile> getProfileByEmail(@PathVariable String email) {
        return ResponseEntity.ok(profileService.getProfileByEmail(email));
    }

    @PutMapping
    public ResponseEntity<FreelancerProfile> updateDefaultProfile(@RequestBody FreelancerProfileDTO dto) {
        String email = (dto.getEmail() != null && !dto.getEmail().isBlank()) ? dto.getEmail() : "chathuniimalsha.com";
        return ResponseEntity.ok(profileService.updateProfile(email, dto));
    }

    @PutMapping("/{email}")
    public ResponseEntity<FreelancerProfile> updateProfileByEmail(@PathVariable String email, @RequestBody FreelancerProfileDTO dto) {
        return ResponseEntity.ok(profileService.updateProfile(email, dto));
    }

    @PostMapping("/skills")
    public ResponseEntity<FreelancerProfile> addSkill(@RequestBody Map<String, String> payload) {
        String email = payload.getOrDefault("email", "chathuniimalsha.com");
        String skill = payload.get("skill");
        return ResponseEntity.ok(profileService.addSkill(email, skill));
    }

    @DeleteMapping("/skills")
    public ResponseEntity<FreelancerProfile> removeSkill(@RequestBody Map<String, String> payload) {
        String email = payload.getOrDefault("email", "chathuniimalsha.com");
        String skill = payload.get("skill");
        return ResponseEntity.ok(profileService.removeSkill(email, skill));
    }

    @PostMapping("/image")
    public ResponseEntity<FreelancerProfile> uploadImage(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "email", required = false, defaultValue = "chathuniimalsha.com") String email
    ) {
        return ResponseEntity.ok(profileService.uploadProfileImage(email, file));
    }
}
