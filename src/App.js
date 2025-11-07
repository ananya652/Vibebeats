import React, { useState, useEffect } from "react";
import axios from "axios";
import Upload from "./components/Upload";

const genreMap = {             
  arabic: "world-music",        // ✅ valid
  "k-pop": "k-pop",             // ✅ valid
  pop: "pop",                   // ✅ valid
  latin: "latin",               // ✅ valid
  reggaeton: "reggaeton",       // ✅ valid
  rock: "rock",                 // ✅ valid
  jazz: "jazz",                 // ✅ valid
  classical: "classical",       // ✅ valid
  "hip-hop": "hip-hop"          // ✅ valid
};



function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [detectedMood, setDetectedMood] = useState(null);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("pop");


  // 🎧 Supported genres
  const genreOptions = Object.keys(genreMap);


  // 🧠 Temporary Mood Detection
  const detectMoodFromImage = async (imageData) => {
    try {
      const mood = "happy"; // static mood for demo
      setDetectedMood(mood); // triggers fetchSongs via useEffect
    } catch (error) {
      console.error("Error detecting mood:", error);
    }
  };

  // 📥 Upload Handler
  const handleImageUpload = (imageData) => {
    setUploadedImage(imageData);
    detectMoodFromImage(imageData);
  };

 useEffect(() => {
  const fetchSongs = async () => {
    const mappedGenre = genreMap[selectedGenre] || "pop";

    console.log("📡 Fetching songs for genre:", mappedGenre); // 🟡 ADD THIS

    try {
      const response = await axios.get("http://localhost:3000/recommendations", {
        params: { genre: mappedGenre },
      });

      console.log("✅ Songs fetched:", response.data); // 🟢 ADD THIS
      setRecommendedSongs(response.data);
    } catch (err) {
      console.error("❌ Spotify fetch failed:", err); // 🔴
    }
  };

  if (detectedMood) {
    console.log("🧠 Detected mood:", detectedMood); // 💡 ADD THIS
    fetchSongs();
  }
}, [selectedGenre, detectedMood]);


  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>🎵 VibeBeats</h1>

      {/* Genre Dropdown */}
      <div style={{ marginBottom: "10px" }}>
        <label><strong>Select Genre:</strong> </label>
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
        >
          {genreOptions.map((genre) => (
            <option key={genre} value={genre}>
              {genre.charAt(0).toUpperCase() + genre.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Upload Component */}
      <Upload onImageUpload={handleImageUpload} />

      {/* Upload Status */}
      {uploadedImage && (
        <p>✅ Image uploaded! We'll analyze it soon.</p>
      )}

      {/* Song Loader */}
      {recommendedSongs.length === 0 && detectedMood && <p>Fetching songs...</p>}

      {/* Song Results */}
      {recommendedSongs.length > 0 && (
        <div>
          <h2>🎧 Songs for your mood: <em>{detectedMood}</em></h2>
          <ul>
            {recommendedSongs.map((song) => (
              <li key={song.id}>
                <a
                  href={song.external_urls.spotify}
                  target="_blank"
                  rel="noreferrer"
                >
                  {song.name} by {song.artists[0].name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
