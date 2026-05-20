// canvas.js - Modular drawing execution script

// Declare holders globally within the module scope
let canvas = null;
let ctx = null;

// Initialize function to safely grab elements once the DOM is ready
function initCanvas() {
  if (!canvas) {
    canvas = document.getElementById("overlayCanvas");
    if (canvas) {
      ctx = canvas.getContext("2d");
      resizeCanvas();
    }
  }
}

export function resizeCanvas() {
  // Guard clause in case resize triggers before DOM initialization finishes
  if (!canvas) return; 
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export async function drawOverlay(data) {
  // Ensure elements are safely bound before running drawing operations
  initCanvas();
  
  if (!canvas || !ctx) {
    console.error("Canvas overlay target could not be found in the DOM.");
    return;
  }

  const points = data.points;
  if (!points || points.length === 0) return;

  // Clear previous drawing paths safely
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#00e0ff";
  ctx.lineWidth = 4;
  ctx.shadowColor = "#00e0ff";
  ctx.shadowBlur = 20;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const startX = (points[0].x / 100) * canvas.width;
  const startY = (points[0].y / 100) * canvas.height;

  ctx.beginPath();
  ctx.moveTo(startX, startY);

  for (let i = 1; i < points.length; i++) {
    const prevX = (points[i - 1].x / 100) * canvas.width;
    const prevY = (points[i - 1].y / 100) * canvas.height;
    const targetX = (points[i].x / 100) * canvas.width;
    const targetY = (points[i].y / 100) * canvas.height;

    const animationSteps = 30;
    for (let s = 0; s <= animationSteps; s++) {
      const currentX = prevX + ((targetX - prevX) * s) / animationSteps;
      const currentY = prevY + ((targetY - prevY) * s) / animationSteps;

      ctx.lineTo(currentX, currentY);
      ctx.stroke();
      await new Promise(r => setTimeout(r, 6)); // Linear frame pacing delay
    }
  }

  // Draw Context Annotation Text safely
  if (data.annotation) {
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#000000";
    ctx.fillText(data.annotation, startX, startY - 20);
  }
}

// Set up listeners safely using window lifecycle events
if (typeof window !== "undefined") {
  window.addEventListener("resize", resizeCanvas);
  // Wait until the DOM content is completely parsed before bootstrapping paths
  window.addEventListener("DOMContentLoaded", initCanvas);
  // Fallback execution if script finishes parsing after DOMContentLoaded fires
  initCanvas();
}
