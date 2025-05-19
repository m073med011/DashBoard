import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, user, remember } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication token is required" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
    });

    // Common cookie options
    const cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: "strict" | "lax" | "none";
      maxAge?: number;
      path: string;
    } = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    };

    // Add maxAge only if remember is true
    if (remember) {
      cookieOptions.maxAge = 60 * 60 * 24 * 7; // 7 days
    }

    // Set token cookie with httpOnly for security
    response.cookies.set("token", token, cookieOptions);

    if (user) {
      // For the user cookie, we don't need httpOnly to allow client-side access
      const userCookieOptions = {
        ...cookieOptions,
        httpOnly: false,
      };

      response.cookies.set("user", user, userCookieOptions);
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
