import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Profile from "../../../models/Profile";

export async function POST(request) {
  try {
    console.log("POST /api/approve called");
    await dbConnect();
    let body;
    try {
      body = await request.json();
      console.log("Request body:", body);
    } catch (e) {
      console.error("Body parsing error:", e);
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { profileId } = body;
    if (!profileId) {
      console.log("Missing profileId");
      return NextResponse.json(
        { success: false, error: "profileId is required" },
        { status: 400 }
      );
    }

    const profile = await Profile.findByIdAndUpdate(
      profileId,
      { isUnlocked: true },
      { new: true, runValidators: false } // Skip validation
    );

    if (!profile) {
      console.log("Profile not found for ID:", profileId);
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    console.log("Profile unlocked:", profileId);
    return NextResponse.json({ success: true, message: "Profile unlocked" });
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}