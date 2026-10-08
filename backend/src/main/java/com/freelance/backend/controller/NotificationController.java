package com.freelance.backend.controller;

import com.freelance.backend.entity.Notification;
import com.freelance.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(
            @RequestParam(required = false) String freelancerName,
            @RequestParam(required = false) String freelancerEmail,
            @RequestParam(required = false) String email
    ) {
        String effectiveEmail = (freelancerEmail != null && !freelancerEmail.isBlank())
                ? freelancerEmail.trim()
                : (email != null ? email.trim() : "");
        if ((freelancerName != null && !freelancerName.isBlank()) || !effectiveEmail.isBlank()) {
            String name = freelancerName != null ? freelancerName.trim() : "";
            boolean isChathuni = name.toLowerCase().contains("chathuni") || effectiveEmail.toLowerCase().contains("chathuni");

            List<Notification> userNotifs = notificationRepository.findForUser(name, effectiveEmail, isChathuni);
            return ResponseEntity.ok(userNotifs);
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notification> getNotificationById(@PathVariable Long id) {
        return notificationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @RequestMapping(value = "/{id}/read", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return notificationRepository.findById(id)
                .map(n -> {
                    n.setUnread(false);
                    return ResponseEntity.ok(notificationRepository.save(n));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @RequestMapping(value = "/read-all", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<Void> markAllAsRead() {
        List<Notification> list = notificationRepository.findAll();
        for (Notification n : list) {
            n.setUnread(false);
        }
        notificationRepository.saveAll(list);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
