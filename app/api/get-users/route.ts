import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    // Optional: Add authentication check if needed
    // Uncomment if you want to restrict this endpoint
    // try {
    //   await getCurrentUser();
    // } catch (error) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        accountBalance: true,
      },
      orderBy: {
        email: 'asc',
      },
    });

    console.log("Users fetched:", users.length);
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}