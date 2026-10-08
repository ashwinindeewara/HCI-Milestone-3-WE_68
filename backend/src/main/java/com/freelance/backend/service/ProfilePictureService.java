package com.freelance.backend.service;

import com.freelance.backend.entity.User;
import com.freelance.backend.entity.UserProfilePicture;
import com.freelance.backend.entity.UserRole;
import com.freelance.backend.exception.BadRequestException;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.UserProfilePictureRepository;
import com.freelance.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

@Service
public class ProfilePictureService {

    static final long MAX_BYTES = 5L * 1024 * 1024;

    private final UserRepository userRepository;
    private final UserProfilePictureRepository pictureRepository;

    public ProfilePictureService(UserRepository userRepository, UserProfilePictureRepository pictureRepository) {
        this.userRepository = userRepository;
        this.pictureRepository = pictureRepository;
    }

    @Transactional
    public UserProfilePicture saveAdminPicture(Long userId, MultipartFile file) {
        requireAdmin(userId);

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please choose an image to upload.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("File is too large. Maximum size is 5 MB.");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("The uploaded file could not be read.");
        }

        // Trust the file's real content, not the client-supplied name or content type
        String contentType = detectImageType(bytes);
        if (contentType == null) {
            throw new BadRequestException("Unsupported file. Please upload a JPG, PNG, GIF or WEBP image.");
        }

        return pictureRepository.save(new UserProfilePicture(userId, contentType, bytes));
    }

    @Transactional(readOnly = true)
    public Optional<UserProfilePicture> getPicture(Long userId) {
        return pictureRepository.findById(userId);
    }

    @Transactional
    public void deleteAdminPicture(Long userId) {
        requireAdmin(userId);
        if (pictureRepository.existsById(userId)) {
            pictureRepository.deleteById(userId);
        }
    }

    private void requireAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        if (user.getRole() != UserRole.ADMIN) {
            throw new BadRequestException("Only administrator accounts can change this profile picture.");
        }
    }

    private static String detectImageType(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "image/png";
        }
        if (b.length >= 6 && b[0] == 'G' && b[1] == 'I' && b[2] == 'F' && b[3] == '8'
                && (b[4] == '7' || b[4] == '9') && b[5] == 'a') {
            return "image/gif";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        return null;
    }
}
