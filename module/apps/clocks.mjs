/**
 * SHIFT VTT — painel de World Clocks ("Global Traits").
 *
 * Uma área de HUD fixa e minimalista (estilo relógios de progresso globais), não uma janela.
 * Cada entrada é um Global Trait livre, com um Shift Die que pode ser rolado
 * (pelo GM, ou pelos Players quando permitido) e que dá ShiftDown numa rolagem máxima.
 * A visibilidade é por entrada; todos veem as atualizações ao vivo.
 */
import { DIE_PROGRESSION, dieIndex, dieLabel, fvtt, promptText } from "../helpers/utils.mjs";
import { emitOrRun } from "../helpers/socket.mjs";

let panel = null;
let dragRow = null;

function getClocks() {
  return foundry.utils.deepClone(game.settings.get("shift-vtt", "clocks") ?? []);
}

async function saveClocks(clocks) {
  await emitOrRun({ action: "clocks", clocks });
}

/* ------------------------------------------------------------------ */
/* Renderização                                                        */
/* ------------------------------------------------------------------ */

function ensurePanel() {
  if (panel) return panel;
  panel = document.createElement("aside");
  panel.id = "shift-clocks-panel";
  panel.classList.add("shift-vtt");
  document.body.appendChild(panel);
  panel.addEventListener("click", onPanelClick);
  panel.addEventListener("contextmenu", onPanelContext);
  enableRowReorder();
  enableHeaderDrag();
  // Reposiciona quando a janela ou a UI-scale muda: re-clampa o ponto custom, ou re-docka.
  window.addEventListener("resize", positionClocks);
  return panel;
}

/**
 * Posiciona o painel: no ponto custom salvo se o GM o arrastou, senão
 * dockado logo acima da lista de Players. Como no Action HUD, a posição salva é
 * um objeto NULLABLE (não um booleano "pinned"), então limpá-la sempre cai de volta
 * para o dock medido; o painel nunca fica perdido flutuando fora da tela.
 */
function positionClocks() {
  if (!panel?.isConnected || !panel.classList.contains("visible")) return;
  const saved = game.settings.get("shift-vtt", "clocksPanelPos");
  if (saved && saved.left != null && saved.top != null) placeClocksAt(saved.left, saved.top);
  else dockToPlayers();
}

/**
 * Docka o painel logo acima da lista de Players, casando com a largura dela. O painel
 * permanece um filho position:fixed de <body> (nunca dentro do #ui-left, que é
 * transformado e tem pointer-events:none) e é posicionado puramente por MEDIÇÃO: lemos
 * o rect de tela ao vivo da caixa de players visível de 200px (#players-active,
 * que já reflete o --ui-scale do Foundry) e alinhamos a ela. Seu z-index fica
 * ABAIXO da lista de Players, então a bandeja de offline simplesmente se expande por cima.
 */
function dockToPlayers() {
  if (!panel?.isConnected || !panel.classList.contains("visible")) return;
  panel.classList.remove("custom-pos");
  const players = document.getElementById("players");
  // #players não tem largura própria; a caixa de 200px é #players-active.
  const box = players?.querySelector("#players-active") ?? players;
  const rect = box?.getBoundingClientRect();
  if (!rect || rect.width < 1) return;   // UI de Players ainda não pronta → um hook tenta de novo
  const GAP = 6;
  panel.style.left = `${Math.round(rect.left)}px`;
  panel.style.width = `${Math.round(rect.width)}px`;
  panel.style.top = "auto";
  panel.style.bottom = `${Math.round(window.innerHeight - rect.top + GAP)}px`;
}

/** Move o painel para um ponto livre (ancorado pelo canto superior esquerdo), totalmente clampado
 *  na tela, para que um arraste ou um resize de janela nunca o deixem fora da tela. */
