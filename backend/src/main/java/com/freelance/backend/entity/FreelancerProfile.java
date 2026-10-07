package com.freelance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "freelancer_profiles")
public class FreelancerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String title = "";

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(nullable = false)
    private Double rating = 0.0;

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount = 0;

    @Column(name = "completed_projects", nullable = false)
    private Integer completedProjects = 0;

    @Column(name = "hourly_rate", nullable = false)
    private Double hourlyRate = 0.0;

    @Column(nullable = false)
    private String status = "Available";

    @Column(columnDefinition = "TEXT")
    private String about = "";

    private String location = "";
    private String phone = "";
    @Column(columnDefinition = "TEXT")
    private String experience = "";
    @Column(columnDefinition = "TEXT")
    private String education = "";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "freelancer_skills", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "skill")
    private List<String> skills = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<FeaturedProject> featuredProjects = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public FreelancerProfile() {}

    public FreelancerProfile(String email, String fullName) {
        this.email = email;
        this.fullName = fullName;
        this.title = "";
        this.avatarUrl = null;
        this.rating = 0.0;
        this.reviewCount = 0;
        this.completedProjects = 0;
        this.hourlyRate = 0.0;
        this.status = "Available";
        this.about = "";
        this.location = "";
        this.phone = "";
        this.experience = "";
        this.education = "";
        this.skills = new ArrayList<>();
        this.featuredProjects = new ArrayList<>();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public FreelancerProfile(String email, String fullName, String title, String avatarUrl,
                             Double rating, Integer reviewCount, Integer completedProjects,
                             Double hourlyRate, String status, String about) {
        this.email = email;
        this.fullName = fullName;
        this.title = title != null ? title : "";
        this.avatarUrl = avatarUrl;
        this.rating = rating != null ? rating : 0.0;
        this.reviewCount = reviewCount != null ? reviewCount : 0;
        this.completedProjects = completedProjects != null ? completedProjects : 0;
        this.hourlyRate = hourlyRate != null ? hourlyRate : 0.0;
        this.status = status != null ? status : "Available";
        this.about = about != null ? about : "";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void addProject(FeaturedProject project) {
        featuredProjects.add(project);
        project.setProfile(this);
    }

    public void removeProject(FeaturedProject project) {
        featuredProjects.remove(project);
        project.setProfile(null);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Integer getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(Integer reviewCount) {
        this.reviewCount = reviewCount;
    }

    public Integer getCompletedProjects() {
        return completedProjects;
    }

    public void setCompletedProjects(Integer completedProjects) {
        this.completedProjects = completedProjects;
    }

    public Double getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(Double hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAbout() {
        return about;
    }

    public void setAbout(String about) {
        this.about = about;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public List<FeaturedProject> getFeaturedProjects() {
        return featuredProjects;
    }

    public void setFeaturedProjects(List<FeaturedProject> featuredProjects) {
        this.featuredProjects = featuredProjects;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public String getEducation() {
        return education;
    }

    public void setEducation(String education) {
        this.education = education;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
