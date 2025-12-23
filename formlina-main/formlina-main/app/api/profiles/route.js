import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "../../../lib/dbConnect";
import Profile from "../../../models/Profile";
import Unlock from "../../../models/Unlock";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  try {
    await dbConnect();
    const profiles = await Profile.find().lean();

    const blurPhoneNumber = (number) => (number ? number.slice(0, 2) + "XXXXXXX" : "N/A");

    const profilesWithStatus = await Promise.all(
      profiles.map(async (profile) => {
        const unlock = userId
          ? await Unlock.findOne({ profileId: profile._id, userId })
          : null;
        const isUnlocked = unlock?.approved === true;
        const isPending = unlock && unlock.approved === false && !unlock.rejected;
        const isRejected = unlock?.rejected === true;

        return {
          _id: profile._id,
          name: profile.name,
          age: profile.age,
          country: profile.country,
          city: profile.city,
          neighborhood: profile.neighborhood,
          localSalary: profile.localSalary,
          intlSalary: profile.intlSalary,
          photoUrl: isUnlocked
            ? profile.photoUrl
            : `${profile.photoUrl.replace("/upload/", "/upload/e_blur:1000/")}`,
          additionalPhotos: isUnlocked ? profile.additionalPhotos || [] : [],
          contactInfo: isUnlocked ? profile.contactInfo : blurPhoneNumber(profile.contactInfo),
          voiceUrl: profile.voiceId ? `/audio/${profile.voiceId}.mp3` : null, // New field
          isUnlocked,
          isPending,
          isRejected,
        };
      })
    );

    return NextResponse.json({ success: true, data: profilesWithStatus });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}