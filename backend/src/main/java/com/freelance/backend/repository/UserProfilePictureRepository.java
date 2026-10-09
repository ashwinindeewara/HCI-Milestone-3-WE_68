package com.freelance.backend.repository;

import com.freelance.backend.entity.UserProfilePicture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserProfilePictureRepository extends JpaRepository<UserProfilePicture, Long> {
}
