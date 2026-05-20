// server.js - Run this on your backend node environment
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());
app.use(express.static('.')); // Serves your static frontend files

app.post('/api/realtime', async (req, res) => {
  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        modalities: ["audio", "text"],
        instructions: "You are a live interactive AI teacher. When explaining visual patterns, trends, charts, or shapes, you MUST execute the 'draw_chart_overlay' function. Coordinates MUST be integers between 0 and 100 representing percentage offsets.",
        tool_choice: "auto",
        tools: [
          {
            type: "function",
            name: "draw_chart_overlay",
            description: "Draw custom whiteboard shapes and technical paths across the screen view.",
            parameters: {
              type: "object",
              properties: {
                patternType: { type: "string", description: "Design type: line, circle, arrow, curve" },
                points: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      x: { type: "number" },
                      y: { type: "number" }
                    },
                    required: ["x", "y"]
                  }
                },
                annotation: { type: "string", description: "A context label rendered close to the shape" }
              },
              required: ["patternType", "points", "annotation"]
            }
          }
        ]
      }),
    });

    const data = await response.json();
    // Return the ephemeral session data containing the token to the frontend client
    res.json(data);
  } catch (error) {
    console.error("Session configuration error:", error);
    res.status(500).json({ error: "Failed to generate session environment" });
  }
});

app.listen(3000, () => console.log("Backend routing engine alive on port 3000"));
