import React, { useRef, useState } from 'react';
import { Camera, StopCircle, Play } from 'lucide-react';

export const CameraTool = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current!.srcObject = null;
      setIsStreaming(false);
    }
  };

  return (
    <div className="p-8 bg-zinc-950 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Camera Tool</h1>
      <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-4">
        <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
      </div>
      <div className="flex gap-4">
        <button onClick={startCamera} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500">
          <Play size={18} /> Start Camera
        </button>
        <button onClick={stopCamera} className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-500">
          <StopCircle size={18} /> Stop Camera
        </button>
      </div>
    </div>
  );
};
