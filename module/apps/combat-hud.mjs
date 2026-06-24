/**
 * SHIFT VTT, Combat HUD.
 *
 * HUD flutuante ancorada no TOPO-CENTRO da janela do jogo, irmã do Action HUD
 * (ver action-hud.mjs para a arquitetura de HUD nativa em DOM puro). Mostra TODOS
 * os combatentes do combate ATIVO E INICIADO de uma vez, agrupados pelas fases do
 * SHIFT (divisores só de cor + ícone), SEM rolagem: o combatente em spotlight é
 * apenas o card destacado (anel + glow na cor da fase). Clicar num card passa o
 * spotlight; as setas ‹ › passam de 1 em 1 (com wrap). Se houver combatentes
 * demais para a largura, a fila quebra em linhas — nada fica escondido.
 *
 * Não é a decoração da sidebar (essa é tracker.mjs). A fonte de verdade das fases
 * é ./../combat/phases.mjs (phaseFor), reaproveitada do tracker. O spotlight é o
 * turno corrente do combate (combat.combatant), movido via
 * CONFIG.Combat.documentClass.spotlight (gateado por owner/GM); jogadores que não
 * podem mover aquele combatente veem só o destaque local até o próximo turno real.
 */
import { phaseFor, PHASE_META } from "../combat/phases.mjs";

// As cores por fase (advantage/p1/adv/p2/unrolled) vivem nas classes .phase-<key>
// de shift.less — a HUD fica fora do escopo .shift-vtt, então usa hexes literais
// que espelham a paleta Bunny Glass. Aqui só montamos a classe a partir de meta.key.

let hudEl = null;      // #shift-combat-hud (container fixo)
let listEl = null;     // fila de combatentes (flex, quebra em linhas se precisar)
let roundNumEl = null;

let combatId = null;      // combate sendo exibido
let spotlightId = null;   // combatente destacado (= turno corrente do combate)
let order = [];           // ids dos combatentes em ordem de fase (setas / wrap)
let listenersBound = false;

// Quando true, o próximo render re-sincroniza o spotlight com o turno do combate
// (combat.combatant). Ligado só pelos hooks de turno/round/start; os demais
// re-renders (update de actor/item/combatant) preservam o foco local.
let resync = false;

/* ------------------------------------------------------------------ */
/* Elemento e esqueleto persistente                                    */
/* ------------------------------------------------------------------ */

/** Cria (uma vez) o container fixo e o esqueleto da barra. Só o conteúdo da fila
 *  e o número do round são reconstruídos a cada render; o esqueleto e seus
 *  listeners persistem. */
function ensureElement() {
  if (hudEl?.isConnected) return hudEl;
  hudEl = document.createElement("div");
  hudEl.id = "shift-combat-hud";
  hudEl.classList.add("shift-vtt");
  document.body.appendChild(hudEl);

  const L = key => game.i18n.localize(key);
  const isGM = game.user.isGM;
  hudEl.innerHTML = `
    <div class="chud-bar">
      <div class="chud-cap chud-cap-left">
        <button type="button" class="chud-step" data-chud="prev"
                aria-label="${L("SHIFT.Combat.PrevStep")}" data-tooltip="${L("SHIFT.Combat.PrevStep")}">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <div class="chud-round">
          <span class="chud-round-label">${L("SHIFT.Combat.Round")}</span>
          <span class="chud-round-num">1</span>
        </div>
        <div class="chud-cap-btns">
          <button type="button" class="chud-mini chud-reroll" data-chud="reroll"
                  aria-label="${L("SHIFT.Combat.RollOrder")}" data-tooltip="${L("SHIFT.Combat.RollOrder")}">
            <i class="fa-solid fa-dice-d20"></i>
          </button>
          ${isGM ? `
          <button type="button" class="chud-mini chud-endround" data-chud="endRound"
                  aria-label="${L("SHIFT.Combat.EndRound")}" data-tooltip="${L("SHIFT.Combat.EndRound")}">
            <i class="fa-solid fa-flag-checkered"></i>
          </button>` : ""}
        </div>
      </div>
      <div class="chud-sep"></div>
      <div class="chud-list"></div>
      <div class="chud-sep"></div>
      <div class="chud-cap chud-cap-right">
        <button type="button" class="chud-step" data-chud="next"
                aria-label="${L("SHIFT.Combat.NextStep")}" data-tooltip="${L("SHIFT.Combat.NextStep")}">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>`;

  listEl = hudEl.querySelector(".chud-list");
  roundNumEl = hudEl.querySelector(".chud-round-num");

  bindListeners();
  return hudEl;
}

