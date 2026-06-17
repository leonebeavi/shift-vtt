/**
 * SHIFT VTT — distance ranges customizáveis + leitura ao passar o mouse sobre o canvas.
 *
 * SHIFT usa faixas de distância abstratas (Engaged / Close / Far / …), mas um
 * GM pode preferir unidades concretas (ft, m, o grid da cena). Isto liga as duas:
 * enquanto um único Token está controlado, passar o mouse sobre OUTRO Token desenha
 * a distância medida entre eles, mostrada como faixa abstrata, unidades numéricas ou
 * ambas (conforme o `rangeMode` do GM). As faixas são customizáveis pelo GM no submenu
 * Distance Ranges.
 */

/** As faixas de distância configuradas (linhas customizadas se definidas, senão os
 *  padrões com rótulos localizados). Cada faixa é { label, min, max } em unidades do
 *  grid da cena. */
export function getRanges() {
  const custom = game.settings.get("shift-vtt", "ranges") ?? [];
  if (custom.length) {
    return custom
      .map(r => ({ label: String(r.label ?? ""), min: Number(r.min) || 0, max: r.max == null || r.max === "" ? null : Number(r.max) }))
      .sort((a, b) => a.min - b.min);
  }
  return CONFIG.SHIFT.rangeBands.map(b => ({ label: game.i18n.localize(b.label), min: b.min, max: b.max }));
}

/** A faixa em que cai uma distância medida (min inclusivo, max exclusivo). */
function bandFor(distance) {
  // Ordenado por min crescente; `max` é INCLUSIVO, então um Token exatamente sobre
  // o limite (ex.: a 5 ft num grid de 5 ft) lê como a faixa MAIS PRÓXIMA (Engaged),
  // não a seguinte. Um epsilon mínimo absorve o ruído de medição de ponto flutuante.
  const d = distance + 1e-6;
  const bands = getRanges();
  return bands.find(b => d >= b.min && (b.max == null || distance <= b.max)) ?? bands[bands.length - 1] ?? null;
}

/* ------------------------------------------------------------------ */
/* Leitura ao passar o mouse (uma pequena placa acima do Token sob o cursor) */
/* ------------------------------------------------------------------ */

let readoutEl = null;

function ensureReadout() {
  if (readoutEl?.isConnected) return readoutEl;
  readoutEl = document.createElement("div");
  readoutEl.id = "shift-range-readout";
  readoutEl.className = "shift-vtt";
  document.body.appendChild(readoutEl);
  return readoutEl;
}

function hideReadout() {
  readoutEl?.classList.remove("visible");
}

/** Token de referência a partir do qual medir: o único Token controlado, quando não
 *  é o que está sob o cursor. (Sem referência → sem leitura.) */
function referenceToken(hovered) {
  const controlled = canvas.tokens?.controlled ?? [];
  if (controlled.length === 1 && controlled[0] !== hovered) return controlled[0];
  return null;
}

/** Mede a distância entre dois Tokens em unidades do grid da cena. */
function measure(a, b) {
  const p0 = { x: a.center.x, y: a.center.y };
  const p1 = { x: b.center.x, y: b.center.y };
  try {
    const r = canvas.grid.measurePath([p0, p1]);
    if (typeof r?.distance === "number") return r.distance;
  } catch (e) { /* segue adiante */ }
  try {
    const r = canvas.grid.measureDistance(p0, p1);
    if (typeof r === "number") return r;
  } catch (e) { /* segue adiante */ }
  // Fallback euclidiano expresso em unidades do grid.
  const px = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const size = canvas.grid?.size || 100;
  const perGrid = canvas.scene?.grid?.distance ?? canvas.grid?.distance ?? 5;
  return (px / size) * perGrid;
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

/** Mostra a placa de distância logo acima do Token sob o cursor (escura, arredondada, branca). */
function showReadout(from, to) {
  try {
    const distance = measure(from, to);
    const units = canvas.scene?.grid?.units || "";
    const band = bandFor(distance);
    const numeric = `${fmt(distance)}${units ? ` ${units}` : ""}`;
    const mode = game.settings.get("shift-vtt", "rangeMode") || "both";
    let text;
    if (mode === "units") text = numeric;
    else if (mode === "abstract") text = band?.label || numeric;
    else text = band?.label ? `${band.label} · ${numeric}` : numeric;

    const el = ensureReadout();
    el.textContent = text;
    // Ancora no centro-superior do Token sob o cursor, convertido para pixels de tela.
    const topY = (to.document?.y ?? (to.center.y - (to.h ?? 0) / 2));
    const p = canvas.stage.worldTransform.apply({ x: to.center.x, y: topY });
    el.style.left = `${Math.round(p.x)}px`;
    el.style.top = `${Math.round(p.y)}px`;
    el.classList.add("visible");
  } catch (err) {
    console.warn("shift-vtt | range readout failed", err);
    hideReadout();
  }
}

function onHoverToken(token, hovered) {
  if (!canvas?.ready) return;
  if (!game.settings.get("shift-vtt", "showTokenRanges")) return hideReadout();
  if (!hovered) return hideReadout();
  const ref = referenceToken(token);
  if (!ref || ref === token) return hideReadout();
  showReadout(ref, token);
}

/* ------------------------------------------------------------------ */
/* Registration                                                        */
/* ------------------------------------------------------------------ */

export function registerRanges() {
  Hooks.on("hoverToken", onHoverToken);
  // A placa é ancorada na tela; esconde-a quando o canvas se move/dá zoom ou é
  // desmontado, para nunca ficar parada num ponto desatualizado.
  Hooks.on("canvasPan", hideReadout);
  Hooks.on("canvasTearDown", hideReadout);

  // Alternância nos controles de Token: liga/desliga a leitura ao passar o mouse para você.
  Hooks.on("getSceneControlButtons", controls => {
    const tools = controls?.tokens?.tools;
    if (!tools) return;
    tools["shift-ranges"] = {
      name: "shift-ranges",
      title: "SHIFT.Ranges.ToggleTool",
      icon: "fa-solid fa-ruler-horizontal",
      toggle: true,
      active: game.settings.get("shift-vtt", "showTokenRanges"),
      order: 98,
      onChange: (event, active) => game.settings.set("shift-vtt", "showTokenRanges", active)
    };
  });
}
