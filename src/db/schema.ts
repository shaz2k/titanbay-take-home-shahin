import { relations } from "drizzle-orm";
import {
  date,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const fundStatusEnum = pgEnum("fund_status", [
  "Fundraising",
  "Investing",
  "Closed",
]);

export const investorTypeEnum = pgEnum("investor_type", [
  "Individual",
  "Institution",
  "Family Office",
]);

/** Private equity / venture fund */
export const funds = pgTable(
  "funds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    vintageYear: integer("vintage_year").notNull(),
    targetSizeUsd: decimal("target_size_usd", {
      precision: 20,
      scale: 2,
    }).notNull(),
    status: fundStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("funds_status_idx").on(t.status)]
);

/** Limited partner or allocator */
export const investors = pgTable(
  "investors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    investorType: investorTypeEnum("investor_type").notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("investors_email_unique").on(t.email)]
);

/** Commitment or investment into a fund by an investor */
export const investments = pgTable(
  "investments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    investorId: uuid("investor_id")
      .notNull()
      .references(() => investors.id, { onDelete: "restrict" }),
    fundId: uuid("fund_id")
      .notNull()
      .references(() => funds.id, { onDelete: "restrict" }),
    amountUsd: decimal("amount_usd", {
      precision: 20,
      scale: 2,
    }).notNull(),
    investmentDate: date("investment_date", { mode: "string" }).notNull(),
  },
  (t) => [
    index("investments_investor_id_idx").on(t.investorId),
    index("investments_fund_id_idx").on(t.fundId),
  ]
);

export const fundsRelations = relations(funds, ({ many }) => ({
  investments: many(investments),
}));

export const investorsRelations = relations(investors, ({ many }) => ({
  investments: many(investments),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  fund: one(funds, {
    fields: [investments.fundId],
    references: [funds.id],
  }),
  investor: one(investors, {
    fields: [investments.investorId],
    references: [investors.id],
  }),
}));

export type Fund = typeof funds.$inferSelect;
export type NewFund = typeof funds.$inferInsert;
export type Investor = typeof investors.$inferSelect;
export type NewInvestor = typeof investors.$inferInsert;
export type Investment = typeof investments.$inferSelect;
export type NewInvestment = typeof investments.$inferInsert;
