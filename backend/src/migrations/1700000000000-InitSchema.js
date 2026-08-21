// Hand-written initial migration — synchronize is OFF (see config/database.js),
// so this is the single source of truth for the schema. Run with:
//   npm run migration:run
module.exports = class InitSchema1700000000000 {
  name = 'InitSchema1700000000000';

  async up(queryRunner) {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ---- Enum types ----
    await queryRunner.query(
      `CREATE TYPE "users_experience_level_enum" AS ENUM ('beginner','intermediate','advanced','not_specified')`
    );
    await queryRunner.query(
      `CREATE TYPE "users_availability_enum" AS ENUM ('full_time','part_time','weekends','flexible')`
    );
    await queryRunner.query(
      `CREATE TYPE "user_portfolio_links_platform_enum" AS ENUM ('github','linkedin','website','behance','dribbble','other')`
    );
    await queryRunner.query(
      `CREATE TYPE "projects_status_enum" AS ENUM ('draft','recruiting','paused','in_progress','completed','archived')`
    );
    await queryRunner.query(
      `CREATE TYPE "project_roles_status_enum" AS ENUM ('open','full','closed')`
    );
    await queryRunner.query(
      `CREATE TYPE "applications_status_enum" AS ENUM ('pending','accepted','rejected')`
    );
    await queryRunner.query(
      `CREATE TYPE "project_members_status_enum" AS ENUM ('active','left','completed')`
    );
    await queryRunner.query(
      `CREATE TYPE "tasks_status_enum" AS ENUM ('assigned','submitted','approved','rejected')`
    );
    await queryRunner.query(`CREATE TYPE "notifications_type_enum" AS ENUM (
      'application_received','application_accepted','application_rejected',
      'workspace_link_shared','contact_expected','member_left','role_reopened',
      'task_submitted','task_approved','task_rejected','project_completed',
      'rating_request','rating_received','profile_completion_reminder'
    )`);
    await queryRunner.query(
      `CREATE TYPE "notification_preferences_type_enum" AS ENUM (
        'application_received','application_accepted','application_rejected',
        'workspace_link_shared','contact_expected','member_left','role_reopened',
        'task_submitted','task_approved','task_rejected','project_completed',
        'rating_request','rating_received','profile_completion_reminder'
      )`
    );

    // ---- users (active_project_id FK added after projects exists) ----
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "full_name" varchar(150) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "password_hash" varchar NOT NULL,
        "profile_picture_url" varchar,
        "profile_picture_public_id" varchar,
        "country" varchar(100),
        "phone_number" varchar(30),
        "date_of_birth" date,
        "bio" varchar(300),
        "experience_level" "users_experience_level_enum" NOT NULL DEFAULT 'not_specified',
        "years_of_experience" int,
        "availability" "users_availability_enum",
        "preferred_roles" text,
        "profile_complete" boolean NOT NULL DEFAULT false,
        "profile_completion_percentage" int NOT NULL DEFAULT 0,
        "active_project_id" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email")`);

    // ---- skills ----
    await queryRunner.query(`
      CREATE TABLE "skills" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL UNIQUE,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // ---- categories ----
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL UNIQUE,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // ---- user_skills ----
    await queryRunner.query(`
      CREATE TABLE "user_skills" (
        "user_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("user_id", "skill_id"),
        CONSTRAINT "fk_user_skills_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_skills_skill" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE
      )
    `);

    // ---- user_portfolio_links ----
    await queryRunner.query(`
      CREATE TABLE "user_portfolio_links" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "platform" "user_portfolio_links_platform_enum" NOT NULL,
        "url" varchar(500) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_portfolio_links_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ---- projects ----
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "title" varchar(80) NOT NULL,
        "description" text NOT NULL,
        "problem_statement" text,
        "category_id" uuid,
        "country" varchar(100),
        "expected_duration" varchar(100),
        "status" "projects_status_enum" NOT NULL DEFAULT 'draft',
        "applicant_count" int NOT NULL DEFAULT 0,
        "cover_image_url" varchar,
        "cover_image_public_id" varchar,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_projects_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_projects_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_projects_status" ON "projects" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_projects_owner" ON "projects" ("owner_id")`);
    await queryRunner.query(`CREATE INDEX "idx_projects_category" ON "projects" ("category_id")`);

    // Now that projects exists, wire up users.active_project_id.
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "fk_users_active_project" FOREIGN KEY ("active_project_id")
      REFERENCES "projects"("id") ON DELETE SET NULL
    `);

    // ---- project_technologies ----
    await queryRunner.query(`
      CREATE TABLE "project_technologies" (
        "project_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
        PRIMARY KEY ("project_id", "skill_id"),
        CONSTRAINT "fk_project_tech_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_project_tech_skill" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE
      )
    `);

    // ---- project_roles ----
    await queryRunner.query(`
      CREATE TABLE "project_roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" text,
        "openings" int NOT NULL DEFAULT 1,
        "filled_count" int NOT NULL DEFAULT 0,
        "status" "project_roles_status_enum" NOT NULL DEFAULT 'open',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_project_roles_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_project_roles_project" ON "project_roles" ("project_id")`);

    // ---- project_role_skills ----
    await queryRunner.query(`
      CREATE TABLE "project_role_skills" (
        "role_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
        PRIMARY KEY ("role_id", "skill_id"),
        CONSTRAINT "fk_role_skills_role" FOREIGN KEY ("role_id") REFERENCES "project_roles"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_role_skills_skill" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE
      )
    `);

    // ---- applications ----
    await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "applicant_id" uuid NOT NULL,
        "message" varchar(300),
        "status" "applications_status_enum" NOT NULL DEFAULT 'pending',
        "rejection_reason" text,
        "decided_by" uuid,
        "decided_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_applications_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_applications_role" FOREIGN KEY ("role_id") REFERENCES "project_roles"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_applications_applicant" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_applications_project" ON "applications" ("project_id")`);
    await queryRunner.query(`CREATE INDEX "idx_applications_applicant" ON "applications" ("applicant_id")`);
    await queryRunner.query(`CREATE INDEX "idx_applications_role" ON "applications" ("role_id")`);
    await queryRunner.query(`CREATE INDEX "idx_applications_status" ON "applications" ("status")`);

    // ---- project_members ----
    await queryRunner.query(`
      CREATE TABLE "project_members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "application_id" uuid,
        "status" "project_members_status_enum" NOT NULL DEFAULT 'active',
        "workspace_link" varchar(500),
        "workspace_link_updated_at" timestamptz,
        "joined_at" timestamptz,
        "left_at" timestamptz,
        "exit_reason" text,
        "completed_tasks_before_leaving" boolean,
        "deliverable_links" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_members_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_members_role" FOREIGN KEY ("role_id") REFERENCES "project_roles"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_members_application" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_project_members_project" ON "project_members" ("project_id")`);
    await queryRunner.query(`CREATE INDEX "idx_project_members_user" ON "project_members" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_project_members_status" ON "project_members" ("status")`);

    // ---- tasks ----
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "role_id" uuid NOT NULL,
        "assigned_member_id" uuid,
        "title" varchar(150) NOT NULL,
        "description" text,
        "status" "tasks_status_enum" NOT NULL DEFAULT 'assigned',
        "submitted_at" timestamptz,
        "reviewed_at" timestamptz,
        "reviewed_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_tasks_role" FOREIGN KEY ("role_id") REFERENCES "project_roles"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_tasks_member" FOREIGN KEY ("assigned_member_id") REFERENCES "project_members"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_tasks_role" ON "tasks" ("role_id")`);
    await queryRunner.query(`CREATE INDEX "idx_tasks_assigned_member" ON "tasks" ("assigned_member_id")`);

    // ---- ratings ----
    await queryRunner.query(`
      CREATE TABLE "ratings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "rater_id" uuid NOT NULL,
        "ratee_id" uuid NOT NULL,
        "stars" smallint NOT NULL,
        "feedback" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_ratings_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ratings_rater" FOREIGN KEY ("rater_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ratings_ratee" FOREIGN KEY ("ratee_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "chk_ratings_stars" CHECK ("stars" BETWEEN 1 AND 5)
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_ratings_ratee" ON "ratings" ("ratee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_ratings_project" ON "ratings" ("project_id")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_ratings_unique_pair" ON "ratings" ("project_id", "rater_id", "ratee_id")`
    );

    // ---- notifications ----
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" "notifications_type_enum" NOT NULL,
        "title" varchar(150) NOT NULL,
        "message" text NOT NULL,
        "related_entity_type" varchar,
        "related_entity_id" uuid,
        "is_read" boolean NOT NULL DEFAULT false,
        "read_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_notifications_user" ON "notifications" ("user_id")`);
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user_unread" ON "notifications" ("user_id", "is_read")`
    );

    // ---- notification_preferences ----
    await queryRunner.query(`
      CREATE TABLE "notification_preferences" (
        "user_id" uuid NOT NULL,
        "type" "notification_preferences_type_enum" NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        PRIMARY KEY ("user_id", "type"),
        CONSTRAINT "fk_notif_prefs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ---- refresh_tokens ----
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar NOT NULL,
        "remember_me" boolean NOT NULL DEFAULT false,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id")`);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_preferences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ratings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "project_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "applications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "project_role_skills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "project_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "project_technologies"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "fk_users_active_project"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_portfolio_links"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_skills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "skills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "notification_preferences_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "project_members_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "applications_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "project_roles_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "projects_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_portfolio_links_platform_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_availability_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_experience_level_enum"`);
  }
};
