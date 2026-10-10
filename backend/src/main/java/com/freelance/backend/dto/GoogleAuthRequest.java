package com.freelance.backend.dto;

import com.freelance.backend.entity.UserRole;

public class GoogleAuthRequest {
    private String email;
    private String name;
    private String idToken;
    private UserRole role;

    public GoogleAuthRequest() {}

    public GoogleAuthRequest(String email, String name, String idToken, UserRole role) {
        this.email = email;
        this.name = name;
        this.idToken = idToken;
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}