function placeClocksAt(left, top) {
  panel.classList.add("custom-pos");
  const M = 4;
  const w = panel.offsetWidth || 250;
  const h = panel.offsetHeight || 0;
  left = Math.min(Math.max(left, M), Math.max(M, window.innerWidth - w - M));
  top = Math.min(Math.max(top, M), Math.max(M, window.innerHeight - h - M));
  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(top)}px`;
  panel.style.bottom = "auto";
  panel.style.width = "";   // flutuante: descarta a largura dockada, usa a natural
}

/** Limpa o ponto custom e volta para a posição dockada acima de Players. */
async function redockClocks() {
  await game.settings.set("shift-vtt", "clocksPanelPos", null);
  panel.classList.remove("custom-pos");
  positionClocks();
}

/** O painel INTEIRO sobrepõe a zona de "dock aqui" (estilo SmallTime)? A zona
 *  é uma faixa ao longo da borda superior da lista de Players (onde o painel docka); a
 *  colisão testa o rect completo do painel, não só o ponto de arraste. Sobrepô-la
 *  faz o painel tremer; soltar ali o encaixa de volta no dock. */
function inPlayersPinZone() {
  const players = document.getElementById("players");
  const box = players?.querySelector("#players-active") ?? players;
  const r = box?.getBoundingClientRect();
  if (!r || r.width < 1) return false;
  const BAND = 50;
  const z = { left: r.left, right: r.left + r.width, top: r.top - BAND, bottom: r.top + BAND };
  const p = panel.getBoundingClientRect();
  return p.left < z.right && p.right > z.left && p.top < z.bottom && p.bottom > z.top;
}

/** Arraste o cabeçalho (não seus botões) para mover o painel, como no Action HUD. Um
 *  pequeno limiar de movimento evita que um toque acidental seja salvo; abaixo dele
 *  o pointerdown continua sendo um clique simples (então os botões de +/minimizar ainda disparam).
 *  Estilo SmallTime: enquanto o ponteiro está sobre a lista de Players o painel treme,
 *  e soltar ali o encaixa de volta no dock; em qualquer outro lugar salva um ponto livre. */
function enableHeaderDrag() {
  let drag = null;
  panel.addEventListener("pointerdown", ev => {
    if (ev.button !== 0) return;                       // só o botão esquerdo
    if (!ev.target.closest(".clocks-head")) return;    // o cabeçalho é a alça
    if (ev.target.closest("[data-act]")) return;       // botões não são alças de arraste
    const rect = panel.getBoundingClientRect();
    drag = { dx: ev.clientX - rect.left, dy: ev.clientY - rect.top, sx: ev.clientX, sy: ev.clientY, moved: false, pin: false };
    panel.setPointerCapture(ev.pointerId);
  });
  panel.addEventListener("pointermove", ev => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < 4) return;
    drag.moved = true;
    placeClocksAt(ev.clientX - drag.dx, ev.clientY - drag.dy);
    drag.pin = inPlayersPinZone();                  // sobreposição do painel inteiro, não do ponteiro
    panel.classList.toggle("snapping", drag.pin);   // treme sobre a zona de dock
  });
  panel.addEventListener("pointerup", async ev => {
    if (!drag) return;
    const { moved, pin } = drag;
    const dropToDock = moved && (pin || inPlayersPinZone());
    drag = null;
    panel.classList.remove("snapping");
    try { panel.releasePointerCapture(ev.pointerId); } catch (e) { /* já liberado */ }
    if (!moved) return;                 // um clique, não um arraste; não persiste nada
    if (dropToDock) return redockClocks();   // encaixou sobre Players → docka acima dela
    const rect = panel.getBoundingClientRect();
    await game.settings.set("shift-vtt", "clocksPanelPos", { left: rect.left, top: rect.top });
  });
}

/** O GM arrasta as linhas para reordenar os contadores. */
function enableRowReorder() {
  panel.addEventListener("dragstart", ev => {
    if (!game.user.isGM) return;
    const row = ev.target.closest("[data-clock-id]");
    if (!row) return;
    dragRow = row.dataset.clockId;
    ev.dataTransfer.effectAllowed = "move";
  });
  panel.addEventListener("dragover", ev => {
    if (dragRow) ev.preventDefault();
  });
  panel.addEventListener("drop", async ev => {
    if (!dragRow) return;
    ev.preventDefault();
    const targetRow = ev.target.closest("[data-clock-id]");
    const fromId = dragRow;
    dragRow = null;
    if (!targetRow || targetRow.dataset.clockId === fromId) return;
    const clocks = getClocks();
    const fromIdx = clocks.findIndex(c => c.id === fromId);
    const toIdx = clocks.findIndex(c => c.id === targetRow.dataset.clockId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = clocks.splice(fromIdx, 1);
    clocks.splice(toIdx, 0, moved);
    await saveClocks(clocks);
  });
}

/** Renderiza uma linha de Global Trait (o único modo de clock). */
function clockRow(c, isGM) {
  const die = c.exhausted ? null : c.currentDie;
  const img = die ? CONFIG.SHIFT.diceImages[die] : null;
  const canRoll = !c.exhausted && (isGM || c.playersCanRoll);
  // Um Global Trait pode ser marcado para NUNCA dar ShiftDown numa rolagem máxima (estado off).
  const shiftsOff = c.shiftsDown === false;
  const scaleOn = game.settings.get("shift-vtt", "enableScale") !== false;
  const scale = c.scale ?? 1;
  const scaleLabel = `${game.i18n.localize("SHIFT.Trait.Scale")} ${scale}`;
  // Pip de notificação de canto padronizado (igual aos cards de Trait / HUD / pickers);
  // o hover mostra "Scale N". Exibido para todos quando o Trait está acima de Scale 1.
  const scalePip = (scaleOn && scale > 1)
    ? `<span class="scale-pip" data-scale="${scale}" data-tooltip="${scaleLabel}">${scale}</span>` : "";
  return `
    <li class="clock trait-clock${c.exhausted ? " exhausted" : ""}${c.visible ? "" : " gm-only"}" data-clock-id="${c.id}"${isGM ? ' draggable="true"' : ""}>
      <a class="clock-die${canRoll ? " rollable" : ""}" data-act="${canRoll ? "roll" : ""}"
         data-tooltip="${c.exhausted ? game.i18n.localize("SHIFT.DiceStatus.exhausted") : dieLabel(die)}${canRoll ? " &middot; " + game.i18n.localize("SHIFT.Tooltips.RollIcon") : ""}">
        ${img ? `<img src="${img}" alt=""/>` : `<i class="fa-solid fa-xmark"></i>`}
        ${scalePip}
      </a>
      <span class="clock-name">${foundry.utils.escapeHTML(c.name)}</span>
      ${isGM ? `
        <span class="clock-tools">
          <a data-act="up" data-tooltip="${game.i18n.localize("SHIFT.Tooltips.ShiftUp")}"><i class="fa-solid fa-circle-arrow-up"></i></a>
          <a data-act="down" data-tooltip="${game.i18n.localize("SHIFT.Tooltips.ShiftDown")}"><i class="fa-solid fa-circle-arrow-down"></i></a>
          <a data-act="noshift"${shiftsOff ? ' class="off"' : ""} data-tooltip="${game.i18n.localize(shiftsOff ? "SHIFT.Clocks.ShiftOffTip" : "SHIFT.Clocks.ShiftOnTip")}"><i class="fa-solid fa-angles-down"></i></a>
          ${scaleOn ? `<a data-act="scale" data-tooltip="${scaleLabel}"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></a>` : ""}
          <a data-act="vis"><i class="fa-solid ${c.visible ? "fa-eye" : "fa-eye-slash"}"></i></a>
          <a data-act="del" class="danger"><i class="fa-solid fa-trash"></i></a>
        </span>` : ""}
    </li>`;
}

export function renderClocksPanel() {
  const el = ensurePanel();
  const isGM = game.user.isGM;
  const open = game.settings.get("shift-vtt", "clocksPanelOpen");
  const minimized = game.settings.get("shift-vtt", "clocksPanelMinimized");
  const clocks = getClocks().filter(c => c.mode === "trait" && (isGM || c.visible));

  if (!open || (!clocks.length && !isGM)) {
    el.classList.remove("visible");
    el.innerHTML = "";
    return;
  }

  el.classList.toggle("minimized", !!minimized);
  el.classList.toggle("player-view", !isGM);
  el.innerHTML = `
    <header class="clocks-head">
      <span class="clocks-grip" data-tooltip="${game.i18n.localize("SHIFT.Clocks.Move")}"><i class="fa-solid fa-grip-vertical"></i></span>
      ${isGM ? `<a class="clocks-add" data-act="add" data-tooltip="${game.i18n.localize("SHIFT.Clocks.Add")}"><i class="fa-solid fa-plus"></i></a>` : ""}
      <span class="clocks-title"><i class="fa-solid fa-dice-d6"></i> ${game.i18n.localize("SHIFT.Clocks.Title")}</span>
      <span class="clocks-actions">
        <a data-act="min" data-tooltip="${game.i18n.localize(minimized ? "SHIFT.Clocks.Restore" : "SHIFT.Clocks.Minimize")}">
          <i class="fa-solid ${minimized ? "fa-chevron-up" : "fa-chevron-down"}"></i>
        </a>
      </span>
    </header>
    ${minimized ? "" : `<ul class="clock-list">${clocks.map(c => clockRow(c, isGM)).join("")}</ul>`}`;
  el.classList.add("visible");
  positionClocks();
}

/* ------------------------------------------------------------------ */
/* Interação                                                           */
/* ------------------------------------------------------------------ */

async function onPanelClick(event) {
  const actEl = event.target.closest("[data-act]");
  if (!actEl || !actEl.dataset.act) return;
  const act = actEl.dataset.act;
  const row = actEl.closest("[data-clock-id]");
  const clocks = getClocks();
  const clock = row ? clocks.find(c => c.id === row.dataset.clockId) : null;

  switch (act) {
    case "min":
      return toggleClocksMinimized();
    case "add":
      return promptClock();
    case "vis":
      if (!game.user.isGM || !clock) return;
      clock.visible = !clock.visible;
      return saveClocks(clocks);
    case "noshift":
      if (!game.user.isGM || !clock) return;
      // Alterna se uma rolagem máxima dá ShiftDown neste Global Trait (padrão: ligado).
      clock.shiftsDown = clock.shiftsDown === false;
      return saveClocks(clocks);
    case "del":
      if (!game.user.isGM || !clock) return;
      return saveClocks(clocks.filter(c => c.id !== clock.id));
    case "up": {
      if (!game.user.isGM || !clock || clock.mode !== "trait") return;
      if (clock.exhausted) { clock.exhausted = false; clock.currentDie = "d12"; }
      else {
        const idx = dieIndex(clock.currentDie);
        const maxIdx = dieIndex(clock.maxDie ?? "d4");
        if (idx > maxIdx) clock.currentDie = DIE_PROGRESSION[idx - 1];
      }
      return saveClocks(clocks);
    }
    case "down": {
      if (!game.user.isGM || !clock || clock.mode !== "trait" || clock.exhausted) return;
      shiftClockDown(clock);
      return saveClocks(clocks);
    }
    case "scale": {
      if (!game.user.isGM || !clock || game.settings.get("shift-vtt", "enableScale") === false) return;
      const opts = [1, 2, 3, 4];
      clock.scale = opts[(opts.indexOf(clock.scale ?? 1) + 1) % opts.length];
      return saveClocks(clocks);
    }
    case "roll":
      if (!clock || clock.mode !== "trait" || clock.exhausted) return;
      if (!game.user.isGM && !clock.playersCanRoll) return;
      return rollClockTrait(clock);
  }
}

async function toggleClocksMinimized() {
  const min = game.settings.get("shift-vtt", "clocksPanelMinimized");
  await game.settings.set("shift-vtt", "clocksPanelMinimized", !min);
  renderClocksPanel();
}

/** Clicar com o botão direito numa linha de Global Trait (só GM) abre o diálogo de edição dela. */
function onPanelContext(event) {
  if (!game.user.isGM) return;
  const row = event.target.closest("[data-clock-id]");
  if (!row) return;
  event.preventDefault();
  const clock = getClocks().find(c => c.id === row.dataset.clockId);
  if (clock) promptClock(clock);
}

function shiftClockDown(clock) {
  const idx = dieIndex(clock.currentDie);
  if (idx >= DIE_PROGRESSION.length - 1) clock.exhausted = true;
  else clock.currentDie = DIE_PROGRESSION[idx + 1];
}

/**
 * Rola um Global Trait. Renderizado pelo MESMO roll card de um Action Roll
 * comum de Trait único, então a formatação (linha de dados, linha de resultado,
 * lista de ShiftDown) é idêntica à de qualquer outra rolagem de Trait.
 */
async function rollClockTrait(clock) {
  const die = clock.currentDie;
  const roll = new Roll(`1${die}`);
  await roll.evaluate();
  const value = roll.dice[0].results[0].result;
  const faces = roll.dice[0].faces;

  // Resolve o resultado com a lógica padrão de dado único do sistema.
  const entry = {
    name: clock.name,
    die,
    dieLabel: dieLabel(die),
    value,
    faces,
    isOne: value === 1,
    isSuccess: value <= CONFIG.SHIFT.successMax,
    isMax: value === faces
  };
  const critRule = game.settings.get("shift-vtt", "critRule");
  const outcome = game.shift.ShiftRoll.determineOutcome([entry], "normal", critRule);

  // Um Global Trait marcado como "sem ShiftDown" nunca dá shift numa rolagem máxima: descarta o
  // shift planejado para que o card mostre um resultado simples (sem nota de ShiftDown).
  if (clock.shiftsDown === false) entry.willShift = false;

  // Um dado no seu máximo dá ShiftDown no Global Trait, igual a qualquer Trait.
  const shifts = [];
  if (entry.willShift) {
    const clocks = getClocks();
    const live = clocks.find(c => c.id === clock.id);
    if (live) {
      const from = live.exhausted ? "exhausted" : live.currentDie;
      shiftClockDown(live);
      await saveClocks(clocks);
      shifts.push({
        name: clock.name,
        from: dieLabel(from),
        to: live.exhausted ? null : dieLabel(live.currentDie),
        exhausted: live.exhausted,
        applied: true
      });
      entry.shiftApplied = true;
      entry.becameExhausted = live.exhausted;
    }
  }

  const meta = CONFIG.SHIFT.rollResults[outcome.type];
  const cardData = {
    actor: { name: clock.name, img: CONFIG.SHIFT.diceImages[die] ?? "icons/svg/d20-grey.svg", uuid: "" },
    rollType: "normal",
    rollTypeLabel: game.i18n.localize(CONFIG.SHIFT.rollTypes.normal),
    isSpecialType: false,
    turnOrder: false,
    groupRoll: false,
    scale: clock.scale ?? 1,
    entries: [{
      name: entry.name,
      dieLabel: entry.dieLabel,
      die: entry.die,
      value: entry.value,
      isOne: entry.isOne,
      isSuccess: entry.isSuccess,
      isMax: entry.isMax,
      willShift: entry.willShift,
      shiftApplied: entry.shiftApplied ?? false,
      shiftPending: false,
      becameExhausted: entry.becameExhausted ?? false
    }],
    outcome: { type: outcome.type, css: meta.css, icon: meta.icon, label: game.i18n.localize(meta.label) },
    shifts,
    xp: { granted: 0 },
    crit: { show: false, count: 0 },
    apply: { show: false },
    phase: null
  };

  const content = await fvtt.renderTemplate("systems/shift-vtt/templates/chat/roll-card.hbs", cardData);
  await ChatMessage.create({
    speaker: { alias: game.user.name },
    content,
    rolls: [roll],
    sound: CONFIG.sounds.dice,
    flags: { "shift-vtt": { kind: "clockRoll" } }
  });
}

/* ------------------------------------------------------------------ */
/* Diálogo de criação                                                  */
/* ------------------------------------------------------------------ */

/**
 * Cria OU edita um Global Trait. Passe um clock existente para editá-lo (aberto
 * clicando com o botão direito na linha dele); não passe nada para criar um novo (o botão +).
 * Ambos expõem os mesmos campos: nome, Max Die, Scale e os três toggles.
 */
async function promptClock(existing = null) {
  const isEdit = !!existing;

  // Nome provisório para que o campo nunca fique em branco; numerado quando já existem outros.
  const base = game.i18n.localize("SHIFT.Clocks.DefaultName");
  const traitCount = getClocks().filter(c => c.mode === "trait").length;
  const fallbackName = foundry.utils.escapeHTML(traitCount ? `${base} ${traitCount + 1}` : base);
  const nameVal = isEdit ? foundry.utils.escapeHTML(existing.name ?? "") : fallbackName;

  // Pré-preenche a partir do clock existente ao editar, senão usa os padrões de criação.
  const curDie = (isEdit ? existing.maxDie : "d6") || "d6";
  const curScale = (isEdit ? existing.scale : 1) || 1;
  const curVisible = isEdit ? existing.visible !== false : true;
  const curPlayersRoll = isEdit ? !!existing.playersCanRoll : false;
  const curShiftsDown = isEdit ? existing.shiftsDown !== false : true;

  // Cada opção de dado mostra a imagem real do dado; o escolhido acende na sua
  // própria cor canônica. Os chips de Scale seguem a escala 1🟢 2🟡 3🟠 4🔴.
  const dice = DIE_PROGRESSION.map(d =>
    `<label class="seg-opt seg-die" data-die="${d}" data-tooltip="${dieLabel(d)}">
       <input type="radio" name="die" value="${d}" ${d === curDie ? "checked" : ""}/>
       <span><img src="${CONFIG.SHIFT.diceImages[d]}" alt=""/><em>${dieLabel(d)}</em></span>
     </label>`).join("");
  const scaleOn = game.settings.get("shift-vtt", "enableScale") !== false;
  const scales = [1, 2, 3, 4].map(s =>
    `<label class="seg-opt seg-scale" data-scale="${s}"><input type="radio" name="scale" value="${s}" ${s === curScale ? "checked" : ""}/><span>${s}</span></label>`).join("");

  const content = `
    <div class="shift-prompt new-clock">
      ${isEdit ? "" : `<p class="nc-hint">${game.i18n.localize("SHIFT.Clocks.AddHint")}</p>`}
      <div class="prompt-field">
        <span class="prompt-label">${game.i18n.localize("SHIFT.Clocks.NameLabel")}</span>
        <input type="text" name="name" value="${nameVal}" placeholder="${fallbackName}" autofocus/>
      </div>
      <div class="prompt-field">
        <span class="prompt-label">${game.i18n.localize("SHIFT.ItemSheet.MaxDie")}</span>
        <div class="seg-opts seg-dice">${dice}</div>
      </div>
      ${scaleOn ? `<div class="prompt-field">
        <span class="prompt-label">${game.i18n.localize("SHIFT.Trait.Scale")}</span>
        <div class="seg-opts seg-scales">${scales}</div>
      </div>` : ""}
      <div class="nc-toggles">
        <label class="prompt-check"><input type="checkbox" name="shiftsDown" ${curShiftsDown ? "checked" : ""}/><span>${game.i18n.localize("SHIFT.Clocks.ShiftsDown")}</span></label>
        <label class="prompt-check"><input type="checkbox" name="visible" ${curVisible ? "checked" : ""}/><span>${game.i18n.localize("SHIFT.Clocks.Visible")}</span></label>
        <label class="prompt-check"><input type="checkbox" name="playersCanRoll" ${curPlayersRoll ? "checked" : ""}/><span>${game.i18n.localize("SHIFT.Clocks.PlayersRoll")}</span></label>
      </div>
    </div>`;

  let data = null;
  try {
    data = await fvtt.DialogV2.wait({
      window: {
        title: game.i18n.localize(isEdit ? "SHIFT.Clocks.Edit" : "SHIFT.Clocks.Add"),
        icon: isEdit ? "fa-solid fa-pen-to-square" : "fa-solid fa-dice-d6"
      },
      position: { width: 360 },
      classes: ["shift-vtt", "shift-dialog"],
      content,
      rejectClose: false,
      // Pré-seleciona o nome para que digitar o substitua imediatamente.
      render: (event, dialog) => {
        const input = dialog?.element?.querySelector?.('input[name="name"]');
        if (input) { input.focus(); input.select(); }
      },
      buttons: [
        {
          action: "ok", default: true, icon: isEdit ? "fa-solid fa-check" : "fa-solid fa-plus",
          label: game.i18n.localize(isEdit ? "SHIFT.Clocks.Save" : "SHIFT.Common.Confirm"),
          callback: (event, button) => {
            const f = button.form;
            return {
              name: f.elements.name.value?.trim(),
              die: f.elements.die?.value || "d6",
              scale: Number(f.elements.scale?.value) || 1,
              visible: f.elements.visible.checked,
              playersCanRoll: f.elements.playersCanRoll?.checked ?? false,
              shiftsDown: f.elements.shiftsDown?.checked ?? true
            };
          }
        },
        { action: "cancel", label: game.i18n.localize("SHIFT.Common.Cancel") }
      ]
    });
  } catch (err) { data = null; }
  if (!data || data === "cancel" || !data.name) return;

  const clocks = getClocks();
  if (isEdit) {
    const live = clocks.find(c => c.id === existing.id);
    if (!live) return;
    // O radio de dado define o Max Die (teto). Mantém o currentDie ao vivo, a menos que
    // o Trait estivesse no máximo (acompanha o novo teto) ou o dado atual agora seja
    // mais forte que o teto (clampa para baixo; nunca pode exceder o Max Die).
    const wasFull = !live.exhausted && live.currentDie === live.maxDie;
    live.name = data.name;
    live.maxDie = data.die;
    if (wasFull) live.currentDie = data.die;
    else if (!live.exhausted && dieIndex(live.currentDie) < dieIndex(data.die)) live.currentDie = data.die;
    live.scale = data.scale;
    live.visible = data.visible;
    live.playersCanRoll = data.playersCanRoll;
    live.shiftsDown = data.shiftsDown;
  } else {
    clocks.push({
      id: foundry.utils.randomID(),
      name: data.name,
      mode: "trait",
      visible: data.visible,
      maxDie: data.die,
      currentDie: data.die,
      scale: data.scale,
      exhausted: false,
      playersCanRoll: data.playersCanRoll,
      shiftsDown: data.shiftsDown
    });
  }
  await saveClocks(clocks);
}

/* ------------------------------------------------------------------ */
/* Registro                                                            */
/* ------------------------------------------------------------------ */

export async function toggleClocksPanel() {
  const open = game.settings.get("shift-vtt", "clocksPanelOpen");
  await game.settings.set("shift-vtt", "clocksPanelOpen", !open);
  renderClocksPanel();
}

export function registerClocks() {
  Hooks.on("ready", () => renderClocksPanel());
  Hooks.on("updateSetting", setting => {
    if (setting.key === "shift-vtt.clocks") renderClocksPanel();
  });

  // Reposiciona acima da lista de Players sempre que ela (re)renderiza ou o layout
  // muda (o V13 dispara renderPlayers; cores mais antigos disparam renderPlayerList). Um
  // painel posicionado de forma custom apenas re-clampa e fica no lugar.
  for (const hook of ["renderPlayers", "renderPlayerList", "collapseSidebar"]) {
    Hooks.on(hook, () => positionClocks());
  }

  Hooks.on("getSceneControlButtons", controls => {
    if (!controls?.tokens?.tools) return;
    controls.tokens.tools["shift-clocks"] = {
      name: "shift-clocks",
      title: "SHIFT.Clocks.Title",
      icon: "fa-solid fa-dice-d6",
      button: true,
      order: 99,
      onChange: () => toggleClocksPanel()
    };
  });
}
