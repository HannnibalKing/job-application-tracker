import { NextResponse } from "next/server";

type MarketPayload = {
  multipliers: Record<string, number>;
  lastUpdated: string;
};

const cached: MarketPayload = {
  multipliers: {
    Remote: 1,
    Seattle: 1.08,
    Austin: 1.02,
    "New York": 1.12,
    "San Francisco": 1.18,
  },
  lastUpdated: new Date().toISOString().split("T")[0],
};

export async function GET() {
  return NextResponse.json(cached);
}
