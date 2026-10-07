package com.freelance.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class DatabaseSchemaMigrator implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        String[] alterStatements = new String[]{
            "ALTER TABLE featured_projects ALTER COLUMN category TYPE TEXT",
            "ALTER TABLE featured_projects ALTER COLUMN title TYPE TEXT",
            "ALTER TABLE featured_projects ALTER COLUMN image_uri TYPE TEXT",
            "ALTER TABLE freelancer_profiles ALTER COLUMN experience TYPE TEXT",
            "ALTER TABLE freelancer_profiles ALTER COLUMN education TYPE TEXT",
            "ALTER TABLE freelancer_profiles ALTER COLUMN about TYPE TEXT",
            "ALTER TABLE freelancer_profiles ALTER COLUMN avatar_url TYPE TEXT",
            "ALTER TABLE disputes ALTER COLUMN description TYPE TEXT",
            "ALTER TABLE disputes ALTER COLUMN evidence_file TYPE TEXT",
            "ALTER TABLE disputes ALTER COLUMN resolution_note TYPE TEXT",
            "ALTER TABLE file_attachments ALTER COLUMN data TYPE TEXT",
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255)",
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255)",
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255)"
        };

        for (String sql : alterStatements) {
            try {
                jdbcTemplate.execute(sql);
                System.out.println("[DB MIGRATION] Executed: " + sql);
            } catch (Exception e) {
                System.out.println("[DB MIGRATION] Note: " + sql + " -> " + e.getMessage());
            }
        }
    }
}
