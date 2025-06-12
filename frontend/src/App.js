import React, { useState, useRef } from "react";
import axios from "axios";
import CameraCapture from "./components/CameraCapture";
import "./App.css";

function App() {
  const [referenceColor, setReferenceColor] = useState("#ff0000");
  const [capturedImages, setCapturedImages] = useState([]); // Multiple captures
  const [result, setResult] = useState(null);
  const [fileUpload, setFileUpload] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [filePreview, setFilePreview] = useState([]);
  const cameraRef = useRef(null);

  const handleSubmit = async () => {
    if (capturedImages.length === 0 && fileUpload.length === 0) {
      alert("Please capture or upload at least one image.");
      return;
    }

    const formData = new FormData();

    const rgb = hexToRgb(referenceColor);
    formData.append("reference_r", rgb.r);
    formData.append("reference_g", rgb.g);
    formData.append("reference_b", rgb.b);

    capturedImages.forEach((image, idx) => {
      if (image) {
        const blob = dataURLtoFile(image, `capture${idx + 1}.jpg`);
        formData.append("files", blob);
      }
    });
    

    fileUpload.forEach((file) => {
      formData.append("files", file, file.name);
    });

    try {
      const res = await axios.post("http://localhost:8000/analyze", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (error) {
      console.error("AXIOS ERROR:", error);
      alert("Network Error: " + error.message);
    }
  };

  const handleMultiFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.some(file => file.size > 5 * 1024 * 1024)) {
      alert("One or more files too large. Max 5MB each.");
      return;
    }

    setCapturedImages([]);
    setFileUpload(files);

    const previews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        previews.push(event.target.result);
        if (previews.length === files.length) {
          setFilePreview(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCapture = (imageData) => {
    if (imageData) {
      setCapturedImages([...capturedImages, imageData]);
    }
    setFileUpload([]);
    setFilePreview([]);
  };
  

  const removeCapturedImage = (index) => {
    const updated = capturedImages.filter((_, i) => i !== index);
    setCapturedImages(updated);
  };

  const toggleCamera = () => {
    setShowCamera(!showCamera);
    if (!showCamera) {
      setFileUpload([]);
      setFilePreview([]);
    } else {
      setCapturedImages([]);
    }
  };

  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  };

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  return (
    <div className="container">
      <h2>🎨 Color Analyzer Web App</h2>

      <div className="color-picker-container">
        <label className="color-picker-label">Reference Color:</label>
        <input type="color" value={referenceColor} onChange={(e) => setReferenceColor(e.target.value)} />
        <span className="color-value">{referenceColor}</span>
      </div>

      <div className="upload-container">
        <h3>🖼️ Upload Image(s):</h3>
        <input  type="file" accept="image/*" onChange={handleMultiFileChange} multiple />
        {filePreview.length > 0 && (
          <div className="image-preview">
            <h4>Upload Preview:</h4>
            {filePreview.map((img, idx) => (
              <img key={idx} src={img} alt={`preview-${idx}`} style={{ maxWidth: "100%", maxHeight: "300px", marginBottom: "10px" }} />
            ))}
          </div>
        )}
        <button onClick={toggleCamera} className="toggle-camera-btn">
          {showCamera ? "Hide Camera" : "Use Camera Instead"}
        </button>
      </div>

      {showCamera && (
        <div className="webcam-container">
          <h3>📸 Capture from Camera:</h3>
          <CameraCapture ref={cameraRef} setCapturedImage={handleCapture} />
          {capturedImages.length > 0 && (
            <div className="image-preview">
              <h4>Captured Images:</h4>
              {capturedImages.map((img, idx) => (
                <div key={idx} style={{ position: "relative", display: "inline-block", margin: "10px" }}>
                  <img src={img} alt={`capture-${idx}`} style={{ maxWidth: "200px", maxHeight: "200px" }} />
                  <button 
                    onClick={() => removeCapturedImage(idx)} 
                    style={{ position: "absolute", top: 0, right: 0 }}
                  >❌</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button onClick={handleSubmit}>Analyze</button>

      {result && (
        <div className="result">
          <h3>Results:</h3>
          <p>Average ΔE: {result.delta_e.toFixed(2)}</p>
          <p>Accuracy: {result.accuracy.toFixed(2)}%</p>
          <p>Prediction: {result.prediction}</p>
          <p>Hue Diff: {result.features.hue_diff.toFixed(2)}</p>
          <p>Saturation Diff: {result.features.sat_diff.toFixed(2)}</p>
          <p>Brightness Diff: {result.features.bright_diff.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}

export default App;
