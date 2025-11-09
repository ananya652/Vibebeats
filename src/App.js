import React, { useState, useEffect } from "react";
import axios from "axios";
import Upload from "./components/Upload";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const moodToGenre = {
  joy: "pop",
  happy: "pop",
  sorrow: "classical",
  sad: "classical",
  anger: "rock",
  surprise: "electronic",
  neutral: "chill",
  desi: "desi",
  party: "party",
  chill: "chill"
};

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [detectedMood, setDetectedMood] = useState(null);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("pop");

  const genreOptions = ["pop", "rock", "hip-hop", "electronic", "jazz", "classical", "indie", "country", "chill", "party", "desi", "bollywood"];

  const detectMoodFromImage = async (imageData) => {
    try {
      const response = await axios.post(`${API_URL}/analyze-mood`, { image: imageData });
      const mood = response.data.mood || "neutral";
      setDetectedMood(mood);
      setSelectedGenre(moodToGenre[mood] || "pop");
    } catch (error) {
      setDetectedMood("neutral");
      console.error("Mood detection error:", error);
    }
  };

  const handleImageUpload = (imageData) => {
    setUploadedImage(imageData);
    detectMoodFromImage(imageData);
  };

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await axios.get(`${API_URL}/recommendations`, { params: { genre: selectedGenre } });
        console.log("Fetched songs:", response.data);
        setRecommendedSongs(response.data);
      } catch (err) {
        console.error("Spotify fetch failed:", err);
      }
    };
    if (detectedMood) fetchSongs();
  }, [selectedGenre, detectedMood]);

  return (
    <div className="app-container">
      <h1>🎵 VibeBeats</h1>

      {/* Only show genre selector AFTER mood is detected */}
      {detectedMood && (
        <select
          className="genre-select"
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
        >
          {genreOptions.map((genre) => (
            <option key={genre} value={genre}>{genre.charAt(0).toUpperCase() + genre.slice(1)}</option>
          ))}
        </select>
      )}

      <Upload onImageUpload={handleImageUpload} />

      {uploadedImage && <p>✅ Image uploaded! Analyzing mood...</p>}
      {detectedMood && <p>😊 Detected mood: <strong>{detectedMood}</strong></p>}

      {recommendedSongs.length === 0 && detectedMood && <p>Fetching songs...</p>}

      <div className="songs-container">
        {recommendedSongs.map((song) => (
          <div key={song.id} className="song-card">
            <img src={song.album.images[0]?.url} alt={song.name} />
            <div className="song-info">
              <p><strong>{song.name}</strong></p>
              <p>{song.artists[0]?.name}</p>
            </div>
            {song.preview_url ? (
              <audio controls>
                <source src={song.preview_url} type="audio/mpeg" />
              </audio>
            ) : (
              <a 
                href={song.external_urls?.spotify} 
                target="_blank" 
                rel="noopener noreferrer"
                className="spotify-link"
              >
                🎵 Play on Spotify
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;