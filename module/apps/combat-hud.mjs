/**
 * SHIFT VTT, Combat HUD.
 *
 * HUD flutuante ancorada no TOPO da janela do jogo, irmã do Action HUD (ver
 * action-hud.mjs para a arquitetura de HUD nativa em DOM puro). Mostra TODOS os
 * combatentes do combate ATIVO (mesmo antes de iniciar) de uma vez, agrupados
 * pelas fases do SHIFT (divisores só de cor + ícone), numa ÚNICA fila. A barra se
 * estende dinamicamente até os limites da banda do topo — da direita do bloco de
 * navegação de cena (#ui-left) até a esquerda da sidebar (#ui-right), medidos no
 * positionHud — e os cards encolhem (flex-shrink) quando há muitos, evitando
 * quebrar em dois andares. O combatente em spotlight é apenas o card destacado
 * (anel + glow na cor da fase); clicar num card passa o spotlight.
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
let toggleBtn = null;  // botão Start/End Combat (só GM)
let roundBtns = [];    // botões que só valem com o combate iniciado (desabilitados antes)

let combatId = null;      // combate sendo exibido
let spotlightId = null;   // combatente destacado (= turno corrente do combate)
let order = [];           // ids dos combatentes visíveis (valida o foco no resync)
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
  // Botões de controle (sem setas — spotlight é manual neste sistema). Esquerda:
  // Roll Turn Order (em cima) / Start-End Combat (embaixo); direita: Roll All (em
  // cima) / New Round (embaixo). Start/End, Roll All e New Round são só do GM.
  const mini = (action, cls, icon, key) =>
    `<button type="button" class="chud-mini ${cls}" data-chud="${action}"
             aria-label="${L(key)}" data-tooltip="${L(key)}"><i class="fa-solid ${icon}"></i></button>`;
  hudEl.innerHTML = `
    <div class="chud-bar">
      <div class="chud-cap chud-cap-left">
        <div class="chud-round">
          <span class="chud-round-label">${L("SHIFT.Combat.Round")}</span>
          <span class="chud-round-num">—</span>
        </div>
        <div class="chud-cap-col">
          ${mini("rollTurnOrder", "chud-rollorder", "fa-dice-d20", "SHIFT.Combat.RollOrder")}
          ${isGM ? mini("toggleCombat", "chud-toggle", "fa-play", "SHIFT.Combat.StartCombat") : ""}
        </div>
      </div>
      <div class="chud-sep"></div>
      <div class="chud-list"></div>
      ${isGM ? `
      <div class="chud-sep"></div>
      <div class="chud-cap chud-cap-right">
        <div class="chud-cap-col">
          ${mini("rollAll", "chud-rollall", "fa-dice", "SHIFT.Combat.RollAll")}
          ${mini("newRound", "chud-newround", "fa-flag-checkered", "SHIFT.Combat.NextRound")}
        </div>
      </div>` : ""}
    </div>`;

  listEl = hudEl.querySelector(".chud-list");
  roundNumEl = hudEl.querySelector(".chud-round-num");
  toggleBtn = hudEl.querySelector('[data-chud="toggleCombat"]');
  // Estes só fazem sentido com o combate JÁ iniciado; ficam desabilitados antes.
  roundBtns = [...hudEl.querySelectorAll('[data-chud="rollTurnOrder"], [data-chud="rollAll"], [data-chud="newRound"]')];

  bindListeners();
  return hudEl;
}

function bindListeners() {
  if (listenersBound) return;
  listenersBound = true;
  hudEl.addEventListener("click", onClick);
  // Roda do mouse rola a fila na horizontal QUANDO ela está scrollável (senão deixa
  // o evento passar para o canvas, que dá zoom). Scroll nativo simples, sem
  // stepping/snap/centralização — não briga com o spotlight.
  listEl.addEventListener("wheel", e => {
    if (!listEl.classList.contains("is-scrollable")) return;
    e.preventDefault();
    listEl.scrollLeft += (e.deltaY || e.deltaX);
  }, { passive: false });
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
const GAP = 8;       // folga entre a HUD e a navegação de cena / sidebar
const MIN_W = 240;   // largura mínima da banda (janelas estreitas)

/** Dimensiona a HUD para a BANDA do topo: da direita do CONTEÚDO do bloco esquerdo
 *  (controles + navegação de cena) até a esquerda da sidebar. O container recebe
 *  left+width = banda; a barra dentro dele fica centrada na banda (≈ centro da tela,
 *  pois os dois blocos têm largura parecida) e cresce para os lados conforme entram
 *  combatentes, até o limite. Guards de sanidade evitam que um rect estranho colapse
 *  a banda. */
