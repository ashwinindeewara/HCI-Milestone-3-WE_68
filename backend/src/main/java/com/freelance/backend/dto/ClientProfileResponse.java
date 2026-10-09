package com.freelance.backend.dto;

import com.freelance.backend.entity.SkillType;

import java.util.Set;

public class ClientProfileResponse {

    private Long userId;
    private String fullName;
    private String email;
    private String profileImageUrl;

    private String location;
    private String companyName;
    private String about;
    private String status;

    private Integer memberSince;
    private Integer projectsPosted;

    private Set<SkillType> skills;

    public ClientProfileResponse() {
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getAbout() {
        return about;
    }

    public void setAbout(String about) {
        this.about = about;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getMemberSince() {
        return memberSince;
    }

    public void setMemberSince(Integer memberSince) {
        this.memberSince = memberSince;
    }

    public Integer getProjectsPosted() {
        return projectsPosted;
    }

    public void setProjectsPosted(Integer projectsPosted) {
        this.projectsPosted = projectsPosted;
    }

    public Set<SkillType> getSkills() {
        return skills;
    }

    public void setSkills(Set<SkillType> skills) {
        this.skills = skills;
    }
}
