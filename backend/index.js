import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

// Validate environment variables
if (!clientId || !clientSecret) {
  console.error("❌ Missing Spotify credentials in environment variables");
  console.error("Make sure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set in your .env file");
  process.exit(1);
}

// Token caching
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

// Genre to search query mapping
const genreSearchQueries = {
  "pop": "pop hits",
  "rock": "rock music",
  "hip-hop": "hip hop rap",
  "electronic": "electronic dance",
  "jazz": "jazz smooth",
  "classical": "classical orchestral",
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
  "party": "party music"
};

app.get("/recommendations", async (req, res) => {
  let genre = req.query.genre || "pop";
  console.log("📥 Received genre:", genre);

  try {
    const token = await getAccessToken();
    
    // Map genre to search query
    const searchQuery = genreSearchQueries[genre] || genre;
    console.log("🎯 Searching for:", searchQuery);

    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: searchQuery,
        type: "track",
        limit: 10,
        market: "IN"
      },
    });

    console.log("✅ Successfully got", response.data.tracks.items.length, "tracks");
    res.json(response.data.tracks.items);
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

// Test endpoint to verify token works
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

app.listen(3000, () => {
  console.log("🚀 Spotify backend running on port 3000");
  console.log("🧪 Test your token at: http://localhost:3000/test-token");
  console.log("🎵 Get recommendations at: http://localhost:3000/recommendations?genre=pop");
});