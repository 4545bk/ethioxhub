
const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();

// Manually checking if env vars are loaded since we just wrote them
// Note: dotenv might not reload if already required, but this is a new process
console.log("Checking AWS Config...");
console.log("Region:", process.env.AWS_REGION);
console.log("Bucket:", process.env.AWS_S3_BUCKET_NAME);
console.log("Key ID:", process.env.AWS_ACCESS_KEY_ID ? "Set" : "Missing");

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

async function check() {
    try {
        const data = await s3.send(new ListBucketsCommand({}));
        console.log("Connection Success!");
        console.log("Buckets:", data.Buckets.map(b => b.Name));
    } catch (err) {
        console.error("Connection Failed:", err.message);
    }
}

check();
