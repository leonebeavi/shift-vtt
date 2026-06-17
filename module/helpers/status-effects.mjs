/**
 * SHIFT VTT — status effects de marcadores coloridos.
 *
 * O SHIFT esconde a paleta de condições padrão do Foundry e a substitui por um
 * pequeno conjunto de marcadores coloridos (as cinco cores de dado + rosa, roxo
 * e azul). Cada marcador é um status effect comum do Foundry cujo ícone é um
 * quadrado branco de cantos arredondados tingido com a cor do marcador, de modo
 * que o core o renderiza como um selo colorido no canto do Token; a mesma ideia
 * usada pelo módulo "Token Color Marker", reimplementada aqui (aquele módulo é
 * GPLv3; nenhum trecho do código dele foi copiado).
 *
 * O GM edita a lista (nome + cor) no submenu de configurações Status Effects;
 * a lista escolhida é armazenada na configuração de mundo `statusEffects` e
 * reconstruída em CONFIG.statusEffects ao vivo sempre que muda.
 */

/** Ícone de quadrado branco com cantos arredondados; o Foundry o tinge com a cor de cada marcador. */
const MARKER_IMG = "systems/shift-vtt/assets/markers/marker.svg";

/** SVG transparente de 1 quadro: usado para esvaziar o <img> do Token HUD, de
 *  modo que a amostra do CSS (cor de fundo) apareça no lugar da arte branca do marcador. */
const BLANK_IMG = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E";

/**
 * As oito cores de marcador do sistema (cores de dado + rosa + roxo + azul).
 * Espelha a paleta LESS (@leaf-d4 … @violet); mantida em sincronia manualmente
 * porque o JS não consegue ler variáveis LESS.
 */
export const MARKER_PALETTE = [
  "#12aa5b", // d4  · verde
  "#addd27", // d6  · lima
  "#ffc511", // d8  · amarelo
  "#f07d39", // d10 · laranja
  "#de2b54", // d12 · vermelho
  "#ff5fa2", // rosa
  "#9a5cf0", // roxo
  "#2f9fd0"  // azul
];

/**
 * Marcadores padrão selecionados, um por cor da paleta. `label` aqui é uma
 * chave de localização; é localizada quando exibida no editor e pelo Foundry no
 * Token/HUD. Totalmente editável no submenu Status Effects.
 */
// Ordenados de cima→baixo: Steady, Empowered, Rattled, Exposed, Hurt, Marked, Hidden,
// Focused. Empowered e Hidden trocam de cor (Empowered = lima, Hidden = roxo).
export const DEFAULT_STATUS_EFFECTS = [
  { id: "shift-steady",    label: "SHIFT.Status.Steady",    color: "#12aa5b" },
  { id: "shift-empowered", label: "SHIFT.Status.Empowered", color: "#addd27" },
  { id: "shift-rattled",   label: "SHIFT.Status.Rattled",   color: "#ffc511" },
  { id: "shift-exposed",   label: "SHIFT.Status.Exposed",   color: "#f07d39" },
  { id: "shift-hurt",      label: "SHIFT.Status.Hurt",      color: "#de2b54" },
  { id: "shift-marked",    label: "SHIFT.Status.Marked",    color: "#ff5fa2" },
  { id: "shift-hidden",    label: "SHIFT.Status.Hidden",    color: "#9a5cf0" },
  { id: "shift-focused",   label: "SHIFT.Status.Focused",   color: "#2f9fd0" }
];

/** Snapshot dos status effects nativos do Foundry, capturado uma única vez antes
 *  de os limparmos, para que os mecanicamente especiais possam ser preservados. */
let nativeStatusEffects = null;

/** Mapa de id → tint, reconstruído a cada apply; alimenta as amostras do Token HUD. */
const statusTints = new Map();

