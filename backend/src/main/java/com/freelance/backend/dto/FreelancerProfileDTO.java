package com.freelance.backend.dto;

import java.util.List;

public class FreelancerProfileDTO {
    private String email;
    private String fullName;
    private String title;
    private String avatarUrl;
    private Double rating;
    private Integer reviewCount;
    private Integer completedProjects;
    private Double hourlyRate;
    private String status;
    private String about;
    private String location;
    private String phone;
    private String experience;
    private String education;
    private List<String> skills;
    private List<FeaturedProjectDTO> featuredProjects;

    public FreelancerProfileDTO() {}

    public static class FeaturedProjectDTO {
        private String id;
        private String title;
        private String category;
        private String year;
        private String imageUri;

        public FeaturedProjectDTO() {}

        public FeaturedProjectDTO(String id, String title, String category, String year, String imageUri) {
            this.id = id;
            this.title = title;
            this.category = category;
            this.year = year;
            this.imageUri = imageUri;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getYear() { return year; }
        public void setYear(String year) { this.year = year; }
        public String getImageUri() { return imageUri; }
        public void setImageUri(String imageUri) { this.imageUri = imageUri; }
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public Integer getReviewCount() { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }
    public Integer getCompletedProjects() { return completedProjects; }
    public void setCompletedProjects(Integer completedProjects) { this.completedProjects = completedProjects; }
    public Double getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(Double hourlyRate) { this.hourlyRate = hourlyRate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAbout() { return about; }
    public void setAbout(String about) { this.about = about; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }
    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }
    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }
    public List<FeaturedProjectDTO> getFeaturedProjects() { return featuredProjects; }
    public void setFeaturedProjects(List<FeaturedProjectDTO> featuredProjects) { this.featuredProjects = featuredProjects; }
}