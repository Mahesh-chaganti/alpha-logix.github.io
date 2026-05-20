// realtime.js - Connection lifecycle and event dispatching
import { drawOverlay } from '/canvas.js';

let peerConnection = null;
let dataChannel = null;
let audioElement = null;

// Renamed from initVoiceChat to startVoiceChat to match your index.html exactly
export async function startVoiceChat(onConnect, onDisconnect) {
  try {
    // Get session from backend
    const sessionResponse = await fetch("/api/generate", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "realtime" }) 
    });

    if (!sessionResponse.ok) {
      throw new Error(`Backend error: ${sessionResponse.status} - ${sessionResponse.statusText}`);
    }

    const session = await sessionResponse.json();

    // Validate the response structure
    if (!session || !session.client_secret) {
      throw new Error("Backend did not return client_secret. Check your /api/generate endpoint.");
    }

    const clientSecret = session.client_secret.value || session.client_secret;
    if (!clientSecret) {
      throw new Error("client_secret.value is undefined. Check your backend response format.");
    }

    // Initialize RTCPeerConnection
    peerConnection = new RTCPeerConnection();
    audioElement = document.createElement("audio");
    audioElement.autoplay = true;

    peerConnection.ontrack = e => { audioElement.srcObject = e.streams[0]; };

    // Get user's audio stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => { peerConnection.addTrack(track, stream); });

    // Create data channel for receiving server events
    dataChannel = peerConnection.createDataChannel("oai-events");

    dataChannel.onopen = () => {
      if (typeof onConnect === 'function') onConnect();
      
      // Update UI
      const voiceBtnText = document.getElementById("voiceBtnText");
      const voiceWave = document.getElementById("voiceWave");
      const endVoiceBtn = document.getElementById("endVoiceBtn");
      
      if (voiceBtnText) voiceBtnText.innerText = "Live";
      if (voiceWave) voiceWave.classList.remove("hidden");
      if (endVoiceBtn) endVoiceBtn.classList.remove("hidden");
      
      console.log("WebRTC Channel connected cleanly.");
    };

    dataChannel.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      console.log("RAW SERVER EVENT TYPE:", msg.type);

      if (msg.type === "response.function_call_arguments.done") {
        const { call_id: callId, name, arguments: rawArgs } = msg;

        if (name === "draw_chart_overlay") {
          try {
            const args = JSON.parse(rawArgs);
            console.log("VALID ARGUMENTS RESOLVED, CALLING CANVAS:", args);
            
            await drawOverlay(args);

            // Return successful receipt validation frame
            sendEvent({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: callId,
                output: JSON.stringify({ status: "success", rendered: true })
              }
            });

            // Prompt the model to naturally continue speaking
            sendEvent({ type: "response.create" });
          } catch (err) {
            console.error("Payload execution parse mapping fault:", err);
          }
        }
      }
    };

    // Create SDP offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Exchange SDP with OpenAI's realtime endpoint
    const sdpResponse = await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${clientSecret}`,
        "Content-Type": "application/sdp"
      },
      body: offer.sdp
    });

    if (!sdpResponse.ok) {
      throw new Error(`OpenAI API error: ${sdpResponse.status} - ${sdpResponse.statusText}`);
    }

    // Set remote description from OpenAI's answer
    const answerSdp = await sdpResponse.text();
    const answer = { type: "answer", sdp: answerSdp };
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

    console.log("WebRTC connection established successfully");
  } catch (error) {
    console.error("Error in startVoiceChat:", error);
    alert(`Voice chat error: ${error.message}`);
    stopVoiceChat();
    throw error;
  }
}

// Renamed from closeVoiceChat to stopVoiceChat to match your index.html exactly
export function stopVoiceChat() {
  if (peerConnection) peerConnection.close();
  if (audioElement) audioElement.srcObject = null;
  
  // Revert buttons back to normal
  const voiceBtnText = document.getElementById("voiceBtnText");
  const voiceWave = document.getElementById("voiceWave");
  const endVoiceBtn = document.getElementById("endVoiceBtn");
  
  if (voiceBtnText) voiceBtnText.innerText = "Live Voice";
  if (voiceWave) voiceWave.classList.add("hidden");
  if (endVoiceBtn) endVoiceBtn.classList.add("hidden");

  console.log("Session disconnected.");
}

function sendEvent(payload) {
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(JSON.stringify(payload));
  }
}
