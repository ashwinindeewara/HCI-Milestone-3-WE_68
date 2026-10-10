package com.freelance.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class FreelancerListingDTO {
    private final Long id;
    private final String fullName;
    private final String title;
    private final Double rating;
    private final Integer completedProjects;
    private final Double hourlyRate;
    private final String status;
    private final List<String> skills = new ArrayList<>();

    public FreelancerListingDTO(Long id, String fullName, String title, Double rating,
                                Integer completedProjects, Double hourlyRate, String status) {
        this.id = id;
        this.fullName = fullName;
        this.title = title;
        this.rating = rating;
        this.completedProjects = completedProjects;
        this.hourlyRate = hourlyRate;
        this.status = status;
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getTitle() { return title; }
    public Double getRating() { return rating; }
    public Integer getCompletedProjects() { return completedProjects; }
    public Double getHourlyRate() { return hourlyRate; }
    public String getStatus() { return status; }
    public List<String> getSkills() { return skills; }

    public void addSkill(String skill) {
        if (skill != null) {
            skills.add(skill);
        }
    }
}
