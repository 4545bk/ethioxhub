
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export const generateS3UploadUrl = async (fileName, fileType) => {
    const key = `videos/${Date.now()}-${fileName}`;
    const bucket = process.env.AWS_S3_BUCKET_NAME;

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: fileType,
        // ACL: 'public-read' // Optional: depending on bucket settings
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // We return the key so we can generate signed GET urls later
    const publicUrl = `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

    return { uploadUrl, publicUrl, key, bucket };
};

export const getS3ViewUrl = async (key) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
    });
    // Valid for 1 hour. Frontend should re-fetch if expired or we handle it.
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
