import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient({
  keyFilename: "vision-key.json",
});

async function testImage() {
  const imagePath = "test.jpg"; // we will add this image next

  const [result] = await client.faceDetection(imagePath);

  if (!result.faceAnnotations || result.faceAnnotations.length === 0) {
    console.log("No face detected 😶");
    return;
  }

  const face = result.faceAnnotations[0];

  console.log("Emotion likelihoods:");
  console.log("Joy:", face.joyLikelihood);
  console.log("Anger:", face.angerLikelihood);
  console.log("Sorrow:", face.sorrowLikelihood);
  console.log("Surprise:", face.surpriseLikelihood);
}

testImage();
