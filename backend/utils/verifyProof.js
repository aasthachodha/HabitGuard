const { GoogleGenAI } = require("@google/genai");

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function verifyProof(imageBuffer, mimeType, commitment) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!imageBuffer) {
    throw new Error("No proof image received.");
  }

  const base64Image = imageBuffer.toString("base64");

  const commitmentName =
    commitment?.name || "the user's commitment";

  const commitmentDescription =
    commitment?.description ||
    "Complete the commitment described by the task.";

  const prompt = `
You are verifying proof for a commitment-tracking application.

COMMITMENT:
Name: ${commitmentName}

Description:
${commitmentDescription}

Analyze the uploaded image carefully.

Decide whether the image provides reasonable visual evidence
that the user worked on or completed this commitment.

Rules:
- Accept relevant and reasonable visual evidence.
- Reject images that are clearly unrelated to the commitment.
- Do not require perfect proof.
- Do not assume something is present if it cannot be seen.
- Return ONLY valid JSON.
- Do not include markdown or code fences.

Return exactly:

{
  "verified": true,
  "reason": "Short explanation"
}

OR

{
  "verified": false,
  "reason": "Short explanation"
}
`;

  let response;

  try {
    response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    const status =
      error?.status ||
      error?.code ||
      error?.response?.status;

    const errorMessage =
      String(error?.message || "").toLowerCase();

    if (
      status === 429 ||
      errorMessage.includes("429") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("resource exhausted")
    ) {
      throw new Error(
        "AI verification is temporarily unavailable because the Gemini usage limit has been reached. Please try again later."
      );
    }

    throw new Error(
      "AI verification is temporarily unavailable. Please try again."
    );
  }

  let text = response.text || "";

  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let result;

  try {
    result = JSON.parse(text);
  } catch (error) {
    console.error("Gemini response:", text);

    throw new Error(
      "AI verification returned an invalid response. Please try again."
    );
  }

  return {
    verified: result.verified === true,
    confidence: Number(result.confidence || 0),
    reason:
      result.reason ||
      "No verification explanation was provided."
  };
}

module.exports = {
  verifyProof
};