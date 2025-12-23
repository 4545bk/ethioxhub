import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Profile from "../../../models/Profile";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    await dbConnect();
    const formData = await request.formData();

    const photos = [];
    let i = 0;
    while (formData.get(`photo${i}`)) {
      photos.push(formData.get(`photo${i}`));
      i++;
    }

    if (!photos.length) {
      return NextResponse.json(
        { success: false, error: "At least one photo is required" },
        { status: 400 }
      );
    }

    const photoUrls = await Promise.all(
      photos.map(async (photo) => {
        const bytes = await photo.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "profiles" }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(buffer);
        });
        return result.secure_url;
      })
    );

    const profileData = {
      name: formData.get("name"),
      age: Number(formData.get("age")),
      country: formData.get("country"),
      city: formData.get("city") || undefined,
      neighborhood: formData.get("neighborhood") || undefined,
      localSalary: formData.get("localSalary") === "true",
      intlSalary: formData.get("intlSalary") === "true",
      photoUrl: photoUrls[0], // Use first photo as primary
      additionalPhotos: photoUrls.slice(1), // Store extra photos
      contactInfo: formData.get("contactInfo"),
    };

    const profile = new Profile(profileData);
    await profile.save();

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}