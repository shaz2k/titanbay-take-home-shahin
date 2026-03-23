import "dotenv/config";
import { closeDb, db, schema } from "../db/index.js";

/** Stable UUIDs so you can copy the same curl examples from the API spec. */
const FUND_I = "550e8400-e29b-41d4-a716-446655440000";
const FUND_II = "660e8400-e29b-41d4-a716-446655440001";
const INVESTOR_GSAM = "770e8400-e29b-41d4-a716-446655440002";
const INVESTOR_CALPERS = "880e8400-e29b-41d4-a716-446655440003";
const INV_1 = "990e8400-e29b-41d4-a716-446655440004";
const INV_2 = "aa0e8400-e29b-41d4-a716-446655440005";

async function seed() {
  await db.transaction(async (tx) => {
    await tx.delete(schema.investments);
    await tx.delete(schema.investors);
    await tx.delete(schema.funds);

    await tx.insert(schema.funds).values([
      {
        id: FUND_I,
        name: "Titanbay Growth Fund I",
        vintageYear: 2024,
        targetSizeUsd: "250000000.00",
        status: "Fundraising",
        createdAt: new Date("2024-01-15T10:30:00.000Z"),
      },
      {
        id: FUND_II,
        name: "Titanbay Growth Fund II",
        vintageYear: 2025,
        targetSizeUsd: "500000000.00",
        status: "Fundraising",
        createdAt: new Date("2024-09-22T14:20:00.000Z"),
      },
    ]);

    await tx.insert(schema.investors).values([
      {
        id: INVESTOR_GSAM,
        name: "Goldman Sachs Asset Management",
        investorType: "Institution",
        email: "investments@gsam.com",
        createdAt: new Date("2024-02-10T09:15:00.000Z"),
      },
      {
        id: INVESTOR_CALPERS,
        name: "CalPERS",
        investorType: "Institution",
        email: "privateequity@calpers.ca.gov",
        createdAt: new Date("2024-09-22T15:45:00.000Z"),
      },
    ]);

    await tx.insert(schema.investments).values([
      {
        id: INV_1,
        fundId: FUND_I,
        investorId: INVESTOR_GSAM,
        amountUsd: "50000000.00",
        investmentDate: "2024-03-15",
      },
      {
        id: INV_2,
        fundId: FUND_I,
        investorId: INVESTOR_CALPERS,
        amountUsd: "75000000.00",
        investmentDate: "2024-09-22",
      },
    ]);
  });

  console.log("Seed complete: 2 funds, 2 investors, 2 investments.");
  console.log(`Try: GET http://localhost:3000/funds/${FUND_I}/investments`);
}

try {
  await seed();
} finally {
  await closeDb();
}
