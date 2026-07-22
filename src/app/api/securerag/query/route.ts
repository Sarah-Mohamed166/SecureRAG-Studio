import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      answer: "",
      citations: [],
      message: "Query endpoint is not implemented yet.",
    },
    {
      status: 501,
    }
  );
}
