package com.freelance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "client_profiles")
public class ClientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * One user can have one client profile.
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 100)
    private String location;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(columnDefinition = "TEXT")
    private String about;

    /**
     * Date the client profile was created/registered.
     * Can be used for "MEMBER SINCE".
     */
    @Column(name = "member_since", nullable = false)
    private LocalDate memberSince;

    /**
     * Example: AVAILABLE / UNAVAILABLE
     */
    @Column(nullable = false, length = 30)
    private String status = "AVAILABLE";

    /**
     * Number of projects posted by the client.
     *
     * This can be stored, but it is usually better
     * to calculate it from the projects table.
     */
    @Column(name = "projects_posted")
    private Integer projectsPosted = 0;

    /**
     * Skills such as:
     * Figma, UI Design, UX Research, Prototyping
     */
    @ElementCollection
    @CollectionTable(
            name = "client_skills",
            joinColumns = @JoinColumn(name = "client_profile_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "skill", nullable = false)
    private Set<SkillType> skills = new HashSet<>();

    public ClientProfile() {
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public LocalDate getMemberSince() {
        return memberSince;
    }

    public void setMemberSince(LocalDate memberSince) {
        this.memberSince = memberSince;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
