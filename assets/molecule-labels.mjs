// Draws an atom label into a canvas. Both renderers use it, so labels look the same and
// support font weight, family, and text outline, which 3Dmol's own labels do not.

export const labelFonts = {
  'sans-serif': 'sans-serif',
  system: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  arial: 'Arial, sans-serif',
  helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  georgia: 'Georgia, serif',
  times: '"Times New Roman", Times, serif',
  courier: '"Courier New", Courier, monospace',
  monospace: 'ui-monospace, Menlo, Consolas, monospace',
};

function rgba(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16 & 255}, ${value >> 8 & 255}, ${value & 255}, ${alpha})`;
}

// Sizes are in output pixels: callers multiply CSS sizes by the render scale.
export function drawLabelCanvas(canvas, text, {fontSize, fontFamily, fontWeight, color, background, backgroundOpacity, padding, outlineWidth, outlineColor}) {
  const context = canvas.getContext('2d');
  const font = `${fontWeight} ${fontSize}px ${labelFonts[fontFamily] || labelFonts['sans-serif']}`;
  context.font = font;
  const textWidth = context.measureText(text).width;
  canvas.width = Math.max(1, Math.ceil(textWidth + 2 * (padding + outlineWidth)));
  canvas.height = Math.max(1, Math.ceil(fontSize * 1.25 + 2 * padding));
  context.font = font;
  if (backgroundOpacity > 0) {
    context.fillStyle = rgba(background, backgroundOpacity);
    context.beginPath();
    if (context.roundRect) context.roundRect(0, 0, canvas.width, canvas.height, Math.min(canvas.height / 4, fontSize / 3));
    else context.rect(0, 0, canvas.width, canvas.height);
    context.fill();
  }
  const x = padding + outlineWidth;
  const y = padding + fontSize;
  if (outlineWidth > 0) {
    context.lineJoin = 'round';
    context.lineWidth = 2 * outlineWidth;
    context.strokeStyle = outlineColor;
    context.strokeText(text, x, y);
  }
  context.fillStyle = color;
  context.fillText(text, x, y);
  return canvas;
}
