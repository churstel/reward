import VideoRecorder from "@/components/video-recorder"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">Video Message Recorder</h1>
        <p className="text-center text-muted-foreground mb-6">
          Record a video message up to 20 seconds and share it instantly
        </p>
        <VideoRecorder />

        <div className="mt-8 text-sm text-muted-foreground">
          <h2 className="font-medium mb-2">How it works:</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Click "Start Recording" to access your camera</li>
            <li>Record your message (max 20 seconds)</li>
            <li>Review your recording</li>
            <li>Click "Upload Video" to save and share</li>
            <li>Copy the generated link to share your video</li>
          </ol>
        </div>
      </div>
    </main>
  )
}

