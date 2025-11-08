import vision from "@google-cloud/vision";

// Check if we're on Vercel (production) or local development
let client;

if (process.env.GOOGLE_CREDENTIALS_BASE64) {
  // Production: decode base64 credentials
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8')
  );
  
  client = new vision.ImageAnnotatorClient({
    credentials: credentials
  });
} else {
  // Local development: use keyfile path from .env
  client = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_VISION_KEY_PATH || "vision-key.json"
  });
}

// Keywords that indicate Indian/desi context
const INDIAN_KEYWORDS = [
  'saree', 'sari', 'kurta', 'lehenga', 'salwar', 'kameez', 'dupatta', 
  'turban', 'pagri', 'bindi', 'mehendi', 'henna', 'rangoli', 'diya',
  'temple', 'taj mahal', 'holi', 'diwali', 'indian', 'bollywood',
  'traditional dress', 'ethnic wear', 'dhoti', 'sherwani', 'anarkali',
  'jewelry', 'bangle', 'mangalsutra', 'maang tikka', 'jhumka',
  'festival', 'wedding', 'mandap', 'marigold', 'jasmine'
];

export async function detectMood(base64Image) {
  try {
    // Remove data URL prefix if present
    const imageData = base64Image.replace(/^data:image\/\w+;base64,/, "");
    
    const request = {
      image: { content: imageData },
      features: [
        { type: "FACE_DETECTION" },
        { type: "LABEL_DETECTION" },
        { type: "IMAGE_PROPERTIES" },
        { type: "WEB_DETECTION" }
      ]
    };

    const [result] = await client.annotateImage(request);
    
    // Check for Indian/cultural context first
    const labels = result.labelAnnotations || [];
    const webEntities = result.webDetection?.webEntities || [];
    
    const allDetectedTerms = [
      ...labels.map(l => l.description.toLowerCase()),
      ...webEntities.map(e => e.description?.toLowerCase() || "")
    ];
    
    console.log("🔍 Detected labels:", allDetectedTerms.slice(0, 10));
    
    const hasIndianContext = allDetectedTerms.some(term => 
      INDIAN_KEYWORDS.some(keyword => term.includes(keyword))
    );
    
    if (hasIndianContext) {
      console.log("🇮🇳 Indian/Desi context detected!");
      return "desi";
    }

    // Regular mood detection from faces
    const faces = result.faceDetections || [];
    
    if (faces.length > 0) {
      const face = faces[0];
      
      if (face.joyLikelihood === "VERY_LIKELY" || face.joyLikelihood === "LIKELY") {
        return "joy";
      }
      if (face.sorrowLikelihood === "VERY_LIKELY" || face.sorrowLikelihood === "LIKELY") {
        return "sorrow";
      }
      if (face.angerLikelihood === "VERY_LIKELY" || face.angerLikelihood === "LIKELY") {
        return "anger";
      }
      if (face.surpriseLikelihood === "VERY_LIKELY" || face.surpriseLikelihood === "LIKELY") {
        return "surprise";
      }
    }

    // Fallback: Context-based mood detection
    const hasPartyLabels = allDetectedTerms.some(term => 
      ['party', 'celebration', 'dance', 'concert', 'nightclub', 'festival'].includes(term)
    );
    if (hasPartyLabels) return "party";
    
    const hasSportsLabels = allDetectedTerms.some(term => 
      ['sport', 'fitness', 'gym', 'exercise', 'running', 'workout'].includes(term)
    );
    if (hasSportsLabels) return "rock";
    
    const hasNatureLabels = allDetectedTerms.some(term => 
      ['nature', 'landscape', 'mountain', 'beach', 'forest', 'sunset', 'sky'].includes(term)
    );
    if (hasNatureLabels) return "chill";
    
    const hasMusicLabels = allDetectedTerms.some(term => 
      ['music', 'instrument', 'guitar', 'piano', 'musician'].includes(term)
    );
    if (hasMusicLabels) return "indie";

    // Color-based mood detection
    const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
    if (colors.length > 0) {
      const dominantColor = colors[0].color;
      const brightness = (dominantColor.red + dominantColor.green + dominantColor.blue) / 3;
      
      return brightness > 150 ? "happy" : "chill";
    }

    return "neutral";
  } catch (error) {
    console.error("❌ Vision API Error:", error);
    return "neutral";
  }
}