function positionHud() {
  if (!hudEl?.classList.contains("visible")) return;
  const vw = window.innerWidth;

  // Limite esquerdo = borda direita do CONTEÚDO da esquerda. NÃO medir #ui-left: ele
  // é um frame de 50% da viewport (não encolhe ao conteúdo), então seu rect.right
  // daria ~50%vw e a banda começaria no canto, por cima do card de cenas. Medimos
  // as colunas/itens internos (controles + nav de cena) e pegamos a borda à direita.
  let left = EDGE;
  for (const id of ["ui-left-column-2", "ui-left-column-1", "scene-navigation", "scene-controls"]) {
    const r = document.getElementById(id)?.getBoundingClientRect();
    if (r && r.width > 0 && r.right > 0 && r.right < vw * 0.4) left = Math.max(left, r.right + GAP);
  }

  // Limite direito = borda esquerda da sidebar (#ui-right encolhe ao conteúdo).
  let right = vw - EDGE;
  for (const id of ["ui-right", "sidebar"]) {
    const r = document.getElementById(id)?.getBoundingClientRect();
    if (r && r.width > 0 && r.left > vw * 0.5) { right = Math.min(right, r.left - GAP); break; }
  }

  // Banda estreita: puxa o início para a esquerda p/ caber MIN_W, mas a borda
  // DIREITA do container nunca cruza a sidebar (senão o cap direito ficaria por
  // cima dela). Se nem assim couber, usa só o que há entre EDGE e a sidebar.
  if (right - left < MIN_W) left = Math.max(EDGE, right - MIN_W);
  const width = Math.max(0, right - left);
  hudEl.style.left = `${Math.round(left)}px`;
  hudEl.style.width = `${Math.round(width)}px`;
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
 *  `order` só com os ids de combatente (valida o foco do spotlight no resync). */
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

  // Estado dos controles: antes de iniciar, o round mostra "—", o toggle é "Start
  // Combat" e os botões de round (Roll Turn Order / Roll All / New Round) ficam
  // desabilitados; depois de iniciado, round real, toggle vira "End Combat" e os
  // botões de round liberam.
  const started = combat.started;
  if (roundNumEl) roundNumEl.textContent = combat.round > 0 ? String(combat.round) : "—";
  if (toggleBtn) {
    const label = game.i18n.localize(started ? "SHIFT.Combat.EndCombat" : "SHIFT.Combat.StartCombat");
    const icon = toggleBtn.querySelector("i");
    if (icon) icon.className = `fa-solid ${started ? "fa-power-off" : "fa-play"}`;
    toggleBtn.setAttribute("aria-label", label);
    toggleBtn.setAttribute("data-tooltip", label);
    toggleBtn.classList.toggle("is-end", started);
  }
  for (const b of roundBtns) b.disabled = !started;

  const items = buildItems(combat);
  order = items.filter(it => it.type === "combatant").map(it => it.combatant.id);

  // O spotlight reflete o turno CORRENTE do combate (combat.combatant). Logo após
  // rolar a ordem de turno o combate fica SEM turno (turn null, ver combat.mjs),
  // então spotlightId vira null e a HUD não destaca NINGUÉM — a seleção é sempre
  // manual (clique no card). Re-sincroniza no resync (turno/round/start) ou se o
  // foco local sumiu; senão preserva o foco local (browse do jogador). NUNCA cai
  // num "primeiro da fila" automático.
  const wasResync = resync;
  if (resync || !order.includes(spotlightId)) {
    spotlightId = combat.combatant?.id ?? null;
  }
  resync = false;

  const savedScroll = listEl.scrollLeft;
  listEl.innerHTML = items
    .map(it => it.type === "divider" ? dividerHtml(it.meta) : cardHtml(it.combatant, it.meta))
    .join("");

  hudEl.classList.add("visible");
  positionHud();

  // Depois do positionHud (que define a largura da banda): se a fila não couber nem
  // com os cards encolhidos (min 140px), vira SCROLLÁVEL — clipa e rola, então nada
  // transborda por cima da sidebar/caps. Mede com a largura já assentada.
  listEl.classList.toggle("is-scrollable", listEl.scrollWidth > listEl.clientWidth + 1);
  // Numa mudança de turno (resync) com a fila scrollável, centraliza o card em
  // spotlight para o turno corrente ficar SEMPRE visível; senão preserva a posição
  // de scroll (um rebuild de pip não joga a fila de volta ao início nem mexe no
  // browse do GM).
  const spot = listEl.classList.contains("is-scrollable")
    ? listEl.querySelector(".chud-card.is-spotlight") : null;
  if (wasResync && spot) {
    const lr = listEl.getBoundingClientRect();
    const sr = spot.getBoundingClientRect();
    listEl.scrollLeft += (sr.left - lr.left) - (listEl.clientWidth - sr.width) / 2;
  } else {
    listEl.scrollLeft = savedScroll;
  }
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

/* ------------------------------------------------------------------ */
/* Eventos                                                             */
/* ------------------------------------------------------------------ */

function onClick(e) {
  // Botões de controle do cap (rollTurnOrder/toggleCombat/rollAll/newRound).
  const cap = e.target.closest("[data-chud]");
  if (cap) {
    e.preventDefault();
    if (cap.disabled) return;
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
    case "rollTurnOrder": return void rollTurnOrder(combat);
    // Controle de combate — só GM. endCombat() do core já pede confirmação + apaga.
    case "toggleCombat":
      if (!game.user.isGM) return;
      return void (combat.started ? combat.endCombat() : combat.startCombat());
    case "rollAll": if (game.user.isGM) return void combat.rollAll(); break;
    case "newRound": if (game.user.isGM) return void combat.nextRound(); break;
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
  // Aparece assim que há um combate ativo COM combatentes (mesmo antes de iniciar),
  // para o botão Start Combat ficar acessível pela HUD.
  const combat = game.combats?.active;
  if (!combat || !combat.combatants.size) return hide();
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

  // A banda muda quando a sidebar RECOLHE/expande ou a navegação de cena muda de
  // largura: re-mede e reposiciona. NÃO reagimos a renderSidebar — ele dispara a
  // cada mensagem/clique no chat e fazia a HUD "se mexer"; collapseSidebar cobre o
  // recolher de verdade (a única mudança de largura da sidebar).
  const reposition = foundry.utils.debounce(positionHud, 60);
  for (const hook of ["collapseSidebar", "renderSceneNavigation"]) {
    Hooks.on(hook, () => reposition());
  }

  Hooks.on("canvasReady", () => refresh());
  Hooks.once("ready", () => refresh());
}
