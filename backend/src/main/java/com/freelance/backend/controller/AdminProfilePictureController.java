package com.freelance.backend.controller;

import com.freelance.backend.entity.UserProfilePicture;
import com.freelance.backend.service.ProfilePictureService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/admin/profile/picture", "/api/admin/profile/picture"})
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class AdminProfilePictureController {

    private final ProfilePictureService profilePictureService;

    public AdminProfilePictureController(ProfilePictureService profilePictureService) {
        this.profilePictureService = profilePictureService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("id") Long id,
                                                      @RequestParam("file") MultipartFile file) {
        UserProfilePicture saved = profilePictureService.saveAdminPicture(id, file);
        return ResponseEntity.ok(Map.of(
                "id", id,
                "contentType", saved.getContentType(),
                "updatedAt", saved.getUpdatedAt().toString(),
                "message", "Profile picture saved."));
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> view(@PathVariable Long id) {
        return profilePictureService.getPicture(id)
                .map(p -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(p.getContentType()))
                        .cacheControl(CacheControl.noCache())
                        .header("X-Content-Type-Options", "nosniff")
                        .body(p.getData()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> remove(@PathVariable Long id) {
        profilePictureService.deleteAdminPicture(id);
        return ResponseEntity.ok(Map.of("message", "Profile picture removed."));
    }
}
