CREATE TYPE "public"."fund_status" AS ENUM('Fundraising', 'Investing', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."investor_type" AS ENUM('Individual', 'Institution', 'Family Office');--> statement-breakpoint
CREATE TABLE "funds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"vintage_year" integer NOT NULL,
	"target_size_usd" numeric(20, 2) NOT NULL,
	"status" "fund_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investor_id" uuid NOT NULL,
	"fund_id" uuid NOT NULL,
	"amount_usd" numeric(20, 2) NOT NULL,
	"investment_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"investor_type" "investor_type" NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_investor_id_investors_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "funds_status_idx" ON "funds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "investments_investor_id_idx" ON "investments" USING btree ("investor_id");--> statement-breakpoint
CREATE INDEX "investments_fund_id_idx" ON "investments" USING btree ("fund_id");--> statement-breakpoint
CREATE UNIQUE INDEX "investors_email_unique" ON "investors" USING btree ("email");