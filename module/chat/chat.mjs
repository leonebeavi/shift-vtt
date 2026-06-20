/**
 * SHIFT VTT, interatividade dos cartões de chat.
 * Critical Success Bonuses, aplicação de shift no alvo, assistências em grupo
 * e coloração de mensagem por autor.
 */
import { dieLabel, fvtt, pickerRows, promptChoice, shiftSpeaker } from "../helpers/utils.mjs";
import { scaleEffect, rollScaleOf } from "../dice/resolution.mjs";
import { emitOrRun } from "../helpers/socket.mjs";

/* ------------------------------------------------------------------ */
/* Registro de hooks                                                   */
/* ------------------------------------------------------------------ */

export function registerChatHooks() {
  const bind = (message, html) => {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root || root.dataset.shiftRpgBound) return;
    root.dataset.shiftRpgBound = "1";

    // A cor do autor define a tonalidade e o contorno por mensagem (ver shift.less).
    const author = message.author ?? message.user;
    const color = author?.color?.toString?.() ?? author?.color;
    if (color) root.style.setProperty("--shift-user-color", color);

    root.querySelectorAll("[data-shift-crit]").forEach(btn => {
      btn.addEventListener("click", ev => onCritBonus(ev, message));
    });
    root.querySelectorAll("[data-shift-apply]").forEach(btn => {
      btn.addEventListener("click", ev => onApplyToTarget(ev, message));
    });
    root.querySelectorAll("[data-shift-join]").forEach(btn => {
      btn.addEventListener("click", ev => onJoinGroup(ev, message));
    });
    root.querySelectorAll("[data-shift-crewrestore]").forEach(btn => {
      btn.addEventListener("click", ev => onCrewRestore(ev, message));
    });
    root.querySelectorAll("[data-shift-turnorder]").forEach(btn => {
      btn.addEventListener("click", ev => onChatTurnOrder(ev, message));
    });
    root.querySelectorAll("[data-shift-scaleup]").forEach(btn => {
      btn.addEventListener("click", ev => { ev.preventDefault(); applyScaledUp(message); });
    });
    root.querySelectorAll("[data-shift-retarget]").forEach(btn => {
      btn.addEventListener("click", ev => onRetarget(ev, message));
    });
    // Preenche os chips de alvo a partir dos uuids persistidos (um único builder,
    // usado no primeiro render, no re-render do retarget e no reload).
    root.querySelectorAll(".target-panel").forEach(populateTargetPanel);
  };
  Hooks.on("renderChatMessageHTML", bind);

  // Entrada do menu de contexto (botão direito): gastar XP acumulado para Scale Up de um roll.
  // getChatMessageContextOptions é o hook do V13+/V14; getChatLogEntryContext é
  // o nome pré-V13, registrado apenas como fallback inofensivo para cores antigos (nunca
  // dispara no V14, então não gera entrada duplicada).
  const addScaleUpContext = (options) => {
    options.push({
      name: "SHIFT.Scale.XpScaleUp",
      icon: '<i class="fa-solid fa-up-right-and-down-left-from-center"></i>',
      condition: li => canXpScaleUp(messageFromLi(li)),
      callback: li => onXpScaleUp(messageFromLi(li))
    });
  };
  Hooks.on("getChatMessageContextOptions", (log, options) => addScaleUpContext(options));
  Hooks.on("getChatLogEntryContext", (html, options) => addScaleUpContext(options));
}

/** Resolve um ChatMessage a partir de um elemento de lista do menu de contexto
 *  (tolera tanto jQuery quanto HTMLElement, igual ao bind do renderChatMessageHTML). */
function messageFromLi(li) {
  const el = li instanceof HTMLElement ? li : li?.[0];
  const id = el?.dataset?.messageId;
  return id ? game.messages.get(id) : null;
}

/* ------------------------------------------------------------------ */
/* Scale: valor ao vivo, match de Scaled Up, re-resolução pós-roll     */
/* ------------------------------------------------------------------ */

/**
 * A Scale ao vivo de uma mensagem de Action Roll: a Scale base do roll recalculada
 * a partir do manifesto de Traits rolados, elevada por qualquer upgrade de Focus
 * via Scaled Up e por bumps de XP acumulado, limitada a 1..4. Cartões antigos sem
 * manifesto recorrem à flag congelada `rollerScale` (ainda respeitando `scaleBumps`).
 * @param {ChatMessage} message
 * @returns {number} 1..4
 */
function effectiveRollerScale(message) {
  const f = message?.flags?.["shift-vtt"] ?? {};
  const bumps = Number(f.scaleBumps) || 0;
  if (Array.isArray(f.traits) && f.traits.length) {
    return rollScaleOf(f.traits.map(t => t.scale ?? 1), { bumps, focusUpgrade: f.focusUpgrade ?? null });
  }
  return Math.min(4, (Number(f.rollerScale) || 1) + bumps);
}

