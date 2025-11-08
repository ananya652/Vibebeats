import React, { useState } from "react";
import "../App.css";

function Upload({ onImageUpload }) {
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      onImageUpload(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginTop: "1rem", textAlign: "center" }}>
      <label className="upload-label">
        Upload Image
        <input type="file" accept="image/*" onChange={handleChange} />
      </label>

      {preview && (
        <div className="preview-container">
          <img src={preview} alt="Preview" />
        </div>
      )}
    </div>
  );
}

export default Upload;
