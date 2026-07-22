import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    documents: [],
  });
}

export async function POST() {
  return NextResponse.json(
    {
      message: "Document upload endpoint is not implemented yet.",
    },
    {
      status: 501,
    }
  );
}
