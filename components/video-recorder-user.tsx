"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { StopBtn } from "@/components/stop-btn"
import { VideoSetting } from "@/components/video-setting"

export default function VideoRecorderUser() {
  const [isStarting, setIsStarting] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  
  const [recordingTime, setRecordingTime] = useState(0)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoUid, setVideoUid] = useState<string >("")
  const [videoFinal, setVideoFinal] = useState<string | undefined>(undefined)
  const [uploadedUrl, setUploadedUrl] = useState<string | undefined>(undefined)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // facingMode est fixé à "user"
  const [facingMode] = useState<"user">("user")
  const [countdown, setCountdown] = useState<number | null>(null)
  const beepRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const MAX_RECORDING_TIME = 40

  // Référence pour la zone de débogage
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    beepRef.current = new Audio('https://angelxyz.s3.us-east-1.amazonaws.com/beep-104060.mp3')
  }, [])

  const playBeep = () => {
    if (beepRef.current) {
      beepRef.current.currentTime = 0;
      try {
        beepRef.current.play().catch((error) => {
          console.error("Failed to play beep:", error);
        });
      } catch (error) {
        console.error("Failed to play beep:", error);
      }
    }
  }

  const initializeCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Your browser doesn't support camera access")
      const constraints = {
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          aspectRatio: { exact: 1.3333 },
        },
        audio: false, // audio désactivé au départ
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        if (err instanceof Error && err.name === "OverconstrainedError") {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play();
          }
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(err instanceof Error ? err.message : "Unable to access camera");
    }
  }

  const startRecording = async () => {
    setIsStarting(false);
    try {
      setError(null)
      setUploadedUrl(undefined)
      // Demander l'autorisation du son avant le compte à rebours
      
      setCountdown(3)
      playBeep();
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          playBeep();
          return prev - 1;
        });
      }, 1000);
      setTimeout(async () => {
        if (!streamRef.current) throw new Error("Camera stream not available");
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const combinedStream = new MediaStream([...(streamRef.current?.getVideoTracks() || []), ...audioStream.getAudioTracks()]);

        const mediaRecorder = new MediaRecorder(combinedStream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/mp4" });
          const url = URL.createObjectURL(blob);
          setVideoBlob(blob);
          setVideoUrl(url);
          if (videoRef.current) {
            // Remplacer l'aperçu en direct par la vidéo enregistrée
            videoRef.current.srcObject = null;
            videoRef.current.src = url;
            videoRef.current.controls = false;
            videoRef.current.currentTime = 0;
            videoRef.current.onloadeddata = () => {
              if (videoRef.current && isFinite(videoRef.current.duration)) {
                videoRef.current.currentTime = 0;
                videoRef.current.play();
              }
            }
          }
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
        };
        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => {
            if (prev >= MAX_RECORDING_TIME) {
              stopRecording();
              return MAX_RECORDING_TIME;
            }
            return prev + 1;
          });
        }, 1000);
      }, 3000);
    } catch (err: unknown) {
      console.error("Error accessing camera:", err);
      setError(err instanceof Error ? err.message : "Unable to access camera. Please check your permissions.");
      setCountdown(null);
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsStarting(false);
  }
  
  const resetRecording = async () => {
    setIsStarting(true);
    window.location.reload();
  }

  const handleUpload = async () => {
    if (!videoBlob) return;
    try {
      setIsUploading(true);
      setIsStarting(false);
      setUploadProgress(0);
      setError(null);
      const formData = new FormData();
      formData.append("video", videoBlob, "video.webm");
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      clearInterval(progressInterval);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status: ${response.status}`);
      }
      if (!data.success) {
        throw new Error(data.error || "Failed to upload video");
      }
      setUploadProgress(100);
      console.log("Video uploaded successfully:", data);
      setUploadedUrl(data.url);
      setVideoUid(data.uid);
      setVideoFinal(data.final);
    } catch (err: unknown) {
      console.error("Error uploading video:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }

  useEffect(() => {
    initializeCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, [facingMode]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach(track => track.stop());
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    }
  }, [videoUrl]);
  
  
  if (!isClient) {
    return null;
  }

  return (
    <>
      {uploadedUrl ? (
        <VideoSetting videoUrl={uploadedUrl} videoUid={videoUid} videoFinal={videoFinal} />
      ) :   (
          <div>
            
            {/* ...existing UI code... */}
            <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
              <div className="relative w-full h-full">
                <video 
                  ref={videoRef} 
                  className="absolute inset-0 mx-auto h-full object-cover object-center aspect-[9/16]"
                  playsInline 
                  autoPlay
                  muted={isRecording}
                />
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-8xl font-bold animate-pulse">
                      {countdown}
                    </div>
                  </div>
                )}
                {isStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-4 mb-6">
                    <Button onClick={startRecording} className={cn("w-24 h-24 p-4 flex items-center justify-center rounded-full bg-gray-400/50 hover:bg-gray-400/50 shadow-xl", (isRecording || countdown !== null) && "hidden")}>
                      <div className="w-20 h-20 aspect-square rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center transition:bg-color duration-200">
                        REC
                      </div>
                    </Button>
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm flex items-center">
                    <span className="animate-pulse mr-1">●</span>
                    {recordingTime}s / {MAX_RECORDING_TIME}s
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4">
                {error && (
                  <Alert variant="destructive" className="text-sm">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {isUploading && (
                  <div className="w-1/4 mx-auto mb-6">
                    <div className="flex justify-center text-white items-center gap-2 text-sm w-25 mb-3">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span className="text-white">uploading... {uploadProgress}%</span>
                    </div>
                    <div className="w-full">
                      <Progress value={uploadProgress} className="h-2 [&>div]:bg-white bg-gray-600" />
                    </div>
                  </div>
                )}
                {uploadedUrl && (
                  <div className="p-3 bg-green-50 rounded-md space-y-2 w-1/2 mx-auto">
                    <div className="text-green-700 font-medium">Video up loaded successfully!</div>
                    <div className="text-sm break-all">
                      <a href={uploadedUrl} target="_blank" rel="noreferrer noopener" className="underline">{uploadedUrl}</a>
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
                {videoBlob && !isUploading && !uploadedUrl && (
                  <div className="flex flex-col justify-center items-center w-full space-y-4 mb-6">
                    <h3 className="text-white">Like it?</h3>
                    <a 
                      href="#" 
                      className="text-blue-500 underline"
                      onClick={(e) => {
                        e.preventDefault();
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          videoRef.current.play();
                        }
                      }}
                    >
                      Replay
                    </a>
                    <div className="flex justify-center space-x-4">
                      <Button variant="outline" onClick={resetRecording} className="w-24 h-24 aspect-square text-lg rounded-full" disabled={isUploading}>
                        No
                      </Button>
                      <Button id="loaded" onClick={handleUpload} className="w-24 h-24 aspect-square text-lg rounded-full bg-lime-500" disabled={isUploading}>
                        Yes
                      </Button>
                    </div>
                  </div>
                )}
                {isRecording && (
                  <StopBtn 
                    onClick={stopRecording}
                    recordingTime={recordingTime}
                    maxTime={MAX_RECORDING_TIME}
                  />
                )}
              </div>
            </div>
          </div>
        
      )}
    </>
  )
}
