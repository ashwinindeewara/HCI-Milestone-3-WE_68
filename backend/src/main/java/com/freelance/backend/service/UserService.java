package com.freelance.backend.service;

import com.freelance.backend.entity.User;
import com.freelance.backend.entity.UserRole;
import com.freelance.backend.exception.ResourceNotFoundException;
import com.freelance.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
}
