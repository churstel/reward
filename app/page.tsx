"use client"
import { useState, useRef, useEffect } from "react"
//import {VideoSetting} from "@/components/video-setting"
import VideoRecorderUser from "@/components/video-recorder-user"
export default function Home() {
  const [ismobile, setIsmobile] = useState(false)
  const [isvertical, setIsvertical] = useState(false)
  const debugMessagesRef = useRef<HTMLDivElement | null>(null);

  const debugMessage = (message: string) => {
    if (debugMessagesRef.current) {
      const msgEl = document.createElement('div');
      msgEl.textContent = message;
      debugMessagesRef.current.appendChild(msgEl);
    }
  }

  const debugDevice = () => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const orientation = window.innerWidth < window.innerHeight ? "Vertical" : "Horizontal";
    debugMessage("Device: " + (isMobile ? "Mobile" : "Desktop") + " (" + orientation + ")");
    setIsmobile(isMobile);
    if(isMobile) setIsvertical(window.innerWidth < window.innerHeight);
  }

  useEffect(() => {
    debugDevice();
  }, []);

  useEffect(() => {
    const updateOrientation = () => {
      const orientation = window.innerWidth < window.innerHeight ? "Vertical" : "Horizontal";
      debugMessage("Orientation changed: " + orientation);
      setIsvertical(window.innerWidth < window.innerHeight);
    };
    window.addEventListener("resize", updateOrientation);
    return () => window.removeEventListener("resize", updateOrientation);
  }, []);

  return (
    <main className="">
      (ismobile && isvertical) ? <div>Mobile Vertical</div> : <div>Desktop or Mobile Horizontal</div>
      
        <VideoRecorderUser />
        {/* // <VideoSetting videoUrl="https://angelxyz.s3.us-east-1.amazonaws.com/videos/157a0ceb-8049-4bac-a5ed-a686d1868034.webm" videoUid="157a0ceb-8049-4bac-a5ed-a686d1868034" />
       */}
    </main>
  )
}

