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
          model: "gpt-image-1",

          prompt: prompt,

          size: "1024x1024"
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
