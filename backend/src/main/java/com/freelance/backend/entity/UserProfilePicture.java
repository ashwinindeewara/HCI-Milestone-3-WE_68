package com.freelance.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Profile picture bytes, kept in their own table so the users list never has to load image data.
 * One row per user; the primary key is the user's id.
 */
@Entity
@Table(name = "user_profile_pictures")
public class UserProfilePicture {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    // VARBINARY maps to bytea on PostgreSQL (not a large-object oid), and to varbinary on H2
    // length must cover the 5 MB upload cap enforced in ProfilePictureService (default would be 255 bytes)
    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(name = "data", nullable = false, length = 10_485_760)
    private byte[] data;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public UserProfilePicture() {}

    public UserProfilePicture(Long userId, String contentType, byte[] data) {
        this.userId = userId;
        this.contentType = contentType;
        this.data = data;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public byte[] getData() {
        return data;
    }

    public void setData(byte[] data) {
        this.data = data;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
