const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function verifyProof({
    imageUrl,
    challenge,
    commitment
}) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured.");
    }

    if (!imageUrl) {
        throw new Error("Proof image URL is missing.");
    }

    const response = await client.responses.create({
        model: "gpt-4.1-mini",

        input: [
            {
                role: "user",
                content: [
                    {
                        type: "input_text",
                        text: `
You are verifying an image submitted as proof for a daily commitment.

COMMITMENT:
${commitment.name}

DESCRIPTION:
${commitment.description}

CATEGORY:
${commitment.category}

TODAY'S CHALLENGE:
${challenge}

Carefully inspect the uploaded image.

Decide whether the image provides reasonable visual evidence
related to the commitment and today's challenge.

IMPORTANT:
- Do not identify the person.
- Do not guess identity.
- Do not claim the image proves the activity happened with certainty.
- Only decide whether the visible content is reasonably relevant.
- Reject completely unrelated images.
- Reject blank, extremely unclear, corrupted or unusable images.
- A reasonable visual connection is enough for verification.

Return ONLY valid JSON in exactly this format:

{
  "verified": true,
  "confidence": 85,
  "reason": "The image shows visual evidence reasonably related to today's challenge."
}

Rules:
verified = true or false
confidence = integer from 0 to 100
reason = short explanation
`
                    },
                    {
                        type: "input_image",
                        image_url: imageUrl
                    }
                ]
            }
        ]
    });

    let text = String(
        response.output_text || ""
    ).trim();

    text = text
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();

    if (!text) {
        return {
            verified: false,
            confidence: 0,
            reason: "AI did not return a verification result."
        };
    }

    let parsed;

    try {
        parsed = JSON.parse(text);
    } catch (error) {
        console.error(
            "AI JSON parsing error:",
            text
        );

        return {
            verified: false,
            confidence: 0,
            reason: "AI returned an invalid verification result."
        };
    }

    const confidence = Math.max(
        0,
        Math.min(
            100,
            Math.round(
                Number(parsed.confidence) || 0
            )
        )
    );

    return {
        verified:
            parsed.verified === true &&
            confidence >= 50,

        confidence,

        reason:
            String(
                parsed.reason ||
                "The image could not be sufficiently verified."
            )
    };
}

module.exports = {
    verifyProof
};