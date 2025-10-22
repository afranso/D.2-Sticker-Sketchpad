import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sketchpad</h1>
  <canvas id="myCanvas" width="256" height="256"></canvas>
  <div id="tools">
    <button id="thin">Thin Marker</button>
    <button id="thick">Thick Marker</button>
    <button id="sticker1">😀</button>
    <button id="sticker2">🌸</button>
    <button id="sticker3">🚀</button>
  </div>
  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
`;

interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}

interface Draggable {
  drag(x: number, y: number): void;
}

class MarkerLine implements Drawable, Draggable {
  points: { x: number; y: number }[] = [];
  thickness: number;
  constructor(x: number, y: number, thickness: number) {
    this.thickness = thickness;
    this.points.push({ x, y });
  }
  drag(x: number, y: number): void {
    this.points.push({ x, y });
  }
  display(ctx: CanvasRenderingContext2D): void {
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

class ToolPreview implements Drawable {
  x: number;
  y: number;
  thickness: number;
  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }
  display(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
  }
}

class StickerPreview implements Drawable {
  x: number;
  y: number;
  sticker: string;
  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }
  display(ctx: CanvasRenderingContext2D): void {
    ctx.font = "24px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

class StickerCommand implements Drawable, Draggable {
  x: number;
  y: number;
  sticker: string;
  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }
  drag(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
  display(ctx: CanvasRenderingContext2D): void {
    ctx.font = "24px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;

type Command = MarkerLine | StickerCommand;
type Preview = ToolPreview | StickerPreview;

let drawing: Command[] = [];
let redoStack: Command[] = [];
let currentCommand: Command | null = null;
let toolPreview: Preview | null = null;

let currentTool: "thin" | "thick" | "sticker" = "thin";
let currentThickness = 1;
let currentSticker = "";

const thinButton = document.getElementById("thin") as HTMLButtonElement;
const thickButton = document.getElementById("thick") as HTMLButtonElement;
const sticker1 = document.getElementById("sticker1") as HTMLButtonElement;
const sticker2 = document.getElementById("sticker2") as HTMLButtonElement;
const sticker3 = document.getElementById("sticker3") as HTMLButtonElement;

function selectButton(button: HTMLButtonElement) {
  document.querySelectorAll<HTMLButtonElement>("#tools button").forEach((b) =>
    b.classList.remove("selectedTool")
  );
  button.classList.add("selectedTool");
}

thinButton.addEventListener("click", () => {
  currentTool = "thin";
  currentThickness = 1;
  selectButton(thinButton);
  canvas.dispatchEvent(new Event("tool-moved"));
});

thickButton.addEventListener("click", () => {
  currentTool = "thick";
  currentThickness = 5;
  selectButton(thickButton);
  canvas.dispatchEvent(new Event("tool-moved"));
});

sticker1.addEventListener("click", () => {
  currentTool = "sticker";
  currentSticker = "😀";
  selectButton(sticker1);
  canvas.dispatchEvent(new Event("tool-moved"));
});

sticker2.addEventListener("click", () => {
  currentTool = "sticker";
  currentSticker = "🌸";
  selectButton(sticker2);
  canvas.dispatchEvent(new Event("tool-moved"));
});

sticker3.addEventListener("click", () => {
  currentTool = "sticker";
  currentSticker = "🚀";
  selectButton(sticker3);
  canvas.dispatchEvent(new Event("tool-moved"));
});

canvas.addEventListener("mousedown", (e: MouseEvent) => {
  if (currentTool === "thin" || currentTool === "thick") {
    currentCommand = new MarkerLine(e.offsetX, e.offsetY, currentThickness);
  } else if (currentTool === "sticker" && currentSticker) {
    currentCommand = new StickerCommand(e.offsetX, e.offsetY, currentSticker);
  }
  if (currentCommand) {
    drawing.push(currentCommand);
    redoStack = [];
    toolPreview = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
  if (currentCommand) {
    currentCommand.drag(e.offsetX, e.offsetY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    if (currentTool === "thin" || currentTool === "thick") {
      toolPreview = new ToolPreview(e.offsetX, e.offsetY, currentThickness);
    } else if (currentTool === "sticker" && currentSticker) {
      toolPreview = new StickerPreview(e.offsetX, e.offsetY, currentSticker);
    }
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

canvas.addEventListener("mouseup", () => {
  currentCommand = null;
});

canvas.addEventListener("mouseleave", () => {
  toolPreview = null;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

function redraw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of drawing) cmd.display(context);
  if (toolPreview) toolPreview.display(context);
}

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

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
