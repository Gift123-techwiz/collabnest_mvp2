// Adds: users.date_of_birth (PRD data-collection requirement), the
// project-level subscription/plan tracking columns, the two new payment
// tables, and the extra enum values the payment + subscription-expiry
// notification types need. Kept as a separate migration from InitSchema
// rather than editing history, since InitSchema may already have been run
// against a local/staging database.
module.exports = class AddPaymentsAndDob1700000100000 {
  name = 'AddPaymentsAndDob1700000100000';

  async up(queryRunner) {
    // ---- users.date_of_birth ----
    //await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "date_of_birth" date`);

    // ---- new enum values on existing types ----
    // Note: ADD VALUE is safe inside this migration's transaction as long
    // as the new value isn't *used* until a later, separate transaction —
    // which is the case here (no inserts in this migration use them).
    await queryRunner.query(
      `ALTER TYPE "projects_status_enum" ADD VALUE IF NOT EXISTS 'payment_required'`
    );
    await queryRunner.query(
      `ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'subscription_expired'`
    );
    await queryRunner.query(
      `ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'payment_successful'`
    );
    await queryRunner.query(
      `ALTER TYPE "notification_preferences_type_enum" ADD VALUE IF NOT EXISTS 'subscription_expired'`
    );
    await queryRunner.query(
      `ALTER TYPE "notification_preferences_type_enum" ADD VALUE IF NOT EXISTS 'payment_successful'`
    );

    // ---- projects: plan-tracking columns ----
    await queryRunner.query(
      `CREATE TYPE "projects_current_plan_enum" AS ENUM ('free','standard','advanced')`
    );
    await queryRunner.query(`
      ALTER TABLE "projects"
        ADD COLUMN "current_plan" "projects_current_plan_enum" NOT NULL DEFAULT 'free',
        ADD COLUMN "free_plan_used" boolean NOT NULL DEFAULT false,
        ADD COLUMN "free_extension_used" boolean NOT NULL DEFAULT false,
        ADD COLUMN "subscription_expires_at" timestamptz,
        ADD COLUMN "status_before_lock" "projects_status_enum"
    `);

    // ---- project_subscriptions ----
    await queryRunner.query(
      `CREATE TYPE "project_subscriptions_plan_enum" AS ENUM ('free','standard','advanced')`
    );
    await queryRunner.query(
      `CREATE TYPE "project_subscriptions_status_enum" AS ENUM ('active','expired','cancelled')`
    );
    await queryRunner.query(`
      CREATE TABLE "project_subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "plan" "project_subscriptions_plan_enum" NOT NULL,
        "months" int NOT NULL,
        "amount_naira" int NOT NULL,
        "start_date" timestamptz NOT NULL,
        "end_date" timestamptz NOT NULL,
        "status" "project_subscriptions_status_enum" NOT NULL DEFAULT 'active',
        "paystack_reference" varchar,
        "is_free_extension" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_project_subscriptions_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_project_subscriptions_project" ON "project_subscriptions" ("project_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_project_subscriptions_status" ON "project_subscriptions" ("status")`
    );

    // ---- payment_events (append-only audit log) ----
    await queryRunner.query(
      `CREATE TYPE "payment_events_event_type_enum" AS ENUM ('initiated','succeeded','failed','refunded')`
    );
    await queryRunner.query(`
      CREATE TABLE "payment_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "initiated_by" uuid NOT NULL,
        "plan" varchar NOT NULL,
        "months" int NOT NULL,
        "amount_naira" int NOT NULL,
        "event_type" "payment_events_event_type_enum" NOT NULL,
        "paystack_reference" varchar,
        "gateway_payload" text,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_payment_events_project" ON "payment_events" ("project_id")`);
    await queryRunner.query(
      `CREATE INDEX "idx_payment_events_reference" ON "payment_events" ("paystack_reference")`
    );
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_events"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_events_event_type_enum"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "project_subscriptions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "project_subscriptions_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "project_subscriptions_plan_enum"`);

    await queryRunner.query(`
      ALTER TABLE "projects"
        DROP COLUMN IF EXISTS "status_before_lock",
        DROP COLUMN IF EXISTS "subscription_expires_at",
        DROP COLUMN IF EXISTS "free_extension_used",
        DROP COLUMN IF EXISTS "free_plan_used",
        DROP COLUMN IF EXISTS "current_plan"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "projects_current_plan_enum"`);

    // Postgres cannot DROP VALUE from an enum — reverting the added enum
    // values would require recreating the type. Left as-is on down() since
    // an unused enum value is harmless; this is a documented limitation.

    //await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "date_of_birth"`);
  }
};
