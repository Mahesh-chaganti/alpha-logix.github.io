export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {

    let body = "";

    await new Promise((resolve, reject) => {

      req.on("data", chunk => {
        body += chunk.toString();
      });

      req.on("end", resolve);

      req.on("error", reject);
    });

    const formData = new FormData();

    formData.set("sdp", body);

    formData.set(
      "session",

      JSON.stringify({
        type: "realtime",
        model: "gpt-realtime-2",
        audio: {
          output: {
            voice: "alloy"
          }
        }
      })
    );

    const response = await fetch(

      "https://api.openai.com/v1/realtime/calls",

      {
        method: "POST",

        headers: {

          Authorization:
            `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: formData
      }
    );

    const sdp = await response.text();

    res.setHeader(
      "Content-Type",
      "application/sdp"
    );

    return res.status(200).send(sdp);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
}
