import React, { forwardRef, useRef, useState, useImperativeHandle } from 'react';
import Webcam from "react-webcam";

const CameraCapture = forwardRef(({ setCapturedImage }, ref) => {
  const webcamRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setIsPaused(true); // Pause after capture
  };

  // Expose pause and resume methods to parent via ref
  useImperativeHandle(ref, () => ({
    pauseCamera: () => setIsPaused(true),
    resumeCamera: () => {
      setIsPaused(false);
      setCapturedImage(null); // Clear the captured image when resuming
    }
  }));

  return (
    <div className="camera-container">
      {!isPaused ? (
        <>
          <Webcam 
            audio={false} 
            ref={webcamRef} 
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'environment' }} // Prefer rear camera
          />
          <button onClick={capture} className="capture-btn">
            Capture Image
          </button>
        </>
      ) : (
        <div className="camera-paused">
          <p>Camera paused. Click "Retake" to capture again.</p>
          <button 
            onClick={() => {
              setIsPaused(false);
              setCapturedImage(null);
            }} 
            className="retake-btn"
          >
            Retake
          </button>
        </div>
      )}
    </div>
  );
});

export default CameraCapture;