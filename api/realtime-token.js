const axios = require('axios');

export default async function handler(req, res) {

  try {

    const response =
      await axios.post(

        "https://api.openai.com/v1/realtime/sessions",

        {
          model: "gpt-4o-realtime-preview",
          voice: "alloy"
        },

        {
          headers: {
            Authorization:
              `Bearer ${process.env.OPENAI_API_KEY}`,

            "Content-Type":
              "application/json"
          }
        }
      );

    return res.status(200).json(response.data);

  } catch (error) {

    console.error(error.response?.data || error);

    return res.status(500).json({
      error:
        error.response?.data ||
        error.message
    });
  }
}