/**
 * Encontra uma Technique "Scaled Up" possuída e disponível cujo Focus Trait
 * vinculado esteja entre os Traits que foram rolados. O Focus deve pertencer ao
 * próprio actor da Technique (correção de Working Together).
 * @param {Actor} actor o actor líder do roll
 * @param {string[]} rolledTraitUuids
 * @returns {{technique:Item, focusTrait:Item, focusUuid:string}|null}
 */
export function matchScaledUp(actor, rolledTraitUuids = []) {
  if (!actor) return null;
  const uuids = new Set(rolledTraitUuids);
  const techniques = actor.techniques ?? actor.items.filter(i => i.type === "technique");
  for (const tech of techniques) {
    if (!tech.isScaledUp || !tech.hasUse) continue;
    const focus = tech.focusTrait;
    if (focus && focus.actor === tech.actor && uuids.has(focus.uuid)) {
      return { technique: tech, focusTrait: focus, focusUuid: focus.uuid };
    }
  }
  return null;
}

/** Re-renderiza o pill de Scale de um cartão de Action Roll para a Scale ao vivo
 *  atual e persiste, para que reloads e outros clients vejam o boost. O botão
 *  "Apply to Target" (ainda presente no cartão) então resolve na nova Scale. */
async function reResolveScale(message) {
  const live = effectiveRollerScale(message);
  const base = Number(message.getFlag("shift-vtt", "rollerScale")) || 1;
  const boost = Math.max(0, live - base);
  try {
    const tpl = document.createElement("template");
    tpl.innerHTML = message.content ?? "";
    const tags = tpl.content.querySelector(".card-tags");
    if (tags) {
      let tag = tags.querySelector(".roll-tag.scale");
      if (!tag) {
        tag = document.createElement("span");
        tags.appendChild(tag);
      }
      tag.className = "roll-tag scale" + (boost > 0 ? " boosted" : "");
      tag.setAttribute("data-scale", String(live));
      const label = game.i18n.localize("SHIFT.Trait.Scale");
      tag.setAttribute("data-tooltip", `${label} ${live}`);
      // Com boost: mostra a Scale anterior riscada em cinza, depois a nova
      // Scale na cor dela; caso contrário, apenas o valor simples da Scale.
      tag.innerHTML = boost > 0
        ? `${label} <span class="scale-prev">${base}</span> <i class="fa-solid fa-arrow-right-long"></i> <span class="scale-new" data-scale="${live}">${live}</span>`
        : `${label} ${live}`;
      // Uma vez que um Scaled Up tenha sido aplicado a este cartão, remove seu botão.
      if (message.getFlag("shift-vtt", "scaledUp")) {
        tpl.content.querySelector(".action-row.scale-up")?.remove();
      }
      const root = tpl.content.firstElementChild;
      if (root) await message.update({ content: root.outerHTML });
    }
  } catch (err) {
    console.warn("shift-vtt | Scale re-render failed", err);
  }
}

/** Preenche o `.target-chips` de um cartão a partir dos uuids `data-targets` do
 *  painel: um retrato, nome e pill de Scale por alvo. `fromUuidSync` resolve actors
 *  de world/scene de forma síncrona, então isto roda no bind de render (síncrono)
 *  em todos os clients. */
function populateTargetPanel(panel) {
  const chips = panel.querySelector(".target-chips");
  if (!chips) return;
  const uuids = (panel.dataset.targets || "").split(",").map(s => s.trim()).filter(Boolean);
  const esc = foundry.utils.escapeHTML;
  const scaleWord = game.i18n.localize("SHIFT.Trait.Scale");
  const html = uuids.map(u => {
    let a = null;
    try { a = fromUuidSync(u); } catch (err) { a = null; }
    if (!a) return "";
    const scale = a.system?.scale ?? 1;
    // Pip de Scale no canto, só quando acima de Scale 1; o hover mostra "Scale N".
    const pip = scale > 1
      ? `<span class="t-scale" data-scale="${scale}" data-tooltip="${esc(scaleWord)} ${scale}">${scale}</span>`
      : "";
    return `<span class="target-chip" data-scale="${scale}">`
      + `<img src="${a.img}" alt=""/>`
      + `<span class="t-name">${esc(a.name)}</span>`
      + pip
      + `</span>`;
  }).join("");
  chips.innerHTML = html || `<span class="target-chip empty">${esc(game.i18n.localize("SHIFT.Target.None"))}</span>`;
}

/** Re-seleciona o(s) alvo(s) de um cartão de roll e persiste a escolha, para que o
 *  botão Apply mire de novo. Players escolhem alvos livremente, sem intervenção do GM. */
async function onRetarget(event, message) {
  event.preventDefault();
  const actor = await getMessageActor(message);
  if (!actor) return;
  if (!canActOnCard(actor)) {
    return void ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NotOwner"));
  }
  if (message.getFlag("shift-vtt", "applied")) {
    return void ui.notifications.info(game.i18n.localize("SHIFT.Target.AlreadyApplied"));
  }
  const target = await resolveTargetActor(actor, {});
  if (!target) return;
  try {
    const tpl = document.createElement("template");
    tpl.innerHTML = message.content ?? "";
    const panel = tpl.content.querySelector(".target-panel");
    if (panel) panel.setAttribute("data-targets", target.uuid);
    await message.update({
      content: tpl.content.firstElementChild?.outerHTML ?? message.content,
      "flags.shift-vtt.targetUuids": [target.uuid]
    });
  } catch (err) {
    console.warn("shift-vtt | Retarget failed", err);
  }
}

