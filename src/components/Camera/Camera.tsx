import React, { useRef, useEffect, useState } from "react";
import { Button } from "../Button";
import { CameraProps } from "./camera.interface";



export const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const [isCameraInitialized, setIsCameraInitialized] = useState<boolean>(false);
  const [capturedPhotoData, setCapturedPhotoData] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isCameraInitialized) {
      initializeCamera();
    }

    return () => {
      // Clean up camera stream when component unmounts
      stopCameraStream();
    };
  }, [isCameraInitialized]);

  const initializeCamera = async () => {
    try {
      // Stop any existing stream
      stopCameraStream();

      // Get access to camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use rear camera if available
        audio: false
      });

      cameraStreamRef.current = stream;

      // Set the stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
        });
        setIsCameraInitialized(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera. Please check camera permissions.");
      onClose();
    }
  };

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get data URL for preview
      const dataURL = canvas.toDataURL('image/jpeg');
      setCapturedPhotoData(dataURL);
    }
  };

  const usePhoto = () => {
    if (!capturedPhotoData) return;

    // Create file name
    const currentDate = new Date();
    const fileName = `Photo_${currentDate.toISOString().replace(/:/g, '-')}.jpg`;
    
    onCapture(capturedPhotoData, fileName);
  };

  const discardCapturedPhoto = () => {
    setCapturedPhotoData(null);
    setIsCameraInitialized(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
      {capturedPhotoData ? (
        // Show captured photo preview
        <div className="flex flex-col items-center w-full">
          <div className="relative w-full max-w-lg">
            <img
              src={capturedPhotoData}
              alt="Captured"
              className="w-full h-auto"
            />
          </div>
          <div className="flex justify-center mt-4 w-full">
            <Button
              type="button"
              onClick={discardCapturedPhoto}
              btnText="Retake"
              className="bg-red-500 text-white rounded-full px-4 py-2 m-2" 
            />
            <Button
              type="reset"
              onClick={usePhoto}
              btnText="Use Photo"
              className="bg-green-500 text-white rounded-full px-4 py-2 m-2" 
            />
          </div>
        </div>
      ) : (
        <>
          <div className="relative w-full max-w-lg">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto"
              style={{ objectFit: 'cover' }}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex justify-center mt-4 w-full">
            <Button
              onClick={capturePhoto}
              type="button"
              className="bg-white rounded-full w-16 h-16 flex items-center justify-center m-2" 
              icon={<div className="border-4 border-gray-500 rounded-full w-12 h-12"></div>} 
            />
            <Button
              type="button"
              onClick={onClose}
              className="bg-red-500 text-white rounded-full px-4 py-2 m-2"
              btnText="Cancel" 
            />
          </div>
        </>
      )}
    </div>
  );
};