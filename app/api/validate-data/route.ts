import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url, key } = await request.json();
    console.log("验证数据接口调用:", { url, key });

    // 正常情况下的返回（注释掉）
    return NextResponse.json({
      valid: true,
      message: "Data validated successfully!",
    });
    // 模拟连接错误 - 用于测试
    // return NextResponse.json(
    //   {
    //     error: "数据验证失败: 无法连接到数据库",
    //     details: "数据库连接超时，请检查网络连接和数据库状态",
    //   },
    //   { status: 500 }
    // );
  } catch (error) {
    console.log("验证数据接口错误:", error);
    return NextResponse.json(
      {
        error: "服务器内部错误",
        details: "处理请求时发生未知错误",
      },
      { status: 500 }
    );
  }
}