/** Resultado de um roll sem efeito por causa da Scale, escrito como nota persistente
 *  no chat (não um toast que some), para que o log registre que um Success não causou nada. */
async function noEffectNote(sourceActor, target, gap, trait = null) {
  const text = trait
    ? game.i18n.format(gap <= -2 ? "SHIFT.Scale.NoEffectTrait" : "SHIFT.Scale.TooSmallTrait", { trait: trait.name })
    : game.i18n.localize(gap <= -2 ? "SHIFT.Scale.NoEffect" : "SHIFT.Scale.TooSmall");
  ui.notifications.warn(text);
  await followUp(sourceActor, text, "warn");
}

/* ------------------------------------------------------------------ */
/* Scaled Up Technique: botão do cartão                                */
/* ------------------------------------------------------------------ */

/** Aplica uma Technique Scaled Up a partir de um cartão de roll: faz ShiftDown de
 *  um Core Trait escolhido e trata o Focus Trait vinculado na Scale configurada
 *  (padrão 2) para este resultado, então re-resolve a Scale do cartão. Uso único
 *  por cartão. */
async function applyScaledUp(message) {
  // Guard de re-entrância síncrono ANTES de qualquer await: dois cliques rápidos
  // (ou dois clientes) não podem ambos cobrar o custo antes de a flag scaledUp gravar.
  if (cardActionInFlight.has(message.id)) return;
  cardActionInFlight.add(message.id);
  try {
    const flags = message.flags?.["shift-vtt"] ?? {};
    const actor = await getMessageActor(message);
    if (!actor) return;
    if (!canActOnCard(actor)) {
      return void ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NotOwner"));
    }
    if (flags.scaledUp) {
      return void ui.notifications.info(game.i18n.localize("SHIFT.Scale.ScaledUpAlready"));
    }
    const rolledUuids = (flags.traits ?? []).map(t => t.uuid);
    const match = matchScaledUp(actor, rolledUuids);
    if (!match) {
      return void ui.notifications.warn(game.i18n.localize("SHIFT.Scale.ScaledUpUnavailable"));
    }

    // Localiza o Focus vinculado no manifesto ANTES de cobrar qualquer coisa: sem um
    // índice válido o upgrade de Scale seria um no-op, então nunca pague por ele.
    const index = (flags.traits ?? []).findIndex(t => t.uuid === match.focusUuid);
    if (index < 0) {
      return void ui.notifications.warn(game.i18n.localize("SHIFT.Scale.ScaledUpUnavailable"));
    }

    // Paga o custo: faz ShiftDown de um Core Trait. Aborta (sem gastar nada) se cancelado.
    const core = await pickTrait(actor, {
      title: game.i18n.format("SHIFT.Scale.ScaledUpPickCore", { focus: match.focusTrait.name }),
      hint: game.i18n.localize("SHIFT.Scale.ScaleUpHint"),
      filter: t => t.system.category === "core" && t.canShiftDown
    });
    if (!core) return;

    // O cartão pode ter sido deletado entre o clique e aqui; nesse caso aborta ANTES de
    // cobrar qualquer custo, para não fazer ShiftDown/gastar uso sem registrar o upgrade.
    if (!game.messages.get(message.id)) {
      return void ui.notifications.warn(game.i18n.localize("SHIFT.Scale.ScaledUpUnavailable"));
    }

    await core.shiftDown({});
    await match.technique.spendUse();

    const focusScale = match.technique.system.focus?.scale ?? 2;
    await message.update({
      "flags.shift-vtt.focusUpgrade": { index, scale: focusScale },
      "flags.shift-vtt.scaledUp": { traitUuid: match.focusUuid, techniqueUuid: match.technique.uuid }
    });
    await reResolveScale(message);
    await followUp(actor, game.i18n.format("SHIFT.Scale.ScaledUpChat", {
      actor: foundry.utils.escapeHTML(actor.name),
      focus: foundry.utils.escapeHTML(match.focusTrait.name),
      core: foundry.utils.escapeHTML(core.name),
      scale: focusScale
    }), "crit");
  } finally {
    cardActionInFlight.delete(message.id);
  }
}

/* ------------------------------------------------------------------ */
/* XP Scale-Up: menu de contexto do chat                               */
/* ------------------------------------------------------------------ */

/** Se quem está vendo pode gastar XP acumulado para fazer Scale Up do roll desta
 *  mensagem. DEVE ser síncrona (o Foundry chama condições de menu de contexto de
 *  forma síncrona). */
