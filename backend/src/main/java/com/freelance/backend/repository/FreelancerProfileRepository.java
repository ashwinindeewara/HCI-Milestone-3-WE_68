package com.freelance.backend.repository;

import com.freelance.backend.entity.FreelancerProfile;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FreelancerProfileRepository extends JpaRepository<FreelancerProfile, Long> {
    @Query(value = """
            SELECT p.id AS "id",
                   p.full_name AS "fullName",
                   p.title AS "title",
                   p.rating AS "rating",
                   p.completed_projects AS "completedProjects",
                   p.hourly_rate AS "hourlyRate",
                   p.status AS "status",
                   s.skill AS "skill"
            FROM freelancer_profiles p
            LEFT JOIN freelancer_skills s ON s.profile_id = p.id
            ORDER BY p.id, s.skill
            """, nativeQuery = true)
    List<FreelancerProfileListingRow> findAllForListing();

    Optional<FreelancerProfile> findByEmail(String email);
    Optional<FreelancerProfile> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);

    interface FreelancerProfileListingRow {
        Long getId();
        String getFullName();
        String getTitle();
        Double getRating();
        Integer getCompletedProjects();
        Double getHourlyRate();
        String getStatus();
        String getSkill();
    }
}
