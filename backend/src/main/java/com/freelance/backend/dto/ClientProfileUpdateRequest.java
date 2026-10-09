package com.freelance.backend.dto;

import com.freelance.backend.entity.SkillType;

import java.util.Set;

public class ClientProfileUpdateRequest {

    private String location;
    private String companyName;
    private String about;
    private Set<SkillType> skills;

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

    public Set<SkillType> getSkills() {
        return skills;
    }

    public void setSkills(Set<SkillType> skills) {
        this.skills = skills;
    }
}