function canXpScaleUp(message) {
  if (!message) return false;
  const f = message.flags?.["shift-vtt"];
  if (f?.kind !== "actionRoll") return false;
  if (game.settings.get("shift-vtt", "enableScale") === false) return false;
  if (!game.settings.get("shift-vtt", "enableXpScaleUp")) return false;
  const actor = f.actorUuid ? fromUuidSync(f.actorUuid) : null;
  if (!actor || actor.type !== "character") return false;
  if (!canActOnCard(actor)) return false;
  const cost = game.settings.get("shift-vtt", "xpPerScaleStep") ?? 2;
  if ((actor.system.xp?.value ?? 0) < cost) return false;
  return effectiveRollerScale(message) < 4;
}

/** Gasta XP acumulado (um passo = +1 Scale) para elevar a Scale deste roll. Repetível
 *  enquanto o XP permitir e o roll estiver abaixo de Scale 4. */
async function onXpScaleUp(message) {
  if (!message) return;
  // Guard de re-entrância síncrono ANTES de qualquer await (o item de menu de contexto
  // não tem botão para desabilitar), para não gastar XP duas vezes num duplo-disparo.
  if (cardActionInFlight.has(message.id)) return;
  cardActionInFlight.add(message.id);
  try {
    const flags = message.flags?.["shift-vtt"] ?? {};
    const actor = await getMessageActor(message);
    if (!actor || actor.type !== "character") return;
    if (!canActOnCard(actor)) {
      return void ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NotOwner"));
    }
    if (effectiveRollerScale(message) >= 4) {
      return void ui.notifications.info(game.i18n.localize("SHIFT.Scale.AtMax"));
    }
    const cost = game.settings.get("shift-vtt", "xpPerScaleStep") ?? 2;
    // Aborta antes de gastar XP se o cartão sumiu entre o disparo e aqui.
    if (!game.messages.get(message.id)) return;
    const spent = await actor.spendXP(cost);
    if (!spent) {
      return void ui.notifications.warn(game.i18n.format("SHIFT.Scale.XpInsufficient", { cost }));
    }
    await message.update({ "flags.shift-vtt.scaleBumps": (Number(flags.scaleBumps) || 0) + 1 });
    await reResolveScale(message);
    await followUp(actor, game.i18n.format("SHIFT.Scale.XpBoostChat", {
      actor: foundry.utils.escapeHTML(actor.name),
      xp: spent,
      scale: effectiveRollerScale(message)
    }), "xp");
  } finally {
    cardActionInFlight.delete(message.id);
  }
}

/* ------------------------------------------------------------------ */
/* Helpers compartilhados                                              */
/* ------------------------------------------------------------------ */

async function getMessageActor(message) {
  const uuid = message.getFlag("shift-vtt", "actorUuid");
  return uuid ? fromUuid(uuid) : null;
}

/** Quem pode operar os botões/ações de um cartão de roll: o owner do Actor rolado
 *  (convenção OWNER do sistema) ou o GM. Usado por todos os botões EXCETO
 *  onApplyToTarget, que tem seu próprio gate downstream (canUserModify + relay-GM). */
function canActOnCard(actor) {
  return !!(actor?.isOwner || game.user.isGM);
}

/** Cartões cujo handler de custo está em execução, para impedir re-entrância
 *  (duplo-clique / clientes concorrentes) entre o check de flag e a gravação. */
const cardActionInFlight = new Set();

export async function pickTrait(actor, { title, hint, filter, scale = null } = {}) {
  const traits = (actor.traits ?? actor.items.filter(i => i.type === "trait")).filter(filter ?? (() => true));
  if (!traits.length) {
    ui.notifications.info(game.i18n.localize("SHIFT.Warnings.NoEligibleTraits"));
    return null;
  }
  // Cada linha carrega a Scale efetiva do seu Trait e a flag de override, para que um
  // Trait com override mostre um pip de Scale no picker (Working Together, alvo).
  const rows = pickerRows(traits.map(t => ({
    value: t.id,
    name: t.name,
    img: CONFIG.SHIFT.diceImages[t.statusKey],
    sub: dieLabel(t.statusKey),
    scale: t.effectiveScale,
    isScaled: t.scaleIsOverride
  })), { radioName: "trait" });
  // Um chip de Scale opcional (ex.: a Scale do próprio alvo) sinalizado no cabeçalho.
  const scaleWord = foundry.utils.escapeHTML(game.i18n.localize("SHIFT.Trait.Scale"));
  // Só exibe a Scale do alvo quando ela está acima de 1 (Scale 1 é o padrão e não
  // carrega significado aqui).
  const scaleChip = (scale != null && scale > 1)
    ? `<span class="dialog-scale-chip" data-scale="${scale}" data-tooltip="${scaleWord} ${scale}">${scaleWord} ${scale}</span>`
    : "";
  const header = (hint || scaleChip)
    ? `<div class="pick-header">${hint ? `<span class="hint">${foundry.utils.escapeHTML(hint)}</span>` : ""}${scaleChip}</div>`
    : "";
  const content = `
    <div class="shift-prompt trait-pick">
      ${header}
      <div class="trait-opts">${rows}</div>
    </div>`;
  let id = null;
  try {
    id = await fvtt.DialogV2.prompt({
      window: { title },
      position: { width: 340 },
      classes: ["shift-vtt", "shift-dialog"],
      content,
      rejectClose: false,
      ok: {
        label: game.i18n.localize("SHIFT.Common.Confirm"),
        callback: (event, button) => button.form.elements.trait.value
      }
    });
  } catch (err) { id = null; }
  return id ? actor.items.get(id) : null;
}

