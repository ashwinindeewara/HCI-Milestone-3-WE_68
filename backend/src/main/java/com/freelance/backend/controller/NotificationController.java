package com.freelance.backend.controller;

import com.freelance.backend.entity.Notification;
import com.freelance.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(
            @RequestParam(required = false) String freelancerName,
            @RequestParam(required = false) String freelancerEmail,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String clientName,
            @RequestParam(required = false) String recipientRole
    ) {
        String role = recipientRole == null || recipientRole.isBlank()
                ? "FREELANCER"
                : recipientRole.trim().toUpperCase();
        if (!role.equals("CLIENT") && !role.equals("FREELANCER")) {
            return ResponseEntity.badRequest().build();
        }
        String effectiveEmail = (freelancerEmail != null && !freelancerEmail.isBlank())
                ? freelancerEmail.trim()
                : (email != null ? email.trim() : "");
        String effectiveName = (clientName != null && !clientName.isBlank())
                ? clientName.trim()
                : (freelancerName == null ? "" : freelancerName.trim());
        if (!effectiveName.isBlank() || !effectiveEmail.isBlank()) {
            boolean isChathuni = role.equals("FREELANCER")
                    && (effectiveName.toLowerCase().contains("chathuni") || effectiveEmail.toLowerCase().contains("chathuni"));

            List<Notification> userNotifs = notificationRepository.findForUser(effectiveName, effectiveEmail, isChathuni, role);
            return ResponseEntity.ok(userNotifs);
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notification> getNotificationById(
            @PathVariable Long id,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "FREELANCER") String recipientRole
    ) {
        String role = recipientRole.trim().toUpperCase();
        if (!role.equals("CLIENT") && !role.equals("FREELANCER")) {
            return ResponseEntity.badRequest().build();
        }
        return notificationRepository.findForUser(
                        name == null ? "" : name,
                        email == null ? "" : email,
                        false,
                        role
                ).stream()
                .filter(notification -> notification.getId().equals(id))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @RequestMapping(value = "/{id}/read", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<Notification> markAsRead(
            @PathVariable Long id,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "FREELANCER") String recipientRole
    ) {
        String role = recipientRole.trim().toUpperCase();
        if (!role.equals("CLIENT") && !role.equals("FREELANCER")) {
            return ResponseEntity.badRequest().build();
        }
        return notificationRepository.findForUser(
                        name == null ? "" : name,
                        email == null ? "" : email,
                        false,
                        role
                ).stream()
                .filter(notification -> notification.getId().equals(id))
                .findFirst()
                .map(notification -> {
                    notification.setUnread(false);
                    return ResponseEntity.ok(notificationRepository.save(notification));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @RequestMapping(value = "/read-all", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<Void> markAllAsRead(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "FREELANCER") String recipientRole
    ) {
        String role = recipientRole.trim().toUpperCase();
        if (!role.equals("CLIENT") && !role.equals("FREELANCER")) {
            return ResponseEntity.badRequest().build();
        }
        List<Notification> list = notificationRepository.findForUser(
                name == null ? "" : name,
                email == null ? "" : email,
                false,
                role
        );
        for (Notification n : list) {
            n.setUnread(false);
        }
        notificationRepository.saveAll(list);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "FREELANCER") String recipientRole
    ) {
        String role = recipientRole.trim().toUpperCase();
        if (!role.equals("CLIENT") && !role.equals("FREELANCER")) {
            return ResponseEntity.badRequest().build();
        }
        return notificationRepository.findForUser(
                        name == null ? "" : name,
                        email == null ? "" : email,
                        false,
                        role
                ).stream()
                .filter(notification -> notification.getId().equals(id))
                .findFirst()
                .map(notification -> {
                    notificationRepository.delete(notification);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
