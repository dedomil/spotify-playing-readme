module.exports = (barCount, isRainbow) => {
  let bars = "", css = "<style>", spectrum = ["#ff0000", "#ff4000", "#ff8000", "#ffbf00", "#ffff00", "#bfff00", "#80ff00", "#40ff00", "#00ff00", "#00ff40", "#00ff80", "#00ffbf", "#00ffff", "#00bfff", "#0080ff", "#0040ff", "#0000ff", "#4000ff", "#8000ff", "#bf00ff", "#ff00ff",];
  if (isRainbow) css += ".bar-container { animation-duration: 2s; }";
  for (let i = 0; i < barCount; i++) {
    bars += "<div class='bar'></div>";
    css += `.bar:nth-child(${i + 1}) { animation-duration: ${Math.floor(Math.random() * 251) + 500}ms; background: ${isRainbow ? spectrum[i] : "#24D255"}; }`
  }
  return `${bars}${css}</style>`
}
