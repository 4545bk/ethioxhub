const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

async function setupCors() {
    console.log("Setting up CORS for bucket:", process.env.AWS_S3_BUCKET_NAME);

    // Define the CORS rules
    const corsParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["PUT", "POST", "GET", "HEAD"],
                    AllowedOrigins: ["*"], // Allow all for development to ensure it works
                    ExposeHeaders: ["ETag"],
                    MaxAgeSeconds: 3000
                }
            ]
        }
    };

    try {
        await s3.send(new PutBucketCorsCommand(corsParams));
        console.log("✅ Successfully updated CORS configuration!");
    } catch (err) {
        console.error("❌ Failed to update CORS:", err.message);
    }
}

setupCors();
