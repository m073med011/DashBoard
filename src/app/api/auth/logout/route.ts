import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/en/signin",
  });

  return NextResponse.json({ message: "Logged out" });
}