/** Lê CONFIG.statusEffects de forma portável (Proxy com chaves do V14 ou um array simples). */
function readStatusEffects() {
  try {
    if (foundry.utils.iterateValues) return Array.from(foundry.utils.iterateValues(CONFIG.statusEffects));
  } catch (err) { /* segue para o spread do array */ }
  return Array.from(CONFIG.statusEffects ?? []);
}

/** A lista de marcadores persistida (linhas customizadas se definidas, senão os padrões). */
function rawStatusEffects() {
  const custom = game.settings.get("shift-vtt", "statusEffects") ?? [];
  return custom.length ? custom : DEFAULT_STATUS_EFFECTS;
}

/**
 * A lista de marcadores para o editor, com os labels localizados (padrões) ou
 * mantidos como o GM os digitou (linhas customizadas).
 */
export function getStatusEffects() {
  const custom = game.settings.get("shift-vtt", "statusEffects") ?? [];
  if (custom.length) return custom.map(s => ({ ...s }));
  return DEFAULT_STATUS_EFFECTS.map(s => ({ id: s.id, label: game.i18n.localize(s.label), color: s.color }));
}

/**
 * Reconstrói CONFIG.statusEffects a partir da lista de marcadores armazenada.
 * Limpa os padrões do Foundry (para que não apareçam mais), instala os
 * marcadores do SHIFT e então readiciona os status mecanicamente especiais
 * (defeated/invisible/blind/…) como entradas ocultas, para que o combate e a
 * visão do core continuem funcionando.
 */
export function applyStatusEffects() {
  // Captura a lista nativa exatamente uma vez, antes da primeira limpeza.
  if (nativeStatusEffects === null) nativeStatusEffects = readStatusEffects().map(e => ({ ...e }));

  const list = rawStatusEffects();
  statusTints.clear();

  // Limpa cada entrada padrão (o Proxy do V14 também espelha isso no seu mapa com chaves).
  CONFIG.statusEffects.length = 0;

  for (const s of list) {
    if (!s?.id) continue;
    const tint = s.color || "#ffffff";
    CONFIG.statusEffects.push({ id: s.id, name: s.label, img: MARKER_IMG, tint });
    statusTints.set(s.id, tint);
  }

  preserveSpecialStatuses();
}

/**
 * Readiciona qualquer status id referenciado por CONFIG.specialStatusEffects que
 * nossa lista descartou, oculto do HUD. Sem isso, o "mark defeated", o culling de
 * invisibilidade e o modo de visão cego quebram silenciosamente.
 */
function preserveSpecialStatuses() {
  const special = CONFIG.specialStatusEffects ?? {};
  const present = new Set(readStatusEffects().map(e => e.id));
  for (const id of Object.values(special)) {
    if (!id || present.has(id)) continue;
    const native = nativeStatusEffects?.find(e => e.id === id);
    if (!native) continue;
    CONFIG.statusEffects.push({ ...native, hud: false });
    present.add(id);
  }
}

/**
 * Hook de renderização do Token HUD: transforma os ícones nativos de status
 * effect em amostras de cor do SHIFT. O core continua dono do comportamento de
 * clicar-para-alternar; nós apenas reestilizamos.
 */
function onRenderTokenHUD(app, html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  for (const el of root.querySelectorAll(".effect-control[data-status-id]")) {
    const tint = statusTints.get(el.dataset.statusId);
    if (!tint) continue;
    el.classList.add("shift-status-swatch");
    el.style.setProperty("--marker-color", tint);
    // Esvazia a arte branca para que a cor da amostra do CSS apareça.
    if (el.tagName === "IMG") el.setAttribute("src", BLANK_IMG);
  }
}

/**
 * Liga o sistema de status de marcadores coloridos. Registra o hook de
 * reestilização do HUD e constrói CONFIG.statusEffects no `setup` (settings e
 * i18n já prontos, e os padrões nativos ainda presentes para o snapshot).
 */
export function registerStatusEffects() {
  Hooks.on("renderTokenHUD", onRenderTokenHUD);
  Hooks.once("setup", () => applyStatusEffects());
}
