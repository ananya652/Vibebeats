import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import { detectMood } from "./vision.js";
import bodyParser from "body-parser";

dotenv.config();
const app = express();
app.use(cors({
  origin: ['https://vibebeats.vercel.app', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("❌ Missing Spotify credentials in environment variables");
  console.error("Make sure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set in your .env file");
  process.exit(1);
}

let accessToken = null;
let tokenExpiry = null;

const getAccessToken = async () => {
  if (accessToken && Date.now() < tokenExpiry) {
    console.log("✅ Using cached token");
    return accessToken;
  }

  console.log("🔄 Fetching new Spotify token...");
  
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;
    console.log("✅ Token obtained successfully");
    return accessToken;
  } catch (error) {
    console.error("❌ Token request failed:", error.response?.data || error.message);
    throw error;
  }
};

const genreSearchQueries = {
  "pop": "pop hits 2024",
  "rock": "rock music",
  "hip-hop": "hip hop rap",
  "electronic": "electronic dance",
  "jazz": "jazz smooth",
  "classical": "classical music",
  "indie": "indie alternative",
  "country": "country music",
  "r-n-b": "r&b soul",
  "latin": "latin music",
  "acoustic": "acoustic songs",
  "ambient": "ambient chill",
  "blues": "blues music",
  "dance": "dance party",
  "folk": "folk music",
  "funk": "funk groove",
  "metal": "metal rock",
  "reggae": "reggae",
  "soul": "soul music",
  "happy": "happy upbeat",
  "sad": "sad emotional",
  "chill": "chill relax",
  "party": "party music",
  "desi": "bollywood hindi songs",
  "bollywood": "bollywood hits",
  "indian": "indian music"
};

// Desi/Bollywood playlists (you can add your own playlist IDs here!)
const desiPlaylists = [
  "1rdnnYryYL6MUxikG4kVZs", // Your custom Bollywood playlist
  "37i9dQZF1DX0XUfTFmNBRM", // Bollywood Jazz
  "37i9dQZF1DX1vKzKZ9bRCH", // Desi Indie
  "37i9dQZF1DX5J7FIl4q56G"  // Bollywood Butter
];

app.get("/recommendations", async (req, res) => {
  let genre = req.query.genre || "pop";
  console.log("📥 Received genre:", genre);

  try {
    const token = await getAccessToken();
    
    // Special handling for desi/bollywood - use playlists
    if (genre === "desi" || genre === "bollywood" || genre === "indian") {
      console.log("🇮🇳 Fetching Bollywood songs from curated playlists");
      
      // Try each playlist until we find one that works
      for (const playlistId of desiPlaylists) {
        try {
          const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              limit: 50,
              market: "IN",
              fields: "items(track(id,name,artists,album(images),preview_url,external_urls))"
            }
          });

          const tracks = response.data.items
            .map(item => item.track)
            .filter(track => track && track.id);
          
          if (tracks.length > 0) {
            // Shuffle the tracks to get random songs each time
            const shuffled = tracks.sort(() => Math.random() - 0.5);
            console.log(`✅ Found ${tracks.length} Bollywood tracks from playlist (randomized)`);
            return res.json(shuffled.slice(0, 3)); // Changed to 3 songs
          }
        } catch (err) {
          console.log(`⚠️ Playlist ${playlistId} failed, trying next...`);
          continue;
        }
      }
      
      // Fallback to search if playlists fail
      console.log("⚠️ All playlists failed, falling back to search");
    }
    
    // Regular search for other genres
    const searchQuery = genreSearchQueries[genre] || genre;
    console.log("🎯 Searching for:", searchQuery);

    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: searchQuery,
        type: "track",
        limit: 50,
        market: "US"
      },
    });

    // Filter for tracks with preview URLs
    const tracksWithPreviews = response.data.tracks.items.filter(track => track.preview_url);
    
    console.log(`✅ Found ${tracksWithPreviews.length} tracks with previews out of ${response.data.tracks.items.length} total`);
    
    // Shuffle and return random songs
    const allTracks = tracksWithPreviews.length > 0 ? tracksWithPreviews : response.data.tracks.items;
    const shuffled = allTracks.sort(() => Math.random() - 0.5);

    res.json(shuffled.slice(0, 3));
  } catch (error) {
    console.error("❌ Search error details:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    
    res.status(error.response?.status || 500).json({ 
      error: "Failed to fetch songs", 
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
});

app.get("/test-token", async (req, res) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios.get("https://api.spotify.com/v1/browse/categories", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        limit: 1
      }
    });
    
    res.json({ 
      message: "Token works!", 
      categories: response.data.categories.items.length 
    });
  } catch (error) {
    console.error("Token test failed:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Token test failed", 
      details: error.response?.data || error.message 
    });
  }
});

app.post("/analyze-mood", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "No image provided" });

    const mood = await detectMood(image);
    console.log("🧠 Mood detected:", mood);

    res.json({ mood });
  } catch (error) {
    console.error("❌ Mood detection failed:", error);
    res.status(500).json({ error: "Mood detection error" });
  }
});

app.listen(3000, () => {
  console.log("🚀 Spotify backend running on port 3000");
  console.log("🧪 Test your token at: http://localhost:3000/test-token");
  console.log("🎵 Get recommendations at: http://localhost:3000/recommendations?genre=pop");
});