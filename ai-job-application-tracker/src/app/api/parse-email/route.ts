import { NextResponse } from "next/server";

type ParsedEmail = {
  company: string;
  role: string;
  location: string;
  source: string;
  confidence: number;
};

const parseEmail = (text: string): ParsedEmail => {
  const companyMatch = text.match(/at ([A-Z][A-Za-z]+)/);
  const roleMatch = text.match(/for the ([A-Za-z ]+) role/i);
  const locationMatch = text.match(/in ([A-Za-z ]+),?/i);
  return {
    company: companyMatch?.[1] ?? "Unknown Co",
    role: roleMatch?.[1]?.trim() ?? "Product Designer",
    location: locationMatch?.[1]?.trim() ?? "Remote",
    source: "Parsed email",
    confidence: 0.74,
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text : "";
    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }
    const parsed = parseEmail(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("parse-email error", error);
    return NextResponse.json({ error: "Failed to parse" }, { status: 500 });
  }
}
