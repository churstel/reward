import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { S3 } from "@aws-sdk/client-s3"

// Create S3 client outside of the handler to avoid recreating it on each request
const s3 = new S3({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "AKIAXBEULIHOZFPMCYHP",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "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",
  },
  // Explicitly disable loading credentials from shared files
  credentialDefaultProvider: () => async () => {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "AKIAXBEULIHOZFPMCYHP",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "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",
    }
  },
})

export async function POST(request: NextRequest) {
  try {
    // Get environment variables
    const region = process.env.AWS_REGION || "us-east-1"
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "angelxyz"

    // Validate environment variables
    if (!region || !bucketName) {
      console.error("Missing required AWS environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Get the video data from the request
    const formData = await request.formData()
    const file = formData.get("video") as File

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    // Convert File to Buffer using arrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate a unique filename
    const fileName = `videos/${uuidv4()}.webm`

    // Upload to S3
    await s3.putObject({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: "video/webm",
      ACL: "public-read",
    })

    // Generate the URL
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
    })
  } catch (error: any) {
    console.error("Error uploading to S3:", error)
    return NextResponse.json({ error: `Failed to upload video: ${error.message}` }, { status: 500 })
  }
}

