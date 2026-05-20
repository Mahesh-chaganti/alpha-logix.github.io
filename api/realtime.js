// realtime.js - Connection lifecycle and event dispatching
import { drawOverlay } from '/canvas.js';

let peerConnection = null;
let dataChannel = null;
let audioElement = null;

// Renamed from initVoiceChat to startVoiceChat to match your index.html exactly
export async function startVoiceChat(onConnect, onDisconnect) {
  try {
    peerConnection = new RTCPeerConnection();
    audioElement = document.createElement("audio");
    audioElement.autoplay = true;

    peerConnection.ontrack = e => { audioElement.srcObject = e.streams[0]; };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => { peerConnection.addTrack(track, stream); });

    dataChannel = peerConnection.createDataChannel("oai-events");

    dataChannel.onopen = () => {
      if (typeof onConnect === 'function') onConnect();
      
      // Fallback standard UI state change matching index.html buttons
      const voiceBtnText = document.getElementById("voiceBtnText");
      const voiceWave = document.getElementById("voiceWave");
      if (voiceBtnText) voiceBtnText.innerText = "Live";
      if (voiceWave) voiceWave.classList.remove("hidden");
      
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

    // Connect via backend SDP mapping handshake
    const sessionConfigResponse = await fetch("/api/generate", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "realtime" }) 
    });

    if (!sessionConfigResponse.ok) {
      throw new Error(`Backend error: ${sessionConfigResponse.status} - ${sessionConfigResponse.statusText}`);
    }

    const sessionConfig = await sessionConfigResponse.json();

    // Validate the response structure
    if (!sessionConfig || !sessionConfig.client_secret) {
      throw new Error("Backend did not return client_secret. Check your /api/generate endpoint implementation for realtime type.");
    }

    const apiKey = sessionConfig.client_secret.value || sessionConfig.client_secret;
    if (!apiKey) {
      throw new Error("client_secret.value is undefined. Check your backend response format.");
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const sdpResponse = await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/sdp"
      },
      body: offer.sdp
    });

    if (!sdpResponse.ok) {
      throw new Error(`OpenAI API error: ${sdpResponse.status} - ${sdpResponse.statusText}`);
    }

    const answer = { type: "answer", sdp: await sdpResponse.text() };
    await peerConnection.setRemoteDescription(answer);
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
