/**
 * SHIFT VTT, interatividade dos cartões de chat.
 * Critical Success Bonuses, aplicação de shift no alvo, assistências em grupo
 * e coloração de mensagem por autor.
 */
import { dieLabel, fvtt, pickerRows, promptChoice, shiftSpeaker } from "../helpers/utils.mjs";
import { codexChipData } from "../sheets/actor-sheets.mjs";
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
    // Orçamento de bônus de crit já esgotado (ex.: reload após gastá-lo): mostra os
    // botões desabilitados de imediato, sem esperar um clique para travar.
    {
      const f = message.flags?.["shift-vtt"] ?? {};
      const budget = Math.max(1, Number(f.critCount) || 1);
      if ((Number(f.critBonusUsed) || 0) >= budget) {
        root.querySelectorAll(".crit-buttons button[data-shift-crit]").forEach(btn => {
          btn.disabled = true;
          btn.classList.add("spent");
        });
      }
    }
    root.querySelectorAll("[data-shift-apply]").forEach(btn => {
      btn.addEventListener("click", ev => onApplyToTarget(ev, message));
    });
    // Shift já aplicado neste card (ex.: re-render disparado pelo próprio setFlag
    // "applied", ou reload depois de aplicar): mostra o botão travado de imediato.
    // Sem isto, o disabled síncrono do onApplyToTarget se perde no re-render e o
    // botão só fica cinza no SEGUNDO clique (quando o guard de flags.applied bate).
    if (message.flags?.["shift-vtt"]?.applied) {
      root.querySelectorAll("[data-shift-apply]").forEach(btn => { btn.disabled = true; });
    }
    root.querySelectorAll("[data-shift-pending]").forEach(btn => {
      btn.addEventListener("click", ev => onApplyPendingShift(ev, message));
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
    // Chip de Codex: preenche o conteúdo POR CLIENTE (reveal-aware + cor do Codex) e
    // liga o clique pra abrir a ficha da Party na entrada linkada (via a API).
    root.querySelectorAll("[data-shift-codexlink]").forEach(el => {
      try { fillCodexChip(el); } catch (_) { /* um chip ruim não quebra o resto do bind */ }
      el.addEventListener("click", ev => {
        ev.preventDefault();
        game.shift?.api?.openCodex?.(el.dataset.codexUuid, el.dataset.partyUuid || null);
      });
    });
    // Preenche os chips de alvo a partir dos uuids persistidos (um único builder,
    // usado no primeiro render, no re-render do retarget e no reload) e liga o clique
    // pra abrir a ficha do alvo (delegado no painel, robusto ao re-render do retarget).
    root.querySelectorAll(".target-panel").forEach(panel => {
      populateTargetPanel(panel);
      panel.addEventListener("click", onTargetChipClick);
    });
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

/** Preenche um chip de Codex no chat com conteúdo reveal-aware do usuário atual
 *  (retrato/nome/tipo + a cor do Codex em --ccx-role). Roda no render de cada cliente. */
function fillCodexChip(el) {
  const esc = foundry.utils.escapeHTML;
  const data = codexChipData(el.dataset.codexUuid, el.dataset.partyUuid || null);
  if (!data) {
    el.classList.add("locked");
    el.innerHTML = `<span class="ccx-portrait"><i class="fa-solid fa-book-skull"></i></span><span class="ccx-body"><span class="ccx-name">Codex</span></span>`;
    return;
  }
  if (data.color) el.style.setProperty("--ccx-role", data.color);
  el.classList.toggle("locked", !!data.locked);
  const portrait = data.img ? `<img src="${esc(data.img)}" alt=""/>` : `<i class="fa-solid ${data.icon}"></i>`;
  el.innerHTML = `<span class="ccx-portrait">${portrait}</span>`
    + `<span class="ccx-body"><span class="ccx-name">${esc(data.name)}</span><span class="ccx-role">${esc(data.roleLabel)}</span></span>`
    + `<i class="fa-solid fa-book-skull ccx-icon"></i>`;
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
  const openWord = game.i18n.localize("SHIFT.Target.OpenSheet");
  const html = uuids.map(u => {
    let a = null;
    try { a = fromUuidSync(u); } catch (err) { a = null; }
    if (!a) return "";
    const scale = a.system?.scale ?? 1;
    // Pip de Scale no canto, só quando acima de Scale 1; o hover mostra "Scale N".
    const pip = scale > 1
      ? `<span class="t-scale" data-scale="${scale}" data-tooltip="${esc(scaleWord)} ${scale}">${scale}</span>`
      : "";
    // Chip clicável (abre a ficha) só pra quem pode ao menos ver o alvo: a permissão é
    // por-cliente, então um Adversary fica clicável pro GM e inerte pro player sem dono.
    const canView = typeof a.testUserPermission === "function"
      ? a.testUserPermission(game.user, "LIMITED")
      : !!a.isOwner;
    const cls = canView ? "target-chip clickable" : "target-chip";
    const link = canView ? ` data-target-uuid="${esc(u)}" data-tooltip="${esc(openWord)}"` : "";
    return `<span class="${cls}" data-scale="${scale}"${link}>`
      + `<img src="${a.img}" alt=""/>`
      + `<span class="t-name">${esc(a.name)}</span>`
      + pip
      + `</span>`;
  }).join("");
  chips.innerHTML = html || `<span class="target-chip empty">${esc(game.i18n.localize("SHIFT.Target.None"))}</span>`;
}

/** Clique num chip de alvo: abre a ficha do actor mirado. Só os chips visíveis ao
 *  usuário ganham `data-target-uuid` (gate de permissão em populateTargetPanel), então
 *  aqui basta resolver o uuid e renderizar; cliques no botão Retarget não casam o seletor
 *  e são ignorados. Delegado no painel, então sobrevive ao re-render do retarget. */
function onTargetChipClick(event) {
  const chip = event.target.closest(".target-chip[data-target-uuid]");
  if (!chip) return;
  event.preventDefault();
  let actor = null;
  try { actor = fromUuidSync(chip.dataset.targetUuid); } catch (err) { actor = null; }
  actor?.sheet?.render(true);
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

/** Decide se um clique no "Shift down target's Traits" (ou no bônus de Critical
 *  "Shift down the target again") deve SORTEAR um Trait do alvo, em vez de abrir o
 *  picker. Por padrão, Shift+clique sorteia; a setting randomTargetShiftDown inverte
 *  (clique normal sorteia, Shift+clique abre o picker). XOR entre o Shift e o inverso. */
function wantsRandomTargetShift(event) {
  const inverted = game.settings.get("shift-vtt", "randomTargetShiftDown") === true;
  return !!event?.shiftKey !== inverted;
}

/** Escolhe um Trait elegível do alvo ao acaso (modo "shift down aleatório" do GM).
 *  Aplica o mesmo filtro do picker manual e, quando a Scale está em jogo, prefere os
 *  Traits que de fato sofrem efeito — nunca desperdiça o sorteio num Trait que a Scale
 *  anularia —, caindo para o conjunto elegível inteiro só se nenhum for afetável. */
function pickRandomTrait(target, { filter, rollerScale = null, isCrit = false } = {}) {
  const eligible = (target.items?.filter(i => i.type === "trait" && (filter ? filter(i) : true)) ?? []);
  if (!eligible.length) return null;
  let pool = eligible;
  if (rollerScale !== null) {
    const affectable = eligible.filter(t => scaleEffect(rollerScale - (t.effectiveScale ?? 1), { isCrit }) !== "none");
    if (affectable.length) pool = affectable;
  }
  return pool[Math.floor(Math.random() * pool.length)];
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
 * @param {boolean} [opts.random] sorteia o Trait do alvo em vez de abrir o picker
 * @returns {Promise<{landed:boolean}>}
 */
async function applyShiftDownToTarget(sourceActor, { steps = 1, candidates = null, exhaust = false, rollerScale = null, isCrit = false, random = false } = {}) {
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

  // Sorteia o Trait (Shift+clique / setting invertida) ou abre o picker manual. O
  // sorteio respeita o mesmo filtro e a pré-checagem de afetabilidade já garantiu, no
  // caminho com Scale, que existe ao menos um Trait afetável para cair.
  let trait;
  if (random) {
    trait = pickRandomTrait(target, { filter, rollerScale, isCrit });
    if (!trait) {
      ui.notifications.info(game.i18n.localize("SHIFT.Warnings.NoEligibleTraits"));
      return { landed: false };
    }
  } else {
    trait = await pickTrait(target, {
      title: game.i18n.format("SHIFT.Target.ApplyTitle", { target: target.name }),
      hint: blockers.length ? game.i18n.localize("SHIFT.Warnings.MustExhaustFirst") : undefined,
      scale: target.system?.scale ?? 1,
      filter
    });
  }
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
    ? await trait.exhaust({})
    : await trait.shiftDown({ steps });
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
  // Shift+clique (ou o inverso, conforme a setting) sorteia um Trait do alvo em vez de
  // abrir o picker. Lido AGORA, junto do botão, antes de qualquer await zerar o event.
  const random = wantsRandomTargetShift(event);
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
    isCrit: flags.outcome === "criticalSuccess",
    random
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

/** Resolve, a partir do manifesto de Traits do card, o Item de Trait do shift
 *  "pending" clicado. Reconstrói o rótulo exibido (com prefixo "Dono: " só quando
 *  o Trait não pertence ao roller nem a um Vehicle, igual ao roll engine) para casar
 *  com `data-shift-name`; com um único Trait no manifesto, dispensa o match. */
async function pendingTraitFromCard(message, shiftName) {
  const flags = message.flags?.["shift-vtt"] ?? {};
  const manifest = Array.isArray(flags.traits) ? flags.traits : [];
  if (!manifest.length) return null;
  if (manifest.length === 1) return fromUuid(manifest[0].uuid).catch(() => null);
  for (const t of manifest) {
    const owner = t.actorUuid ? await fromUuid(t.actorUuid).catch(() => null) : null;
    const display = (t.actorUuid === flags.actorUuid || owner?.type === "vehicle")
      ? t.name
      : `${owner?.name ?? ""}: ${t.name}`;
    if (display === shiftName) return fromUuid(t.uuid).catch(() => null);
  }
  return null;
}

/** Aplica manualmente um ShiftDown que ficou "pending" no card (Trait com
 *  autoShiftOnRoll=false, ex.: uma Quest de Party). Quando o usuário não pode
 *  escrever o actor do Trait (ex.: um OBSERVER que rolou a Quest), a mutação é
 *  ROTEADA pelo cliente do GM ativo via emitOrRun; caso contrário, aplica direto. */
async function onApplyPendingShift(event, message) {
  event.preventDefault();
  const btn = event.currentTarget;
  // Trava de forma síncrona, antes de qualquer await: um duplo-clique não pode
  // aplicar o mesmo shift pending duas vezes.
  if (btn?.disabled) return;
  if (btn) btn.disabled = true;

  const item = await pendingTraitFromCard(message, btn?.dataset?.shiftName ?? "");
  // hasClock = Trait OU Quest: ambos carregam Shift Die e dão shift down. Checar só
  // type==="trait" rejeitava Quests (type "quest"), por isso elas não shiftavam ao rolar.
  if (!item || !item.hasClock) {
    if (btn) btn.disabled = false;
    return;
  }
  // SEM gate de ownership aqui (igual ao onApplyToTarget): pelas regras, dar shift down
  // ao rolar uma Quest/Trait de Party é intended mesmo quem não possui o documento. O
  // que decide se há shift são as flags do item (rollable/autoShiftOnRoll), não a posse.
  // Quando o usuário não pode escrever o actor do Trait, repassa a mutação ao cliente
  // do GM ativo (sem clique do GM), em vez de chamar item.update e falhar em silêncio.
  if (item.actor?.canUserModify?.(game.user, "update") === false) {
    emitOrRun({ action: "commitShift", traitUuid: item.uuid, steps: 1, xp: 0 });
    return;
  }
  try {
    await item.shiftDown({ steps: 1, force: true });
  } catch (err) {
    console.warn("shift-vtt | pending shift apply failed", err);
    if (btn) btn.disabled = false;
  }
}

/** Desabilita visualmente os botões de bônus de Critical Success de um card
 *  (atributo disabled + classe `spent`), chamado quando o orçamento de bônus se
 *  esgota. Opera no DOM já renderizado, sem reescrever o conteúdo da mensagem. */
function disableCritButtons(message) {
  for (const el of document.querySelectorAll(`[data-message-id="${message.id}"] .crit-buttons button[data-shift-crit]`)) {
    el.disabled = true;
    el.classList.add("spent");
  }
}

async function onCritBonus(event, message) {
  event.preventDefault();
  const bonus = event.currentTarget.dataset.shiftCrit;
  // Mesmo gesto do "Apply to Target": Shift+clique (ou o inverso, conforme a setting)
  // sorteia o Trait do alvo no bônus "Shift down the target again". Lido antes do await.
  const random = wantsRandomTargetShift(event);
  const actor = await getMessageActor(message);
  if (!actor) return;
  if (!actor.isOwner && !game.user.isGM) {
    return void ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NotOwner"));
  }

  const flags = message.flags?.["shift-vtt"] ?? {};
  if (flags.turnOrder) return; // rolls de turn-order não têm interação com alvo

  // Guard de re-entrância: um único bônus de crit por vez por card, para que dois
  // cliques (botões diferentes incluídos) não leiam o mesmo `used` antes de a
  // gravação assentar e estourem o orçamento.
  if (cardActionInFlight.has(message.id)) return;
  cardActionInFlight.add(message.id);
  try {
    // Orçamento de bônus de Critical Success (pelas regras): 1 com a critRule
    // "standard", N = quantidade de dados que mostraram 1 com a "everyOne". O
    // budget é COMPARTILHADO pelos quatro tipos de bônus (own/ally/enemy/narrative),
    // em qualquer combinação. critCount já foi gravado no flag pela roll engine.
    const budget = Math.max(1, Number(flags.critCount) || 1);
    const used = Number(flags.critBonusUsed) || 0;
    if (used >= budget) {
      disableCritButtons(message);
      return void ui.notifications.warn(game.i18n.localize("SHIFT.CritBonus.NoneLeft"));
    }

    // Aplica o bônus escolhido; cada handler devolve um truthy só quando o efeito
    // de fato recaiu (um picker cancelado NÃO consome o orçamento).
    let applied = false;
    switch (bonus) {
      case "own": applied = await critShiftUpOwn(actor); break;
      case "ally": applied = await critShiftUpAlly(actor); break;
      case "enemy": {
        // O bônus de Critical Success "fazer shift down no alvo de novo": UM shift
        // adicional sobre o ataque base "Apply to Target" (de modo que o alvo acaba
        // com shift duas vezes quando ambos são usados). Numa Scale maior, um Critical
        // Exhausta o Trait de imediato. Lê a Scale AO VIVO para que um roll com boost
        // resolva alto.
        const res = await applyShiftDownToTarget(actor, {
          steps: 1,
          candidates: (Array.isArray(flags.targetUuids) && flags.targetUuids.length)
            ? (await Promise.all(flags.targetUuids.map(u => fromUuid(u).catch(() => null)))).filter(Boolean)
            : null,
          rollerScale: effectiveRollerScale(message),
          isCrit: true,
          random
        });
        applied = !!res?.landed;
        break;
      }
      case "narrative": applied = await critNarrative(actor); break;
    }
    if (!applied) return;

    // Contabiliza o uso. Se a gravação falhar (autor não-GM sem permissão sobre a
    // mensagem), NÃO perde o efeito de jogo (já aplicado acima): só registra o aviso.
    const next = used + 1;
    try {
      await message.update({ "flags.shift-vtt.critBonusUsed": next });
    } catch (err) {
      console.warn("shift-vtt | crit-bonus budget update failed", err);
    }
    if (next >= budget) disableCritButtons(message);
  } finally {
    cardActionInFlight.delete(message.id);
  }
}

/** Faz ShiftUp de um dos Traits do próprio roller.
 *  @returns {Promise<boolean>} true só quando o ShiftUp recaiu (picker confirmado). */
async function critShiftUpOwn(actor) {
  const trait = await pickTrait(actor, {
    title: game.i18n.localize("SHIFT.CritBonus.Own"),
    filter: t => t.canShiftUp
  });
  if (!trait) return false;
  const res = await trait.shiftUp({});
  await followUp(actor, game.i18n.format("SHIFT.CritBonus.OwnChat", {
    actor: foundry.utils.escapeHTML(actor.name),
    trait: foundry.utils.escapeHTML(trait.name),
    from: dieLabel(res.from), to: dieLabel(res.to)
  }));
  return true;
}

/** Faz ShiftUp do Trait de um aliado disposto.
 *  @returns {Promise<boolean>} true só quando o ShiftUp recaiu (aliado + Trait confirmados). */
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
    ui.notifications.info(game.i18n.localize("SHIFT.Warnings.NoAllies"));
    return false;
  }
  const ally = await pickActor(candidates, {
    title: game.i18n.localize("SHIFT.CritBonus.Ally"),
    hint: game.i18n.localize("SHIFT.CritBonus.AllyHint")
  });
  if (!ally) return false;
  const trait = await pickTrait(ally, {
    title: game.i18n.localize("SHIFT.CritBonus.Ally"),
    filter: t => t.canShiftUp
  });
  if (!trait) return false;
  const res = await trait.shiftUp({});
  await followUp(actor, game.i18n.format("SHIFT.CritBonus.AllyChat", {
    actor: foundry.utils.escapeHTML(actor.name),
    ally: foundry.utils.escapeHTML(ally.name),
    trait: foundry.utils.escapeHTML(trait.name),
    from: dieLabel(res.from), to: dieLabel(res.to)
  }));
  return true;
}

/** Um boost narrativo bacana, combinado com o GM.
 *  @returns {Promise<boolean>} sempre true (postar a nota É o efeito). */
async function critNarrative(actor) {
  await followUp(actor, game.i18n.format("SHIFT.CritBonus.NarrativeChat", {
    actor: foundry.utils.escapeHTML(actor.name)
  }));
  return true;
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
  if (!trait.system.rollable) {
    return void ui.notifications.warn(game.i18n.format("SHIFT.Warnings.TraitNotRollable", { trait: trait.name }));
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
