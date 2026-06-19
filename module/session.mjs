/**
 * SHIFT VTT — gerenciamento de sessão.
 *
 * Uma "sessão" é definida manualmente pelo GM: os contadores de XP por sessão
 * (e os usos de Technique "por sessão") só zeram quando o GM inicia uma nova.
 * Não há relógio automático. Este módulo fornece:
 *   - um botão "New Session", só para o GM, na barra de controles de cena do Token;
 *   - um prompt opcional quando o GM (primário) entra, perguntando se uma nova
 *     sessão começou antes de resetar todos os characters do mundo.
 */
import { fvtt } from "./helpers/utils.mjs";

/** Todo Actor character do mundo; o limite de XP se aplica aos characters. */
function worldCharacters() {
  return game.actors.filter(a => a.type === "character");
}

/** Se dois timestamps caem no mesmo dia do calendário (horário local). */
function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

/**
 * Reseta a contabilidade de sessão de todos os characters do mundo e anuncia
 * a nova sessão no chat.
 * @param {object} [opts]
 * @param {boolean} [opts.announce=true]
 */
export async function startSession({ announce = true } = {}) {
  const chars = worldCharacters();
  for (const a of chars) {
    try { await a.newSession(); } catch (err) { /* sem permissão para este actor */ }
  }
  try { await game.settings.set("shift-vtt", "lastSessionStart", Date.now()); } catch (err) { /* sem efeito */ }

  if (announce) {
    await ChatMessage.create({
      content: `<div class="shift-vtt chat-card info-card combat">
        <h3><i class="fa-solid fa-flag-checkered"></i> ${game.i18n.localize("SHIFT.Session.Title")}</h3>
        <p>${game.i18n.format("SHIFT.Session.Reset", { count: chars.length })}</p>
      </div>`
    });
  }
  ui.notifications.info(game.i18n.localize("SHIFT.Session.Started"));
}

/**
 * Pede confirmação do GM antes de resetar. A resposta padrão é "não", então um
 * Enter/Escape acidental (por exemplo num reload sem querer) nunca apaga o progresso.
 */
export async function promptNewSession() {
  const last = game.settings.get("shift-vtt", "lastSessionStart") ?? 0;
  const lastLine = last
    ? `<p class="hint">${game.i18n.format("SHIFT.Session.LastStart", { date: new Date(last).toLocaleString() })}</p>`
    : "";

  let result = null;
  try {
    result = await fvtt.DialogV2.wait({
      window: { title: game.i18n.localize("SHIFT.Session.Title") },
      classes: ["shift-vtt", "shift-dialog"],
      position: { width: 380 },
      content: `<div class="shift-prompt session-prompt"><p>${game.i18n.localize("SHIFT.Session.Prompt")}</p>${lastLine}</div>`,
      rejectClose: false,
      buttons: [
        { action: "yes", label: game.i18n.localize("SHIFT.Session.Confirm"), icon: "fa-solid fa-flag-checkered" },
        { action: "no", label: game.i18n.localize("SHIFT.Common.Cancel"), icon: "fa-solid fa-xmark", default: true }
      ]
    });
  } catch (err) { result = null; }

  if (result === "yes") await startSession();
}

export function registerSession() {
  // Botão só para o GM na barra de controles de cena do Token.
  Hooks.on("getSceneControlButtons", controls => {
    if (!game.user.isGM || !controls?.tokens?.tools) return;
    controls.tokens.tools["shift-new-session"] = {
      name: "shift-new-session",
      title: "SHIFT.Session.Title",
      icon: "fa-solid fa-flag-checkered",
      button: true,
      order: 97,
      onChange: () => promptNewSession()
    };
  });

  // No login, pergunta ao GM (primário) se uma nova sessão começou, mas não se
  // uma sessão já foi iniciada hoje (evita insistir a cada F5/reconexão). O botão
  // da barra lateral ignora isso e sempre pergunta.
  Hooks.once("ready", () => {
    if (!game.user.isGM) return;
    // Com vários GMs conectados, só o ativo é consultado.
    const activeGM = game.users?.activeGM;
    if (activeGM && activeGM.id !== game.user.id) return;
    if (!game.settings.get("shift-vtt", "promptSessionOnLogin")) return;
    const last = game.settings.get("shift-vtt", "lastSessionStart") ?? 0;
    if (last && isSameDay(last, Date.now())) return;
    promptNewSession();
  });
}
