import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

export {};

const title = document.createElement("h1");
title.textContent = "🎨 Creative Sketchpad";

const canvas = document.createElement("canvas");
canvas.id = "myCanvas";
canvas.width = 256;
canvas.height = 256;

const tools = document.createElement("div");
tools.id = "tools";

const thinButton = document.createElement("button");
thinButton.id = "thin";
thinButton.type = "button";
thinButton.textContent = "✏️ Sketch Pen";

const thickButton = document.createElement("button");
thickButton.id = "thick";
thickButton.type = "button";
thickButton.textContent = "🖌️ Paint Brush";

const stickerButtonsDiv = document.createElement("div");
stickerButtonsDiv.id = "stickerButtons";

const addStickerButton = document.createElement("button");
addStickerButton.id = "addSticker";
addStickerButton.type = "button";
addStickerButton.textContent = "➕ Custom Sticker";

tools.append(thinButton, thickButton, stickerButtonsDiv, addStickerButton);

const exampleP = document.createElement("p");
exampleP.innerText = "Example image asset: ";
const exampleImg = document.createElement("img");
exampleImg.src = exampleIconUrl as string;
exampleImg.className = "icon";
exampleP.append(exampleImg);

document.body.append(title, canvas, tools, exampleP);

interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}
interface Draggable {
  drag(x: number, y: number): void;
}

class MarkerLine implements Drawable, Draggable {
  private readonly points: { x: number; y: number }[];
  private readonly thickness: number;
  constructor(x: number, y: number, thickness: number) {
    this.thickness = thickness;
    this.points = [{ x, y }];
  }
  drag(x: number, y: number): void {
    this.points.push({ x, y });
  }
  display(ctx: CanvasRenderingContext2D): void {
    if (this.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
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
  constructor(
    private readonly x: number,
    private readonly y: number,
    private readonly thickness: number,
  ) {}
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
  constructor(
    private readonly x: number,
    private readonly y: number,
    private readonly sticker: string,
  ) {}
  display(ctx: CanvasRenderingContext2D): void {
    ctx.font = "36px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

class StickerCommand implements Drawable, Draggable {
  constructor(
    private x: number,
    private y: number,
    private readonly sticker: string,
  ) {}
  drag(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
  display(ctx: CanvasRenderingContext2D): void {
    ctx.font = "36px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

function get2DContext(canvasEl: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvasEl.getContext("2d");
  if (!context) throw new Error("Unable to get 2D rendering context");
  return context;
}

const ctx = get2DContext(canvas);

type Command = MarkerLine | StickerCommand;
type Preview = ToolPreview | StickerPreview;

let drawing: Command[] = [];
let redoStack: Command[] = [];
let currentCommand: Command | null = null;
let toolPreview: Preview | null = null;

let currentTool: "thin" | "thick" | "sticker" = "thin";
let currentThickness = 2.5;
let currentSticker = "";

const availableStickers: string[] = ["🎨", "🐾", "🌈", "⭐", "✨"];

function selectButton(button: HTMLButtonElement): void {
  const all = tools.querySelectorAll<HTMLButtonElement>("button");
  all.forEach((b) => b.classList.remove("selectedTool"));
  button.classList.add("selectedTool");
}

function renderStickerButtons(): void {
  stickerButtonsDiv.innerHTML = "";
  availableStickers.forEach((sticker) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = sticker;
    btn.addEventListener("click", () => {
      currentTool = "sticker";
      currentSticker = sticker;
      selectButton(btn);
      canvas.dispatchEvent(new Event("tool-moved"));
    });
    stickerButtonsDiv.appendChild(btn);
  });
}

renderStickerButtons();

thinButton.addEventListener("click", () => {
  currentTool = "thin";
  currentThickness = 2.5;
  selectButton(thinButton);
  canvas.dispatchEvent(new Event("tool-moved"));
});

thickButton.addEventListener("click", () => {
  currentTool = "thick";
  currentThickness = 7;
  selectButton(thickButton);
  canvas.dispatchEvent(new Event("tool-moved"));
});

addStickerButton.addEventListener("click", () => {
  const maybe = prompt("Enter a new sticker (emoji or text):", "💡");
  if (!maybe) return;
  const trimmed = maybe.trim();
  if (trimmed.length === 0) return;
  availableStickers.push(trimmed);
  renderStickerButtons();
});

canvas.addEventListener("mousedown", (ev) => {
  if (currentTool === "thin" || currentTool === "thick") {
    currentCommand = new MarkerLine(ev.offsetX, ev.offsetY, currentThickness);
  } else if (currentTool === "sticker" && currentSticker) {
    currentCommand = new StickerCommand(ev.offsetX, ev.offsetY, currentSticker);
  }
  if (currentCommand) {
    drawing.push(currentCommand);
    redoStack = [];
    toolPreview = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mousemove", (ev) => {
  if (currentCommand) {
    currentCommand.drag(ev.offsetX, ev.offsetY);
    canvas.dispatchEvent(new Event("drawing-changed"));
    return;
  }
  if (currentTool === "thin" || currentTool === "thick") {
    toolPreview = new ToolPreview(ev.offsetX, ev.offsetY, currentThickness);
  } else if (currentTool === "sticker" && currentSticker) {
    toolPreview = new StickerPreview(ev.offsetX, ev.offsetY, currentSticker);
  } else {
    toolPreview = null;
  }
  canvas.dispatchEvent(new Event("tool-moved"));
});

canvas.addEventListener("mouseup", () => (currentCommand = null));
canvas.addEventListener("mouseleave", () => {
  toolPreview = null;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

function redraw(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of drawing) cmd.display(ctx);
  if (toolPreview) toolPreview.display(ctx);
}

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

const buttonBar = document.createElement("div");
buttonBar.style.marginTop = "1em";

const clearButton = document.createElement("button");
clearButton.textContent = "🧹 Clear";

const undoButton = document.createElement("button");
undoButton.textContent = "↩️ Undo";

const redoButton = document.createElement("button");
redoButton.textContent = "↪️ Redo";

const exportButton = document.createElement("button");
exportButton.textContent = "💾 Export PNG";

buttonBar.append(clearButton, undoButton, redoButton, exportButton);
document.body.append(buttonBar);

clearButton.addEventListener("click", () => {
  drawing = [];
  redoStack = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

undoButton.addEventListener("click", () => {
  const last = drawing.pop();
  if (last) redoStack.push(last);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

redoButton.addEventListener("click", () => {
  const restored = redoStack.pop();
  if (restored) drawing.push(restored);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = get2DContext(exportCanvas);
  exportCtx.scale(4, 4);
  for (const cmd of drawing) cmd.display(exportCtx);
  const dataURL = exportCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "creative_sketchpad.png";
  link.click();
});