async function followUp(actor, text, css = "crit") {
  await ChatMessage.create({
    speaker: shiftSpeaker(actor),
    content: `<div class="shift-vtt chat-card info-card ${css}"><p><i class="fa-solid fa-star"></i> ${text}</p></div>`
  });
}

/** Disposition do Token de um actor (hostis primeiro nos pickers). */
function dispositionOf(actor) {
  const D = CONST.TOKEN_DISPOSITIONS;
  const token = canvas?.tokens?.placeables?.find(t => t.actor === actor);
  const value = token?.document?.disposition ?? actor.prototypeToken?.disposition ?? D.NEUTRAL;
  if (value === D.HOSTILE) return { key: "hostile", order: 0 };
  if (value === D.NEUTRAL) return { key: "neutral", order: 1 };
  if (value === D.FRIENDLY) return { key: "friendly", order: 2 };
  return { key: "secret", order: 3 };
}

/**
 * Picker de actor estilizado: avatares e trilhas de cor por disposition (hostis
 * primeiro), idêntico ao diálogo "Choose a target". 0 candidatos → null; exatamente
 * um → auto-selecionado (sem prompt). Compartilhado pelo picker de alvo e pelo picker
 * de aliado, para que todo passo de "escolher um actor" tenha a mesma aparência.
 */
async function pickActor(actors, { title, hint, showScale = false } = {}) {
  const list = (actors ?? []).filter(Boolean);
  if (!list.length) return null;
  if (list.length === 1) return list[0];

  const rows = pickerRows(
    list
      .map(a => ({ actor: a, disp: dispositionOf(a) }))
      .sort((x, y) => x.disp.order - y.disp.order || x.actor.name.localeCompare(y.actor.name))
      .map(r => ({
        value: r.actor.uuid,
        name: r.actor.name,
        img: r.actor.img,
        sub: game.i18n.localize(`SHIFT.Disposition.${r.disp.key}`),
        rowClass: `target-opt ${r.disp.key}`,
        subClass: "disp",
        // Mostra a Scale de cada candidato como um pip no canto, mas só quando ela
        // está acima de Scale 1 (um actor de Scale 1 simples não tem Scale relevante).
        ...(showScale ? { scale: r.actor.system?.scale ?? 1, isScaled: (r.actor.system?.scale ?? 1) > 1 } : {})
      })),
    { radioName: "actor" }
  );
  let uuid = null;
  try {
    uuid = await fvtt.DialogV2.prompt({
      window: { title: title ?? game.i18n.localize("SHIFT.Target.Pick") },
      position: { width: 340 },
      classes: ["shift-vtt", "shift-dialog"],
      content: `<div class="shift-prompt trait-pick">${hint ? `<p class="hint">${foundry.utils.escapeHTML(hint)}</p>` : ""}<div class="trait-opts">${rows}</div></div>`,
      rejectClose: false,
      ok: {
        label: game.i18n.localize("SHIFT.Common.Confirm"),
        callback: (event, button) => button.form.elements.actor.value
      }
    });
  } catch (err) { uuid = null; }
  return uuid ? fromUuid(uuid) : null;
}

/** Resolve em qual actor um shift deve recair. Alvos explícitos têm prioridade;
 *  caso contrário, todo actor na mesa é oferecido, com cor por disposition via o
 *  diálogo compartilhado {@link pickActor}. */
async function resolveTargetActor(sourceActor, { candidates = null, title } = {}) {
  let targets = candidates
    ?? Array.from(game.user.targets ?? []).map(t => t.actor).filter(Boolean);
  targets = targets.filter(a => a && a.uuid !== sourceActor.uuid);

  if (!targets.length) {
    const seen = new Set();
    for (const token of canvas?.tokens?.placeables ?? []) {
      const a = token.actor;
      if (!a || a.uuid === sourceActor.uuid || seen.has(a.uuid)) continue;
      seen.add(a.uuid);
      targets.push(a);
    }
  }
  if (!targets.length) {
    ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NoTarget"));
    return null;
  }
  return pickActor(targets, { title: title ?? game.i18n.localize("SHIFT.Target.Pick"), showScale: true });
}

/**
 * Faz ShiftDown de um Trait de um alvo inimigo. O player escolhe o Trait do alvo
 * por conta própria; se não tiver permissão de escrita, a mudança de dado em si é
 * repassada ao client do GM ativo (sem clique do GM). Respeita os gates de
 * "Exhausted First" e a interação de Scale (pelas regras) contra o Trait ESCOLHIDO:
 *  - dois ou mais níveis de Scale abaixo do alvo: sem efeito algum;
 *  - um nível abaixo: só um Critical Success faz shift no alvo;
 *  - um ou mais níveis acima + Critical Success: o Trait é Exhausted de imediato.
 * @param {Actor} sourceActor
 * @param {object} [opts]
 * @param {number} [opts.steps=1]
 * @param {Actor[]} [opts.candidates] actors-alvo preferidos
 * @param {boolean} [opts.exhaust] força um Exhaust completo
 * @param {number|null} [opts.rollerScale] Scale efetiva do Action Roll
 * @param {boolean} [opts.isCrit] o roll foi um Critical Success
 * @returns {Promise<{landed:boolean}>}
 */
