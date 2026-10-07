package com.freelance.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "featured_projects")
public class FeaturedProject {

    @Id
    private String id;

    @Column(columnDefinition = "TEXT")
    private String title = "";

    @Column(columnDefinition = "TEXT")
    private String category = "";

    @Column(name = "project_year")
    private String year = "2024";

    @Column(name = "image_uri", columnDefinition = "TEXT")
    private String imageUri = "";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id")
    @JsonIgnore
    private FreelancerProfile profile;

    public FeaturedProject() {}

    public FeaturedProject(String id, String title, String category, String year, String imageUri) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.year = year;
        this.imageUri = imageUri;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getImageUri() {
        return imageUri;
    }

    public void setImageUri(String imageUri) {
        this.imageUri = imageUri;
    }

    public FreelancerProfile getProfile() {
        return profile;
    }

    public void setProfile(FreelancerProfile profile) {
        this.profile = profile;
    }
}
