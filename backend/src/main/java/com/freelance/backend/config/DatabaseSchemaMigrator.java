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
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_role VARCHAR(32)",
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255)",
            "UPDATE notifications SET recipient_role = CASE UPPER(type) WHEN 'CONTRACT_RECEIVED' THEN 'FREELANCER' WHEN 'CONTRACT_ACTIVE' THEN 'FREELANCER' WHEN 'CONTRACT_ACCEPTED' THEN 'FREELANCER' WHEN 'CONTRACT_SIGNED' THEN 'CLIENT' WHEN 'CONTRACT_REJECTED' THEN 'CLIENT' WHEN 'DELIVERABLE_SUBMITTED' THEN 'CLIENT' WHEN 'DELIVERABLE_APPROVED' THEN 'FREELANCER' WHEN 'DELIVERABLE_REJECTED' THEN 'FREELANCER' WHEN 'PAYMENT_READY_TO_WITHDRAW' THEN 'FREELANCER' WHEN 'DISPUTE_CREATED' THEN 'CLIENT' WHEN 'PAYMENT_ESCROW' THEN 'FREELANCER' ELSE recipient_role END WHERE recipient_role IS NULL",
            "UPDATE notifications n SET recipient_role = UPPER(CAST(u.role AS TEXT)) FROM users u WHERE n.recipient_role IS NULL AND n.recipient_email IS NOT NULL AND LOWER(TRIM(n.recipient_email)) = LOWER(TRIM(u.email)) AND UPPER(CAST(u.role AS TEXT)) IN ('CLIENT', 'FREELANCER')",
            "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS freelancer_email VARCHAR(255)",
            "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_email VARCHAR(255)",
            "UPDATE contracts c SET freelancer_email = u.email FROM users u WHERE c.freelancer_email IS NULL AND LOWER(TRIM(c.freelancer_name)) = LOWER(TRIM(u.full_name)) AND UPPER(CAST(u.role AS TEXT)) = 'FREELANCER' AND (SELECT COUNT(*) FROM users u2 WHERE LOWER(TRIM(u2.full_name)) = LOWER(TRIM(c.freelancer_name)) AND UPPER(CAST(u2.role AS TEXT)) = 'FREELANCER') = 1",
            "UPDATE contracts c SET client_email = u.email FROM users u WHERE c.client_email IS NULL AND (LOWER(TRIM(c.client_name)) = LOWER(TRIM(u.full_name)) OR LOWER(TRIM(c.client_name)) = LOWER(TRIM(u.company))) AND UPPER(CAST(u.role AS TEXT)) = 'CLIENT' AND (SELECT COUNT(*) FROM users u2 WHERE (LOWER(TRIM(c.client_name)) = LOWER(TRIM(u2.full_name)) OR LOWER(TRIM(c.client_name)) = LOWER(TRIM(u2.company))) AND UPPER(CAST(u2.role AS TEXT)) = 'CLIENT') = 1",
            "ALTER TABLE projects ADD COLUMN IF NOT EXISTS freelancer_email VARCHAR(255)",
            "UPDATE projects p SET freelancer_email = c.freelancer_email FROM contracts c WHERE p.freelancer_email IS NULL AND p.contract_id = c.id AND c.freelancer_email IS NOT NULL"
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
