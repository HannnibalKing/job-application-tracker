import { NextResponse } from "next/server";

type Stage = "Applied" | "Interview" | "Offer";

type Application = {
  id: string;
  company: string;
  role: string;
  stage: Stage;
  source: string;
  note?: string;
};

type PipelinePayload = {
  userId: string;
  applications: Application[];
};

const pipelineStore = new Map<string, Application[]>();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? "demo-user";
  const applications = pipelineStore.get(userId) ?? [];
  return NextResponse.json({ userId, applications, persistence: "memory" });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PipelinePayload>;
    const userId = body.userId || "demo-user";

    if (!Array.isArray(body.applications)) {
      return NextResponse.json({ error: "applications must be an array" }, { status: 400 });
    }

    pipelineStore.set(userId, body.applications);
    return NextResponse.json({ userId, saved: true, persistence: "memory" });
  } catch (error) {
    console.error("pipeline save error", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
