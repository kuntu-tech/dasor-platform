import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url, key } = await request.json();
    console.log("连接数据库接口调用:", { url, key });

    // 调用外部 analyze API
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
        `外部API调用失败: ${analyzeResponse.status} - ${errorData}`
      );
    }

    const analyzeData = await analyzeResponse.json();

    return NextResponse.json({
      success: true,
      connectionId: "conn_" + Date.now(),
      analyzeResult: analyzeData,
    });
  } catch (error) {
    console.error("连接数据库接口错误:", error);
    return NextResponse.json(
      {
        error: "连接失败",
        details: error instanceof Error ? error.message : "无法建立数据库连接",
      },
      { status: 500 }
    );
  }
}
