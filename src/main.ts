import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sketchpad</h1>
  <canvas id="myCanvas" width="256" height="256"></canvas>
  <div id="tools">
    <button id="thin">Thin Marker</button>
    <button id="thick">Thick Marker</button>
  </div>
  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
`;

class MarkerLine {
  points: { x: number; y: number }[] = [];
  thickness: number;
  constructor(x: number, y: number, thickness: number) {
    this.thickness = thickness;
    this.points.push({ x, y });
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = this.thickness;
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    ctx.closePath();
  }
}

class ToolPreview {
  x: number;
  y: number;
  thickness: number;
  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
  }
}

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;

let drawing: MarkerLine[] = [];
let redoStack: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;
let currentThickness = 1;
let toolPreview: ToolPreview | null = null;

const thinButton = document.getElementById("thin")!;
const thickButton = document.getElementById("thick")!;

function setTool(thickness: number, button: HTMLElement) {
  currentThickness = thickness;
  document.querySelectorAll("#tools button").forEach((b) =>
    b.classList.remove("selectedTool")
  );
  button.classList.add("selectedTool");
}

thinButton.addEventListener("click", () => setTool(1, thinButton));
thickButton.addEventListener("click", () => setTool(5, thickButton));
setTool(1, thinButton);

canvas.addEventListener("mousedown", (e) => {
  currentLine = new MarkerLine(e.offsetX, e.offsetY, currentThickness);
  drawing.push(currentLine);
  redoStack = [];
  toolPreview = null;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (currentLine) {
    currentLine.drag(e.offsetX, e.offsetY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    toolPreview = new ToolPreview(e.offsetX, e.offsetY, currentThickness);
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

canvas.addEventListener("mouseup", () => {
  currentLine = null;
});

canvas.addEventListener("mouseleave", () => {
  toolPreview = null;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of drawing) line.display(context);
  if (toolPreview) toolPreview.draw(context);
});

canvas.addEventListener("tool-moved", () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of drawing) line.display(context);
  if (toolPreview) toolPreview.draw(context);
});

const buttonBar = document.createElement("div");
buttonBar.style.marginTop = "1em";

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";

buttonBar.append(clearButton, undoButton, redoButton);
document.body.append(buttonBar);

clearButton.addEventListener("click", () => {
  drawing = [];
  redoStack = [];
  context.clearRect(0, 0, canvas.width, canvas.height);
});

undoButton.addEventListener("click", () => {
  if (drawing.length > 0) {
    const last = drawing.pop()!;
    redoStack.push(last);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const restored = redoStack.pop()!;
    drawing.push(restored);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});