function bindListeners() {
  if (listenersBound) return;
  listenersBound = true;
  hudEl.addEventListener("click", onClick);
  // O layout (quebra de linha) reflui sozinho via CSS; só reposicionamos a barra.
  const reposition = foundry.utils.debounce(positionHud, 100);
  window.addEventListener("resize", reposition);
}

function hide() {
  combatId = null;
  if (hudEl) hudEl.classList.remove("visible");
}

/* ------------------------------------------------------------------ */
/* Posicionamento: topo-centro, abaixo da navegação de cena            */
/* ------------------------------------------------------------------ */

const TOP_GAP = 8;
const EDGE = 6;

/** Centraliza horizontalmente na viewport (o CSS mantém translateX(-50%)) e gruda
 *  no TOPO da janela (TOP_GAP). A navegação de cena fica à esquerda, então o
 *  centro-topo está livre e não precisamos desviar dela. */
function positionHud() {
  if (!hudEl?.classList.contains("visible")) return;
  const ow = hudEl.offsetWidth;
  if (!ow) return;
  const half = ow / 2;

  let cx = window.innerWidth / 2;
  const maxCx = Math.max(half + EDGE, window.innerWidth - half - EDGE);
  cx = Math.min(Math.max(cx, half + EDGE), maxCx);

  hudEl.style.left = `${Math.round(cx)}px`;
  hudEl.style.top = `${TOP_GAP}px`;
}

/* ------------------------------------------------------------------ */
/* Dados por combatente                                                */
/* ------------------------------------------------------------------ */

/** Combatentes visíveis para o usuário atual: o GM vê tudo; jogadores não veem os
 *  hidden (igual ao tracker). */
function visibleCombatants(combat) {
  return combat.combatants.filter(c => game.user.isGM || !c.hidden);
}

/** Sequência ordenada de itens (divisores + combatentes) por fase, e a lista
 *  `order` só com os ids de combatente (para as setas e o wrap). */
function buildItems(combat) {
  const all = visibleCombatants(combat);
  const byKey = {};
  for (const c of all) {
    const key = phaseFor(c).key;
    (byKey[key] ??= []).push(c);
  }
  const items = [];
  for (const meta of PHASE_META) {
    const members = byKey[meta.key];
    if (!members?.length) continue;
    // Mantém a ordem canônica do combate (combat.turns) dentro de cada fase.
    members.sort((a, b) => combat.turns.indexOf(a) - combat.turns.indexOf(b));
    items.push({ type: "divider", meta });
    for (const c of members) items.push({ type: "combatant", meta, combatant: c });
  }
  return items;
}

function combatantImg(combatant) {
  return combatant.img || combatant.actor?.img || combatant.token?.texture?.src || "icons/svg/mystery-man.svg";
}

