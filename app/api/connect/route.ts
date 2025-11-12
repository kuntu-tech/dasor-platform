import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url, key } = await request.json();
    console.log("Connect API invoked:", { url, key });

    // Call external analyze API
    const analyzeResponse = await fetch(
      "https://my-connector.onrender.com/analyze",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis_type: "all",
          supabase_project_id: url,
          supabase_access_token: key,
          user_name: "huimin",
          data_review_result: true,
          openai_api_key: process.env.OPENAI_API_KEY || "",
        }),
        signal: AbortSignal.timeout(180000),
      }
    );

    if (!analyzeResponse.ok) {
      const errorData = await analyzeResponse.text();
      throw new Error(
        `External analyze API failed: ${analyzeResponse.status} - ${errorData}`
      );
    }

    const analyzeData = await analyzeResponse.json();

    return NextResponse.json({
      success: true,
      connectionId: "conn_" + Date.now(),
      analyzeResult: analyzeData,
    });
  } catch (error) {
    console.log("Connect API error:", error);
    return NextResponse.json(
      {
        error: "Connection failed",
        details:
          error instanceof Error
            ? error.message
            : "Unable to establish database connection",
      },
      { status: 500 }
    );
  }
}
