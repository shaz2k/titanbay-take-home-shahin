import { describe, expect, it } from "vitest";
import { fundToJson, investmentToJson, investorToJson } from "./mappers.js";
import type { Fund, Investment, Investor } from "../db/schema.js";

describe("fundToJson", () => {
  it("maps row to API snake_case with numeric USD and ISO created_at", () => {
    const row = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Titanbay Growth Fund I",
      vintageYear: 2024,
      targetSizeUsd: "250000000.00",
      status: "Fundraising" as Fund["status"],
      createdAt: new Date("2024-01-15T10:30:00.000Z"),
    } satisfies Fund;

    expect(fundToJson(row)).toEqual({
      id: row.id,
      name: row.name,
      vintage_year: 2024,
      target_size_usd: 250000000,
      status: "Fundraising",
      created_at: "2024-01-15T10:30:00.000Z",
    });
  });
});

describe("investorToJson", () => {
  it("maps investor row", () => {
    const row = {
      id: "770e8400-e29b-41d4-a716-446655440002",
      name: "Goldman Sachs Asset Management",
      investorType: "Institution" as Investor["investorType"],
      email: "investments@gsam.com",
      createdAt: new Date("2024-02-10T09:15:00.000Z"),
    } satisfies Investor;

    expect(investorToJson(row)).toEqual({
      id: row.id,
      name: row.name,
      investor_type: "Institution",
      email: row.email,
      created_at: "2024-02-10T09:15:00.000Z",
    });
  });
});

describe("investmentToJson", () => {
  it("maps investment row with date string and amount", () => {
    const row = {
      id: "990e8400-e29b-41d4-a716-446655440004",
      investorId: "770e8400-e29b-41d4-a716-446655440002",
      fundId: "550e8400-e29b-41d4-a716-446655440000",
      amountUsd: "50000000.00",
      investmentDate: "2024-03-15",
    } satisfies Investment;

    expect(investmentToJson(row)).toEqual({
      id: row.id,
      investor_id: row.investorId,
      fund_id: row.fundId,
      amount_usd: 50000000,
      investment_date: "2024-03-15",
    });
  });
});