async function applyShiftDownToTarget(sourceActor, { steps = 1, candidates = null, exhaust = false, rollerScale = null, isCrit = false } = {}) {
  const target = await resolveTargetActor(sourceActor, { candidates });
  if (!target) return { landed: false };

  // Com o sistema de Scale desativado, ignora a diferença de Scale por completo: um
  // shift sempre recai como um shift normal, nunca bloqueado nem elevado pela Scale.
  if (game.settings.get("shift-vtt", "enableScale") === false) rollerScale = null;

  // Heavily Armored: Traits marcados com mustBeExhaustedFirst bloqueiam os demais.
  const blockers = (target.items?.filter(i =>
    i.type === "trait" && i.system.defeat?.mustBeExhaustedFirst && !i.system.exhausted) ?? []);
  const filter = blockers.length
    ? t => blockers.includes(t)
    : t => t.canShiftDown;

  // Pré-checagem de viabilidade: se TODO Trait alcançável for inafetável nesta Scale,
  // relata o resultado sem efeito de antemão; nunca abre o picker (nem, do lado do
  // chamador, gasta uma ação) num ataque garantidamente fútil.
  if (rollerScale !== null) {
    const pool = (target.items?.filter(i => i.type === "trait" && filter(i)) ?? []);
    if (pool.length && !pool.some(t => scaleEffect(rollerScale - (t.effectiveScale ?? 1), { isCrit }) !== "none")) {
      const worstGap = Math.max(...pool.map(t => rollerScale - (t.effectiveScale ?? 1)));
      await noEffectNote(sourceActor, target, worstGap);
      return { landed: false };
    }
  }

  const trait = await pickTrait(target, {
    title: game.i18n.format("SHIFT.Target.ApplyTitle", { target: target.name }),
    hint: blockers.length ? game.i18n.localize("SHIFT.Warnings.MustExhaustFirst") : undefined,
    scale: target.system?.scale ?? 1,
    filter
  });
  if (!trait) return { landed: false };

  // Interação de Scale (pelas regras), medida contra a Scale efetiva do Trait ESCOLHIDO.
  if (rollerScale !== null) {
    const gap = rollerScale - (trait.effectiveScale ?? 1);
    const effect = scaleEffect(gap, { isCrit });
    if (effect === "none") {
      // gap <= -2: sem efeito algum; gap === -1 sem crit: um Success comum conta
      // como Failure contra o Trait de Scale maior.
      await noEffectNote(sourceActor, target, gap, trait);
      return { landed: false };
    }
    // Uma ou mais Scale acima num Critical Success: Exhaust o Trait de imediato.
    if (effect === "exhaust") exhaust = true;
  }

  // O usuário que age aplica diretamente quando pode escrever no alvo; caso
  // contrário, a escrita é repassada ao client do GM ativo (sem clique do GM).
  const canWrite = game.user.isGM || (trait.actor?.canUserModify?.(game.user, "update") ?? false);
  if (!canWrite) {
    // Sem GM ativo para repassar → relata não-aplicado, para que o botão Apply
    // continue ativo para uma nova tentativa quando um GM conectar (em vez de travar
    // numa escrita perdida).
    if (!game.users.activeGM) {
      ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NoGM"));
      return { landed: false };
    }
    emitOrRun({
      action: "applyShift",
      sourceUuid: sourceActor.uuid,
      traitUuid: trait.uuid,
      steps, exhaust
    });
    return { landed: true };
  }

  const res = exhaust
    ? await trait.exhaust({ promptDeath: false })
    : await trait.shiftDown({ steps, promptDeath: false });
  if (res.blocked) return { landed: false };
  await followUp(sourceActor, game.i18n.format("SHIFT.Target.ApplyChat", {
    actor: foundry.utils.escapeHTML(sourceActor.name),
    target: foundry.utils.escapeHTML(target.name),
    trait: foundry.utils.escapeHTML(trait.name),
    from: dieLabel(res.from),
    to: res.becameExhausted ? game.i18n.localize("SHIFT.DiceStatus.exhausted") : dieLabel(res.to)
  }), "warn");
  return { landed: true };
}

/* ------------------------------------------------------------------ */
/* Handlers dos botões                                                 */
/* ------------------------------------------------------------------ */

