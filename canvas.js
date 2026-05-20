// canvas.js - Modular drawing execution script
const canvas = document.getElementById("overlayCanvas");
const ctx = canvas.getContext("2d");

export function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export async function drawOverlay(data) {
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

  // Draw Context Annotation Text
  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#000000";
  ctx.fillText(data.annotation, startX, startY - 20);
}

// Global Canvas Resize Listener Hook
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
