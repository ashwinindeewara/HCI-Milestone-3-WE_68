package com.freelance.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false, unique = true)
    private User user;

    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "degree_programme")
    private String degreeProgramme;

    @Column(name = "specialization")
    private String specialization;

    @Column(name = "year_of_study")
    private String yearOfStudy;

    @Column(name = "location")
    private String location;

    @Column(name = "about", length = 1000)
    private String about;

    @Column(name = "company")
    private String company;

    @Column(name = "experience")
    private String experience;

    public Student() {}

    public Student(User user, String registrationNumber, String degreeProgramme, String specialization, String yearOfStudy, String location, String about, String company, String experience) {
        this.user = user;
        this.registrationNumber = registrationNumber;
        this.degreeProgramme = degreeProgramme;
        this.specialization = specialization;
        this.yearOfStudy = yearOfStudy;
        this.location = location;
        this.about = about;
        this.company = company;
        this.experience = experience;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getDegreeProgramme() {
        return degreeProgramme;
    }

    public void setDegreeProgramme(String degreeProgramme) {
        this.degreeProgramme = degreeProgramme;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getYearOfStudy() {
        return yearOfStudy;
    }

    public void setYearOfStudy(String yearOfStudy) {
        this.yearOfStudy = yearOfStudy;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAbout() {
        return about;
    }

    public void setAbout(String about) {
        this.about = about;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }
}
