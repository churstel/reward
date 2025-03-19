"use client"

import { Button } from "@/components/ui/button"
import { StopCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface StopBtnProps {
  onClick: () => void;
  recordingTime: number;
  maxTime: number;
}

export function StopBtn({ onClick, recordingTime, maxTime }: StopBtnProps) {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [mediaConstraints] = useState({
    audio: true,
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  });

  const initializeCamera = async () => {
    try {
      // Vérifier les permissions existantes
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const audioPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      if (cameraPermission.state === 'denied' || audioPermission.state === 'denied') {
        console.error("Permissions refusées");
        setHasPermissions(false);
        return;
      }

      // Demander les permissions si nécessaire
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      
      // Arrêter le stream après avoir obtenu les permissions
      stream.getTracks().forEach(track => track.stop());
      setHasPermissions(true);
    } catch (err) {
      console.error("Erreur d'initialisation:", err);
      setHasPermissions(false);
    }
  };

  const resetRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      return stream;
    } catch (err) {
      console.error("Erreur lors de la réinitialisation:", err);
      return null;
    }
  };

  useEffect(() => {
    initializeCamera();
  }, []);

  const progress = ((maxTime - recordingTime) / maxTime) * 100
  const radius = 30
  const isRecording = recordingTime > 0;
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * ((100 - progress) / 100)
  console.log(circumference)
  console.log(strokeDashoffset)

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-24 h-24">
        <button 
          onClick={onClick}
          disabled={!hasPermissions}
          className={`${!hasPermissions ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="inset-0 w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle cx="48" cy="48" r={radius} stroke="#00000050" strokeWidth="6" fill="transparent" />
            {/* Animated Progress Circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="red"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="square"
            />
            {/* Center Rectangle */}
            <rect x="36" y="36" width="24" height="24" fill="red" rx="4" ry="4" />
          </svg>
        </button>
        
        
      </div>
    </div>
  )
}
