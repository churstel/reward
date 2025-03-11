"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Camera, StopCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function VideoRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isVideoAvailable, setIsVideoAvailable] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const MAX_RECORDING_TIME = 20 // in seconds

  const startRecording = async () => {
    try {
      setError(null)
      setUploadedUrl(null)

      // Vérifiez si navigator.mediaDevices est défini
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia is not supported in this browser")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          aspectRatio: 9.0 / 16.0,
         },
        audio: true,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        const url = URL.createObjectURL(blob)
        setVideoBlob(blob)
        setVideoUrl(url)
        setIsVideoAvailable(true)
        
        if (videoRef.current) {
          videoRef.current.srcObject = null
          videoRef.current.src = url
          videoRef.current.controls = true
        
          videoRef.current.onloadeddata = () => {
            videoRef.current?.play()
          }
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording()
            return MAX_RECORDING_TIME
          }
          return prev + 1
        })
      }, 1000)
    } catch (err: unknown) {
      console.error("Error accessing camera:", err)
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera access and try again.")
      } else if (err instanceof Error && err.name === "NotFoundError") {
        setError("No camera found. Please connect a camera and try again.")
      } else if ((err as Error).name === "NotReadableError") {
        setError("Camera is in use by another application. Please close other apps using the camera.")
      } else {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(`Could not access camera: ${errorMessage}`)
      }
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    
    

    

    setIsRecording(false)
  }

  const resetRecording = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }

    setVideoBlob(null)
    setVideoUrl(null)
    setRecordingTime(0)
    setError(null)
    setUploadedUrl(null)
    setIsVideoAvailable(false)

    if (videoRef.current) {
      videoRef.current.controls = false
    }
  }

  const handleUpload = async () => {
    if (!videoBlob) return

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setError(null)

      // Create a FormData object to send the video
      const formData = new FormData()
      formData.append("video", videoBlob, "video.webm")

      // Set up progress tracking
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5
          return newProgress > 90 ? 90 : newProgress
        })
      }, 300)

      // Upload to our API endpoint
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status: ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to upload video")
      }

      setUploadProgress(100)
      setUploadedUrl(data.url)

    } catch (err: unknown) {
      console.error("Error uploading video:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Upload failed: ${errorMessage}`)
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  return (
    <Card className="w-full pt-6">
      
      <CardContent className="space-y-4">
        <div className="relative bg-black rounded-md overflow-hidden aspect-[9/16]">
          
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted={isRecording} />
          
          {isRecording && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm flex items-center">
              <span className="animate-pulse mr-1">●</span>
              {recordingTime}s / {MAX_RECORDING_TIME}s
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="text-sm">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading video... {uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {uploadedUrl && (
          <div className="p-3 bg-green-50 rounded-md space-y-2">
            <div className="text-green-700 font-medium">Video uploaded successfully!</div>
            <div className="text-sm break-all">
              <a href= {uploadedUrl} target="_blank" rel="noreferrer noopener" className="underline">{uploadedUrl}</a>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(uploadedUrl)
                alert("URL copied to clipboard!")
              }}
            >
              Copy URL to Clipboard
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!videoBlob ? (
          <Button onClick={startRecording} disabled={isRecording} className={cn("w-full", isRecording && "opacity-50")}>
            <Camera className="mr-2 h-4 w-4" />
            {isRecording ? "Recording..." : "Start Recording"}
          </Button>
        ) : (
          <div className="w-full space-y-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetRecording} className="flex-1" disabled={isUploading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Record Again
              </Button>
              <Button onClick={handleUpload} className="flex-1" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Get your link"}
              </Button>
            </div>
          </div>
        )}

        {isRecording && (
          <Button
            variant="destructive"
            onClick={stopRecording}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-full w-12 h-12 p-0"
          >
            <StopCircle className="h-6 w-6" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

