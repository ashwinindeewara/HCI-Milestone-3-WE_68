package com.freelance.backend.repository;

import com.freelance.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByOrderByIdDesc();

    List<Notification> findByRecipientNameIgnoreCaseOrderByIdDesc(String recipientName);

        @Query("SELECT n FROM Notification n WHERE " +
            "((:email IS NOT NULL AND TRIM(:email) <> '' AND n.recipientEmail IS NOT NULL AND LOWER(TRIM(n.recipientEmail)) = LOWER(TRIM(:email))) OR " +
            "((:email IS NULL OR TRIM(:email) = '') AND n.recipientName IS NOT NULL AND LOWER(TRIM(n.recipientName)) = LOWER(TRIM(:name))) OR " +
            "(:isChathuni = true AND n.recipientEmail IS NULL AND (n.recipientName IS NULL OR LOWER(n.recipientName) LIKE '%chathuni%'))) " +
           "ORDER BY n.id DESC")
    List<Notification> findForUser(@Param("name") String name, @Param("email") String email, @Param("isChathuni") boolean isChathuni);
}
