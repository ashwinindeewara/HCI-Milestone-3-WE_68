package com.freelance.backend.repository;

import com.freelance.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByFullNameIgnoreCase(String fullName);
    java.util.List<User> findAllByFullNameIgnoreCase(String fullName);
    boolean existsByEmail(String email);
}