async function onApplyToTarget(event, message) {
  event.preventDefault();
  // Captura o botão AGORA: event.currentTarget é zerado assim que o handler cede
  // no primeiro await, então não pode mais ser lido depois.
  const btn = event.currentTarget;
  // Trava o botão de forma SÍNCRONA, antes de qualquer await: senão um duplo-clique
  // rápido passa pelo check de "applied" duas vezes e um único Success recai duas vezes.
  // Os caminhos sem-efeito/cancelado reabilitam abaixo; um shift que recai o mantém travado.
  if (btn) btn.disabled = true;
  const reenable = () => { if (btn) btn.disabled = false; };

  const actor = await getMessageActor(message);
  if (!actor) return reenable();
  const flags = message.flags?.["shift-vtt"] ?? {};
  if (flags.applied) {
    // Já aplicado: mantém o botão travado e só avisa.
    return void ui.notifications.info(game.i18n.localize("SHIFT.Target.AlreadyApplied"));
  }
  const steps = Number(btn?.dataset?.steps) || 1;

  // Pré-mira no(s) alvo(s) pré-selecionado(s) do roll, se algum foi travado no momento do roll.
  let candidates = null;
  if (Array.isArray(flags.targetUuids) && flags.targetUuids.length) {
    candidates = (await Promise.all(flags.targetUuids.map(u => fromUuid(u).catch(() => null)))).filter(Boolean);
    if (!candidates.length) candidates = null;
  }

  const res = await applyShiftDownToTarget(actor, {
    steps,
    candidates,
    rollerScale: effectiveRollerScale(message),
    isCrit: flags.outcome === "criticalSuccess"
  });

  // Trava o botão só quando um shift de fato RECAI: um sem-efeito por Scale o reabilita,
  // para que um boost posterior de XP / Scaled Up possa repetir o mesmo Success na Scale
  // maior, enquanto um shift real nunca pode ser reaplicado.
  if (res?.landed) {
    try { await message.setFlag("shift-vtt", "applied", true); } catch (err) { /* melhor esforço */ }
  } else {
    reenable();
  }
}

async function onCritBonus(event, message) {
  event.preventDefault();
  const bonus = event.currentTarget.dataset.shiftCrit;
  const actor = await getMessageActor(message);
  if (!actor) return;
  if (!actor.isOwner && !game.user.isGM) {
    return void ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NotOwner"));
  }

  const flags = message.flags?.["shift-vtt"] ?? {};
  if (flags.turnOrder) return; // rolls de turn-order não têm interação com alvo
  switch (bonus) {
    case "own": return critShiftUpOwn(actor);
    case "ally": return critShiftUpAlly(actor);
    case "enemy": return applyShiftDownToTarget(actor, {
      // O bônus de Critical Success "fazer shift down no alvo de novo": UM shift
      // adicional sobre o ataque base "Apply to Target" (de modo que o alvo acaba
      // com shift duas vezes quando ambos são usados). Numa Scale maior, um Critical
      // Exhausta o Trait de imediato. Lê a Scale AO VIVO para que um roll com boost
      // resolva alto.
      steps: 1,
      candidates: (Array.isArray(flags.targetUuids) && flags.targetUuids.length)
        ? (await Promise.all(flags.targetUuids.map(u => fromUuid(u).catch(() => null)))).filter(Boolean)
        : null,
      rollerScale: effectiveRollerScale(message),
      isCrit: true
    });
    case "narrative": return critNarrative(actor);
  }
}

/** Faz ShiftUp de um dos Traits do próprio roller. */
async function critShiftUpOwn(actor) {
  const trait = await pickTrait(actor, {
    title: game.i18n.localize("SHIFT.CritBonus.Own"),
    filter: t => t.canShiftUp
  });
  if (!trait) return;
  const res = await trait.shiftUp({});
  await followUp(actor, game.i18n.format("SHIFT.CritBonus.OwnChat", {
    actor: foundry.utils.escapeHTML(actor.name),
    trait: foundry.utils.escapeHTML(trait.name),
    from: dieLabel(res.from), to: dieLabel(res.to)
  }));
}

/** Faz ShiftUp do Trait de um aliado disposto. */
async function critShiftUpAlly(actor) {
  const seen = new Set();
  const candidates = [];
  const consider = a => {
    if (!a || a.uuid === actor.uuid || seen.has(a.uuid)) return;
    seen.add(a.uuid);
    if (!(a.isOwner || game.user.isGM)) return;
    const eligible = (a.items?.filter(i => i.type === "trait" && i.canShiftUp) ?? []);
    if (eligible.length) candidates.push(a);
  };
  for (const token of canvas?.tokens?.placeables ?? []) consider(token.actor);
  for (const a of game.actors.filter(a => a.type === "character")) consider(a);

  if (!candidates.length) {
    return void ui.notifications.info(game.i18n.localize("SHIFT.Warnings.NoAllies"));
  }
  const ally = await pickActor(candidates, {
    title: game.i18n.localize("SHIFT.CritBonus.Ally"),
    hint: game.i18n.localize("SHIFT.CritBonus.AllyHint")
  });
  if (!ally) return;
  const trait = await pickTrait(ally, {
    title: game.i18n.localize("SHIFT.CritBonus.Ally"),
    filter: t => t.canShiftUp
  });
  if (!trait) return;
  const res = await trait.shiftUp({});
  await followUp(actor, game.i18n.format("SHIFT.CritBonus.AllyChat", {
    actor: foundry.utils.escapeHTML(actor.name),
    ally: foundry.utils.escapeHTML(ally.name),
    trait: foundry.utils.escapeHTML(trait.name),
    from: dieLabel(res.from), to: dieLabel(res.to)
  }));
}

