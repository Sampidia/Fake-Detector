-- Enable PostgreSQL trgm extension for fuzzy text search
-- Run this before applying Prisma migrations

-- Connect to your database and execute:
-- psql -d your_database_name -f enable-pg-trgm.sql

-- Create the trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify extension is installed
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name LIKE '%pg_trgm%'
OR name LIKE '%trigram%';

-- Test trigram functionality
-- SELECT 'paracetamol' % 'parnotin' AS similarity_test;
-- This should work with the pg_trgm extension installed
