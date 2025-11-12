import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url, key } = await request.json();
    console.log("Validate data API invoked:", { url, key });

    // Normal return (commented for reference)
    return NextResponse.json({
      valid: true,
      message: "Data validated successfully!",
    });
    // Simulated connection error for testing
    // return NextResponse.json(
    //   {
    //     error: "Data validation failed: unable to connect to the database",
    //     details: "Database connection timed out. Please check connectivity and database status.",
    //   },
    //   { status: 500 }
    // );
  } catch (error) {
    console.log("Validate data API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: "An unexpected error occurred while processing the request.",
      },
      { status: 500 }
    );
  }
}