/** Um boost narrativo bacana, combinado com o GM. */
async function critNarrative(actor) {
  await followUp(actor, game.i18n.format("SHIFT.CritBonus.NarrativeChat", {
    actor: foundry.utils.escapeHTML(actor.name)
  }));
}

/* ------------------------------------------------------------------ */
/* Working Together (pelas regras): Action Roll conjunto de dois Traits */
/* ------------------------------------------------------------------ */

/**
 * Um aliado clica em Join num convite de grupo, escolhe qualquer um dos seus
 * próprios Traits (não precisa ser Core) e o Action Roll combinado de dois dados
 * é executado. Um Critical exige que ambos os dados mostrem 1.
 */
async function onJoinGroup(event, message) {
  event.preventDefault();
  const initiator = await fromUuid(message.getFlag("shift-vtt", "actorUuid"));
  const trait = await fromUuid(message.getFlag("shift-vtt", "traitUuid"));
  const rollType = message.getFlag("shift-vtt", "rollType") ?? "normal";
  if (!initiator || !trait) return;

  let ally = canvas?.tokens?.controlled?.[0]?.actor ?? game.user.character ?? null;
  if (game.user.isGM && (!ally || ally.uuid === initiator.uuid)) {
    const owned = game.actors.filter(a => a.type === "character" && a.uuid !== initiator.uuid);
    const uuid = await promptChoice({
      title: game.i18n.localize("SHIFT.Group.Title"),
      options: owned.map(a => ({ value: a.uuid, label: a.name }))
    });
    ally = uuid ? await fromUuid(uuid) : null;
  }
  if (!ally) {
    return void ui.notifications.warn(game.i18n.localize("SHIFT.Group.NeedActor"));
  }
  if (ally.uuid === initiator.uuid) {
    return void ui.notifications.warn(game.i18n.localize("SHIFT.Group.NotSelf"));
  }
  if (!ally.isOwner) {
    return void ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NotOwner"));
  }
  if (trait.system.exhausted) {
    return void ui.notifications.warn(game.i18n.format("SHIFT.Warnings.TraitExhaustedNamed", { trait: trait.name }));
  }

  const allyTrait = await pickTrait(ally, {
    title: game.i18n.format("SHIFT.Group.PickTrait", { actor: ally.name }),
    filter: t => t.canRoll
  });
  if (!allyTrait) return;

  await game.shift.ShiftRoll.actionRoll({
    actor: initiator,
    traits: [trait, allyTrait],
    rollType,
    groupRoll: true
  });
}


/* ------------------------------------------------------------------ */
/* Rest de Cargo: cada membro da crew restaura um Trait                */
/* ------------------------------------------------------------------ */

async function onCrewRestore(event, message) {
  event.preventDefault();
  const crew = message.getFlag("shift-vtt", "crew") ?? [];
  const owned = [];
  for (const uuid of crew) {
    const a = await fromUuid(uuid);
    if (a?.isOwner) owned.push(a);
  }
  if (!owned.length) {
    return void ui.notifications.warn(game.i18n.localize("SHIFT.Rest.NotCrew"));
  }
  let actor = owned[0];
  if (owned.length > 1) {
    const uuid = await promptChoice({
      title: game.i18n.localize("SHIFT.Rest.CrewRestore"),
      options: owned.map(a => ({ value: a.uuid, label: a.name }))
    });
    if (!uuid) return;
    actor = await fromUuid(uuid);
  }
  const trait = await pickTrait(actor, {
    title: game.i18n.localize("SHIFT.Rest.CrewRestore"),
    filter: t => t.needsRestore
  });
  if (!trait) return;
  await trait.update({ "system.currentDie": trait.system.maxDie, "system.exhausted": false });
  await ChatMessage.create({
    speaker: shiftSpeaker(actor),
    content: `<div class="shift-vtt chat-card info-card rest unsafe"><p><i class="fa-solid fa-rotate-left"></i> ${game.i18n.format("SHIFT.Rest.CrewRestored", {
      actor: foundry.utils.escapeHTML(actor.name),
      trait: foundry.utils.escapeHTML(trait.name)
    })}</p></div>`
  });
}

/* ------------------------------------------------------------------ */
/* Turn order a partir da mensagem de rodada                           */
/* ------------------------------------------------------------------ */

async function onChatTurnOrder(event) {
  event.preventDefault();
  const combat = game.combat;
  if (!combat) return;
  const mine = combat.combatants.filter(c =>
    c.actor?.type === "character" && c.isOwner && c.initiative === null);
  if (!mine.length) {
    return void ui.notifications.info(game.i18n.localize("SHIFT.Combat.NothingToRoll"));
  }
  for (const c of mine) {
    await combat.rollInitiative([c.id]);
  }
}
