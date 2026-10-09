package com.freelance.backend.service;

import com.freelance.backend.entity.User;
import com.freelance.backend.entity.UserRole;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.UserRepository;
import com.freelance.backend.repository.ClientProfileRepository;
import com.freelance.backend.repository.FreelancerProfileRepository;
import com.freelance.backend.repository.StudentRepository;
import com.freelance.backend.repository.UserProfilePictureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final StudentRepository studentRepository;
    private final UserProfilePictureRepository userProfilePictureRepository;

    public UserService(
            UserRepository userRepository,
            ClientProfileRepository clientProfileRepository,
            FreelancerProfileRepository freelancerProfileRepository,
            StudentRepository studentRepository,
            UserProfilePictureRepository userProfilePictureRepository
    ) {
        this.userRepository = userRepository;
        this.clientProfileRepository = clientProfileRepository;
        this.freelancerProfileRepository = freelancerProfileRepository;
        this.studentRepository = studentRepository;
        this.userProfilePictureRepository = userProfilePictureRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public User updateUserStatus(Long id, String status) {
        User user = getUserById(id);
        user.setStatus(status);
        return userRepository.save(user);
    }

    public User updateUserRole(Long id, UserRole role) {
        User user = getUserById(id);
        user.setRole(role);
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }

    @Transactional
    public void deleteUserByEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        clientProfileRepository.findByUserId(user.getId()).ifPresent(clientProfileRepository::delete);
        studentRepository.findByUserId(user.getId()).ifPresent(studentRepository::delete);
        userProfilePictureRepository.deleteById(user.getId());
        freelancerProfileRepository.findByEmailIgnoreCase(user.getEmail())
                .ifPresent(freelancerProfileRepository::delete);
        userRepository.delete(user);
    }
}
