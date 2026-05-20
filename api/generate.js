import axios from "axios";
export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {

    const { prompt, type } = req.body;

    // =========================
    // REALTIME VOICE SESSION
    // =========================

    if (type === "realtime") {
      const response = await axios.post(
        "https://api.openai.com/v1/realtime/sessions",
        {
          model: "gpt-4o-realtime-preview",
          modalities: ["audio", "text"],
          instructions: "You are a live interactive AI assistant. When explaining visual patterns, trends, charts, or shapes, execute the 'draw_chart_overlay' function.",
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
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );

      return res.status(200).json(response.data);
    }

    // =========================
    // TEXT
    // =========================

    if (type === "text") {

      const response = await axios.post(

        "https://api.openai.com/v1/chat/completions",

        {
          model: "gpt-4o-mini",

          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        },

        {
          headers: {
            "Content-Type": "application/json",

            Authorization:
              `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );

      return res.status(200).json(response.data);
    }

    // =========================
    // IMAGE
    // =========================

    if (type === "image") {

      const response = await axios.post(

        "https://api.openai.com/v1/images/generations",

        {
          model: "dall-e-3",

          prompt: prompt,

          size: "1024x1024",

          response_format: "b64_json"
        },

        {
          headers: {
            "Content-Type": "application/json",

            Authorization:
              `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );

      return res.status(200).json(response.data);
    }

    // =========================
    // VIDEO PROMPT
    // =========================

    if (type === "video") {

      const response = await axios.post(

        "https://api.openai.com/v1/chat/completions",

        {
          model: "gpt-4o-mini",

          messages: [

            {
              role: "system",

              content:
                `
                You generate cinematic
                AI video prompts for:

                - Sora
                - Runway
                - Kling
                - Pika

                Include:
                - camera
                - lighting
                - realism
                - environment
                - cinematic details
                `
            },

            {
              role: "user",
              content: prompt
            }
          ]
        },

        {
          headers: {
            "Content-Type": "application/json",

            Authorization:
              `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );

      return res.status(200).json(response.data);
    }

    return res.status(400).json({
      error: "Invalid type"
    });

  } catch (error) {

    console.error(error.response?.data || error);

    return res.status(500).json({

      error:
        error.response?.data ||
        error.message
    });
  }
}