/** Está sendo mirado pelo usuário atual? (alvo é por-cliente). */
function isTargeted(combatant) {
  const token = combatant.token?.object;
  return !!token?.targeted?.has(game.user);
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */

function render(combat) {
  ensureElement();
  combatId = combat.id;
  if (roundNumEl) roundNumEl.textContent = String(combat.round ?? 1);

  const items = buildItems(combat);
  order = items.filter(it => it.type === "combatant").map(it => it.combatant.id);

  // O spotlight reflete o turno CORRENTE do combate (combat.combatant). Logo após
  // rolar a ordem de turno o combate fica SEM turno (turn null, ver combat.mjs),
  // então spotlightId vira null e a HUD não destaca NINGUÉM — a seleção é sempre
  // manual (clique no card). Re-sincroniza no resync (turno/round/start) ou se o
  // foco local sumiu; senão preserva o foco local (browse do jogador). NUNCA cai
  // num "primeiro da fila" automático.
  if (resync || !order.includes(spotlightId)) {
    spotlightId = combat.combatant?.id ?? null;
  }
  resync = false;

  listEl.innerHTML = items
    .map(it => it.type === "divider" ? dividerHtml(it.meta) : cardHtml(it.combatant, it.meta))
    .join("");

  hudEl.classList.add("visible");
  positionHud();
}

function dividerHtml(meta) {
  const label = foundry.utils.escapeHTML(game.i18n.localize(meta.label));
  return `<div class="chud-divider phase-${meta.key}" data-tooltip="${label}" aria-label="${label}">
    <i class="fa-solid ${meta.icon}"></i>
  </div>`;
}

function cardHtml(combatant, meta) {
  const actor = combatant.actor;
  const name = foundry.utils.escapeHTML(combatant.name ?? "");
  const max = Math.max(1, combatant.actionsMax ?? 1);
  const left = Math.max(0, Math.min(combatant.actionsLeft ?? max, max));
  const acted = left <= 0;
  const defeated = combatant.isDefeated;
  const hidden = combatant.hidden;
  const targeted = isTargeted(combatant);
  const isSpot = combatant.id === spotlightId;
  const isGM = game.user.isGM;

  // Raios de ação: max pips; os primeiros `left` acesos (amarelos), o resto apagado.
  const pips = Array.fromRange(max)
    .map(i => `<i class="fa-solid fa-bolt chud-pip${i < left ? " on" : ""}"></i>`)
    .join("");

  // Overcome (SÓ adversários): ícone + pips SEGMENTADOS lidos de system.defeat.
  let overcome = "";
  if (actor?.type === "adversary") {
    const d = actor.system.defeat ?? { value: 0, max: 1 };
    const dmax = Math.max(1, d.max ?? 1);
    const dval = Math.max(0, Math.min(d.value ?? 0, dmax));
    const done = !!actor.system.overcome;
    const segs = Array.fromRange(dmax)
      .map(i => `<span class="chud-seg${i < dval ? " filled" : ""}"></span>`)
      .join("");
    const tip = `${game.i18n.localize("SHIFT.Adversary.Defeat")}: ${dval}/${dmax}`;
    overcome = `<div class="chud-overcome${done ? " is-done" : ""}" data-tooltip="${tip}" aria-label="${tip}">
      <i class="fa-solid fa-skull"></i>
      <div class="chud-segs">${segs}</div>
    </div>`;
  }

  // 3 botões fixos. Target é por-cliente (todos podem); Hide/Defeat mutam o
  // combatant (só o GM), então ficam desabilitados para jogadores.
  const tb = (act, cls, icon, active) =>
    `<button type="button" class="chud-tb ${cls}${active ? " is-active" : ""}${(!isGM && act !== "target") ? " is-disabled" : ""}"
             data-act="${act}" aria-label="${game.i18n.localize(tbLabel(act))}" data-tooltip="${game.i18n.localize(tbLabel(act))}"
             ${(!isGM && act !== "target") ? "disabled" : ""}>
       <i class="fa-solid ${icon}"></i>
     </button>`;

  const sheetTip = game.i18n.localize("SHIFT.Combat.OpenSheet");
  const img = foundry.utils.escapeHTML(combatantImg(combatant));

  return `
    <div class="chud-card phase-${meta.key}${isSpot ? " is-spotlight" : ""}${acted ? " is-acted" : ""}${defeated ? " is-defeated" : ""}${hidden ? " is-hidden" : ""}"
         data-cid="${combatant.id}" title="${name}">
      <div class="chud-portrait" data-act="sheet" data-tooltip="${sheetTip}" aria-label="${sheetTip}">
        <img src="${img}" alt="${name}"/>
        ${defeated ? `<span class="chud-badge-defeat"><i class="fa-solid fa-skull"></i></span>` : ""}
      </div>
      <div class="chud-body">
        <span class="chud-name">${name}</span>
        <div class="chud-meta" data-tooltip="${game.i18n.localize("SHIFT.Combat.ActionsLeft")}">
          <div class="chud-pips">${pips}</div>
          ${overcome}
        </div>
        <div class="chud-tbs">
          ${tb("target", "chud-tb-target", "fa-crosshairs", targeted)}
          ${tb("hide", "chud-tb-hide", "fa-eye-slash", hidden)}
          ${tb("defeat", "chud-tb-defeat", "fa-skull", defeated)}
        </div>
      </div>
    </div>`;
}

function tbLabel(act) {
  return act === "target" ? "SHIFT.Combat.Target"
    : act === "hide" ? "SHIFT.Combat.Hide"
    : "SHIFT.Combat.Defeat";
}

/* ------------------------------------------------------------------ */
/* Spotlight (turno do combate) + navegação                            */
/* ------------------------------------------------------------------ */

/** (Re)pinta a classe .is-spotlight no card do spotlight, sem rebuild. */
function paintSpotlight() {
  if (!listEl) return;
  listEl.querySelectorAll(".chud-card.is-spotlight").forEach(el => el.classList.remove("is-spotlight"));
  if (spotlightId) listEl.querySelectorAll(`[data-cid="${spotlightId}"]`).forEach(el => el.classList.add("is-spotlight"));
}

/** Destaca `id` localmente e, se permitido, move o spotlight REAL do combate
 *  (combat.turn) — que então propaga via socket e re-renderiza. Para combatentes
 *  que o usuário não pode controlar, só destaca (sem aviso). */
function takeSpotlight(id) {
  if (id !== spotlightId) { spotlightId = id; paintSpotlight(); }
  const combat = game.combats.get(combatId);
  const cmb = combat?.combatants.get(id);
  if (!combat || !cmb) return;
  if (cmb.isOwner || game.user.isGM) {
    CONFIG.Combat.documentClass.spotlight?.(combat, id);
  }
}

/** Passa o spotlight `d` combatentes na ordem, com wrap. */
function stepBy(d) {
  if (!order.length) return;
  let i = order.indexOf(spotlightId);
  if (i < 0) i = 0;
  const ni = ((i + d) % order.length + order.length) % order.length;
  takeSpotlight(order[ni]);
}

/* ------------------------------------------------------------------ */
/* Eventos                                                             */
/* ------------------------------------------------------------------ */

function onClick(e) {
  // Botões de cap (prev/next/reroll/endRound)
  const cap = e.target.closest("[data-chud]");
  if (cap) {
    e.preventDefault();
    return void onCap(cap.dataset.chud);
  }
  const card = e.target.closest(".chud-card");
  if (!card) return;
  const cid = card.dataset.cid;
  const combat = game.combats.get(combatId);
  const combatant = combat?.combatants.get(cid);
  if (!combatant) return;

  const actBtn = e.target.closest("[data-act]");
  if (actBtn) {
    if (actBtn.classList.contains("is-disabled")) return;
    e.stopPropagation();
    switch (actBtn.dataset.act) {
      case "sheet": return void combatant.actor?.sheet?.render(true);
      case "target": return void onTarget(combatant);
      case "hide": return void onHide(combatant);
      case "defeat": return void onDefeat(combatant);
    }
    return;
  }
  // Corpo do card: passa o spotlight (defeated não toma cena).
  if (combatant.isDefeated) return;
  takeSpotlight(cid);
}

function onCap(action) {
  const combat = game.combats.get(combatId);
  if (!combat) return;
  switch (action) {
    case "prev": return stepBy(-1);
    case "next": return stepBy(1);
    case "reroll": return void rollTurnOrder(combat);
    case "endRound": if (game.user.isGM) return void combat.nextRound();
  }
}

/** Botão "rolar ordem de turno": o GM reseta a ordem do round (cada player rola);
 *  um player rola a ordem dos próprios characters ainda sem iniciativa. */
async function rollTurnOrder(combat) {
  if (game.user.isGM) return void combat.resetTurnOrder({ announce: true });
  const mine = combat.combatants.filter(c =>
    c.actor?.type === "character" && c.isOwner && c.initiative === null);
  if (!mine.length) return void ui.notifications.info(game.i18n.localize("SHIFT.Combat.NothingToRoll"));
  for (const c of mine) await combat.rollInitiative([c.id]);
}

function onTarget(combatant) {
  const token = combatant.token?.object;
  if (!token) return;
  token.setTarget(!isTargeted(combatant), { releaseOthers: false });
}

async function onHide(combatant) {
  if (!game.user.isGM) return;
  await combatant.update({ hidden: !combatant.hidden });
}

/** Marca/desmarca derrotado e espelha o status especial DEFEATED no token (igual
 *  ao toggle nativo do tracker). */
async function onDefeat(combatant) {
  if (!game.user.isGM) return;
  const defeated = !combatant.isDefeated;
  await combatant.update({ defeated });
  const status = CONFIG.specialStatusEffects?.DEFEATED;
  if (status) await combatant.actor?.toggleStatusEffect(status, { active: defeated, overlay: true });
}

/* ------------------------------------------------------------------ */
/* Visibilidade / atualização                                          */
/* ------------------------------------------------------------------ */

function refresh() {
  if (game.settings.get("shift-vtt", "enableCombatHud") === false) return hide();
  const combat = game.combats?.active;
  if (!combat || !combat.started) return hide();
  render(combat);
}

/** Reavalia a HUD (usado pelo onChange da setting). */
export function refreshCombatHud() {
  refresh();
}

export function registerCombatHud() {
  // O CRUD de Item/Actor de um combatente pode vir em rajada (vários shifts numa
  // ação): junta tudo numa única reconstrução, como o tracker e o Action HUD fazem.
  const debounced = foundry.utils.debounce(refresh, 50);
  // Mudança de turno/round/start re-sincroniza o foco com combat.combatant.
  const debouncedSync = foundry.utils.debounce(() => { resync = true; refresh(); }, 50);

  for (const hook of ["createCombat", "deleteCombat", "updateCombat", "createCombatant", "deleteCombatant", "updateCombatant"]) {
    Hooks.on(hook, () => debounced());
  }
  for (const hook of ["combatStart", "combatTurn", "combatRound"]) {
    Hooks.on(hook, () => debouncedSync());
  }
  // Mudanças no Actor (defeat/overcome, nome, img) ou no seu CRUD de Item
  // (overcome do Adversary em tempo real) repintam a HUD só se o Actor está no
  // combate ativo — evita repintar a cada edição fora de combate.
  const inActiveCombat = actor =>
    actor && game.combats?.active?.combatants?.some(c => c.actor === actor);
  Hooks.on("updateActor", a => { if (inActiveCombat(a)) debounced(); });
  for (const hook of ["createItem", "updateItem", "deleteItem"]) {
    Hooks.on(hook, item => { if (inActiveCombat(item?.actor)) debounced(); });
  }
  // Mira é por-cliente e não dispara hook de documento; repinta os badges/estado.
  Hooks.on("targetToken", () => { if (hudEl?.classList.contains("visible")) debounced(); });

  Hooks.on("canvasReady", () => refresh());
  Hooks.once("ready", () => refresh());
}
