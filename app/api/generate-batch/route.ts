import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("收到生成请求:", body);

    // 调用外部API
    // const externalApiUrl = "http://192.168.30.3:3000/generate-batch";
    const externalApiUrl = "http://mcp-build.datail.ai/generate-batch";

    const response = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        Authorization:
          "Bearer gpustack_e118b9d6237a51e7_2997f1849c2cd471bdd8351152a1e84c",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("外部API调用失败:", response.status, errorText);

      return NextResponse.json(
        {
          error: "外部API调用失败",
          status: response.status,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("外部API响应:", data);

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("生成接口错误:", error);
    return NextResponse.json(
      {
        error: "服务器内部错误",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
