"use client";

import { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, Loader2, CheckCircle2, Clock, UserCheck } from "lucide-react";
import { timeIn, timeOut } from "@/services/attendance";
import { getFaceEmbedding } from "@/services/face";

interface AttendanceTerminalProps {
  roomId: string;
  userId: string;
  userName: string;
}

export function AttendanceTerminal({ roomId, userId, userName }: AttendanceTerminalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoaded(true);
      } catch (err) {
        toast.error("Failed to load models");
      }
    };
    loadModels();
  }, []);

  const startTerminal = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setStatus('idle');
      }
    } catch (err) {
      toast.error("Camera access denied");
    }
  };

  const processAttendance = async (type: 'in' | 'out') => {
    if (!videoRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
      // 1. Detect and Descriptor
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error("Face not detected. Look directly at the camera.");
        setIsProcessing(false);
        return;
      }

      // 2. Verification
      const storedEmbedding = await getFaceEmbedding(userId);
      if (!storedEmbedding) {
        throw new Error("You haven't registered your face yet.");
      }

      const distance = faceapi.euclideanDistance(
        new Float32Array(detection.descriptor),
        new Float32Array(storedEmbedding as number[])
      );

      // Threshold usually around 0.6 for recognition
      if (distance > 0.5) {
        throw new Error("Face verification failed. Please try again or re-register.");
      }

      // 3. Record Attendance
      if (type === 'in') {
        await timeIn(roomId, userId);
        setActionMessage(`Time In Successful for ${userName}`);
      } else {
        await timeOut(roomId, userId);
        setActionMessage(`Time Out Successful for ${userName}`);
      }

      setStatus('success');
      toast.success(type === 'in' ? "Time In recorded" : "Time Out recorded");

      // Stop camera after success
      setTimeout(() => {
        stopCamera();
      }, 3000);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Attendance failed");
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsStreaming(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-xl flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Attendance Terminal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black flex items-center justify-center">
            {isStreaming ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="text-center p-12">
                <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-10 w-10 text-muted-foreground" />
                </div>
                <Button onClick={startTerminal} disabled={!isModelLoaded} className="bg-primary">
                  {isModelLoaded ? "Activate Terminal" : "Loading Models..."}
                </Button>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-white font-medium">Verifying Face...</p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="absolute inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center">
                <div className="bg-card p-8 rounded-2xl shadow-2xl text-center scale-up-animation">
                  <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-foreground mb-2">Verified</h3>
                  <p className="text-muted-foreground">{actionMessage}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4 p-6 border-t border-border">
          {isStreaming && status !== 'success' && (
            <>
              <Button 
                onClick={() => processAttendance('in')} 
                disabled={isProcessing}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 h-16 text-lg"
              >
                <Clock className="mr-2 h-6 w-6" />
                Time In
              </Button>
              <Button 
                onClick={() => processAttendance('out')} 
                disabled={isProcessing}
                variant="outline"
                size="lg"
                className="border-border hover:bg-accent text-accent-foreground flex-1 h-16 text-lg"
              >
                <Clock className="mr-2 h-6 w-6" />
                Time Out
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
