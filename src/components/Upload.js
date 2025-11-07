import React, { useState } from "react";

function Upload({ onImageUpload }) {
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      onImageUpload(reader.result); // send image to parent
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleChange} />
      {preview && (
        <div>
          <p>Preview:</p>
          <img src={preview} alt="Preview" style={{ maxWidth: "300px" }} />
        </div>
      )}
    </div>
  );
}

export default Upload;
