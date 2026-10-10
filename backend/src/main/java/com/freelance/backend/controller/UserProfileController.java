package com.freelance.backend.controller;

import com.freelance.backend.dto.UpdateProfileRequest;
import com.freelance.backend.dto.UserProfileDTO;
import com.freelance.backend.service.UserProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/profile", "/api/profile"})
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class UserProfileController {

    @Autowired
    private UserProfileService userProfileService;

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userProfileService.getUserProfile(id));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserProfileDTO> getUserProfileByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userProfileService.getUserProfileByEmail(email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserProfileDTO> updateProfilePut(@PathVariable Long id, @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userProfileService.updateUserProfile(id, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserProfileDTO> updateProfilePatch(@PathVariable Long id, @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userProfileService.updateUserProfile(id, request));
    }

    @PutMapping
    public ResponseEntity<UserProfileDTO> updateProfileQuery(@RequestParam(defaultValue = "1") Long userId, @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userProfileService.updateUserProfile(userId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserProfile(@PathVariable Long id) {
        userProfileService.deleteUserProfile(id);
        return ResponseEntity.noContent().build();
    }
}
