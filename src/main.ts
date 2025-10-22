import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
<h1>Sticker Sketchpad</h1>
  <canvas id="myCanvas" width="256" height="256"></canvas>
  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
`;

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;

let drawing: { x: number; y: number }[][] = [];
let currentStroke: { x: number; y: number }[] | null = null;

canvas.addEventListener("mousedown", (e) => {
  currentStroke = [{ x: e.offsetX, y: e.offsetY }];
  drawing.push(currentStroke);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (currentStroke) {
    currentStroke.push({ x: e.offsetX, y: e.offsetY });
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  currentStroke = null;
});


canvas.addEventListener("drawing-changed", () => {
  context.clearRect(0, 0, canvas.width, canvas.height);

  
  for (const stroke of drawing) {
    if (stroke.length < 2) continue;
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      context.lineTo(stroke[i].x, stroke[i].y);
    }
    context.stroke();
    context.closePath();
  }
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  drawing = [];
  context.clearRect(0, 0, canvas.width, canvas.height);
});
