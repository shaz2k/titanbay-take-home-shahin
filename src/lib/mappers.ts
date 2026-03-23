import type { Fund, Investor, Investment } from "../db/schema.js";

function decimalToNumber(value: string | number): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

export function fundToJson(row: Fund) {
  return {
    id: row.id,
    name: row.name,
    vintage_year: row.vintageYear,
    target_size_usd: decimalToNumber(row.targetSizeUsd),
    status: row.status,
    created_at: row.createdAt.toISOString(),
  };
}

export function investorToJson(row: Investor) {
  return {
    id: row.id,
    name: row.name,
    investor_type: row.investorType,
    email: row.email,
    created_at: row.createdAt.toISOString(),
  };
}

export function investmentToJson(row: Investment) {
  return {
    id: row.id,
    investor_id: row.investorId,
    fund_id: row.fundId,
    amount_usd: decimalToNumber(row.amountUsd),
    investment_date: row.investmentDate,
  };
}
