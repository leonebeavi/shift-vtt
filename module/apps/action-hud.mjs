/**
 * SHIFT VTT, Action HUD.
 *
 * Uma barra rápida nativa: enquanto um Token está controlado (ou,
 * opcionalmente, para o personagem atribuído ao Player), suas Traits e
 * Techniques aparecem na parte de baixo da tela. A barra dispõe TUDO inline por
 * padrão; Focus Traits e Techniques só se recolhem em submenus de popover quando
 * a barra inline ficaria larga demais para a tela. Pack/Cargo Traits ficam
 * soltas (Shift+clique nelas para gastá-las por uma Focus Trait temporária). O
 * nome do Actor dono flutua acima da barra, alinhado com sua primeira Trait. Os
 * submenus abrem ao clicar ou ao passar o mouse (uma configuração por Player).
 * Arraste a alça para reposicionar.
 */

let hudElement = null;
let currentActorUuid = null;
let hoverCloseTimer = null;   // fechamento de submenu pendente no modo hover (debounced)

function ensureElement() {
  if (hudElement?.isConnected) return hudElement;
  hudElement = document.createElement("div");
  hudElement.id = "shift-action-hud";
  hudElement.classList.add("shift-vtt");
  document.body.appendChild(hudElement);
  hudElement.addEventListener("click", onHudClick);
  enableDragging();
  document.addEventListener("pointerdown", ev => {
    if (!hudElement.contains(ev.target)) closeMenus();
  });
  // Fecha popovers abertos no Escape ou quando a janela perde o foco, como os
  // próprios HUDs do Foundry (caso contrário é fácil deixar um popover preso aberto).
  document.addEventListener("keydown", ev => { if (ev.key === "Escape") closeMenus(); });
  window.addEventListener("blur", () => closeMenus());
  // Submenus que abrem ao passar o mouse (quando o Player escolhe esse modo).
  // Delegado para sobreviver às reconstruções da barra; condicionado à classe .hover-menus.
  hudElement.addEventListener("pointerover", ev => {
    if (!hudElement.classList.contains("hover-menus")) return;
    const menu = ev.target.closest?.(".hud-menu");
    if (!menu) return;
    // Cancela um fechamento pendente (ex.: o ponteiro atravessando o vão toggle→popover).
    if (hoverCloseTimer) { clearTimeout(hoverCloseTimer); hoverCloseTimer = null; }
    if (!menu.classList.contains("open")) { closeMenus(); openMenu(menu); }
  });
  hudElement.addEventListener("pointerout", ev => {
    if (!hudElement.classList.contains("hover-menus")) return;
    const menu = ev.target.closest?.(".hud-menu");
    if (!menu || menu.contains(ev.relatedTarget)) return;
    // Atrasa o fechamento para que mover-se pelo vão entre o toggle e seu
    // popover não feche o submenu de repente antes do ponteiro chegar.
    if (hoverCloseTimer) clearTimeout(hoverCloseTimer);
    hoverCloseTimer = setTimeout(() => { closeOneMenu(menu); hoverCloseTimer = null; }, 150);
  });
  return hudElement;
}

const HUD_GAP = 8;     // px de vão acima da hotbar
const HUD_MARGIN = 4;  // mínimo de px de qualquer borda da viewport

/**
 * Posiciona a barra: no ponto personalizado salvo se foi arrastada, senão
 * centralizada logo ACIMA da hotbar de macros. O resultado é SEMPRE limitado
 * para caber inteiro dentro da viewport, então um redimensionamento da janela
 * (ou uma posição salva com um tamanho maior) nunca pode deixar a barra presa
 * fora da tela. `left` é o CENTRO da barra (o CSS mantém translateX(-50%)). Lê
 * os rects ao vivo, então respeita o --ui-scale do Foundry.
 */
function positionHud() {
  if (!hudElement?.isConnected || !hudElement.classList.contains("visible")) return;
  const ow = hudElement.offsetWidth;
  const oh = hudElement.offsetHeight;
  if (!ow || !oh) return;
  const half = ow / 2;

  const saved = game.settings.get("shift-vtt", "hudPosition");
  let cx, top;
  if (saved?.cx != null && saved?.cy != null) {
    cx = saved.cx;
    top = saved.cy;
  } else {
    const r = document.getElementById("hotbar")?.getBoundingClientRect();
    if (r?.width) {
      cx = r.left + r.width / 2;     // centralizado na hotbar (NÃO na viewport)
      top = r.top - oh - HUD_GAP;    // logo acima dela
    } else {
      cx = window.innerWidth / 2;
      top = window.innerHeight - oh - 96;
    }
  }

  // Limita a barra inteira na tela; força cada limite superior ao seu limite
  // inferior para que uma barra maior que a viewport fixe na borda em vez de inverter.
  const maxCx = Math.max(half + HUD_MARGIN, window.innerWidth - half - HUD_MARGIN);
  const maxTop = Math.max(HUD_MARGIN, window.innerHeight - oh - HUD_MARGIN);
  cx = Math.min(Math.max(cx, half + HUD_MARGIN), maxCx);
  top = Math.min(Math.max(top, HUD_MARGIN), maxTop);

  hudElement.classList.add("custom-pos");
  hudElement.style.left = `${Math.round(cx)}px`;
  hudElement.style.top = `${Math.round(top)}px`;
}

/** A barra INTEIRA sobrepõe a zona de "encaixar aqui", uma faixa cruzando a
 *  borda superior da hotbar (estilo SmallTime, espelhando o painel de Global
 *  Traits mas ancorado na hotbar)? A colisão testa o rect completo da barra, não
 *  apenas o ponto de arraste. Soltar a barra aqui a encaixa de volta acima da
 *  hotbar; sobrepô-la faz tremer. */
function inHotbarPinZone() {
  const r = document.getElementById("hotbar")?.getBoundingClientRect();
  if (!r || r.width < 1) return false;
  const BAND = 50;
  const z = { left: r.left, right: r.left + r.width, top: r.top - BAND, bottom: r.top + BAND };
  const b = hudElement.getBoundingClientRect();
  return b.left < z.right && b.right > z.left && b.top < z.bottom && b.bottom > z.top;
}

/** Limpa o ponto salvo e encaixa de volta na posição acima da hotbar. */
async function redockHud() {
  await game.settings.set("shift-vtt", "hudPosition", null);
  positionHud();
}

/** Arraste em qualquer lugar da alça; a âncora persistida é o CENTRO da barra.
 *  Um pequeno limiar de movimento impede que um empurrão acidental seja salvo
 *  como arraste; abaixo dele, o pointerdown é tratado como um clique simples.
 *  Estilo SmallTime: enquanto o ponteiro está sobre a borda superior da hotbar a
 *  barra treme, e soltar ali a encaixa de volta no dock; em qualquer outro lugar
 *  salva o ponto livre. */
function enableDragging() {
  let drag = null;
  hudElement.addEventListener("pointerdown", ev => {
    const handle = ev.target.closest(".hud-grip");
    if (!handle) return;
    ev.preventDefault();
    const rect = hudElement.getBoundingClientRect();
    drag = {
      dx: ev.clientX - (rect.left + rect.width / 2),
      dy: ev.clientY - rect.top,
      sx: ev.clientX,
      sy: ev.clientY,
      moved: false,
      pin: false
    };
    hudElement.setPointerCapture(ev.pointerId);
  });
  hudElement.addEventListener("pointermove", ev => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < 4) return;
    drag.moved = true;
    hudElement.classList.add("custom-pos");
    const rect = hudElement.getBoundingClientRect();
    const half = rect.width / 2;
    const cx = Math.max(half, Math.min(window.innerWidth - half, ev.clientX - drag.dx));
    const cy = Math.max(0, Math.min(window.innerHeight - rect.height, ev.clientY - drag.dy));
    hudElement.style.left = `${cx}px`;
    hudElement.style.top = `${cy}px`;
    drag.pin = inHotbarPinZone();                        // sobreposição da barra inteira, não do ponteiro
    hudElement.classList.toggle("snapping", drag.pin);   // treme sobre a zona de dock
  });
  hudElement.addEventListener("pointerup", async ev => {
    if (!drag) return;
    const { moved, pin } = drag;
    const dropToDock = moved && (pin || inHotbarPinZone());
    drag = null;
    hudElement.classList.remove("snapping");
    try { hudElement.releasePointerCapture(ev.pointerId); } catch (e) { /* já liberado */ }
    if (!moved) return;                 // um clique, não um arraste; não persiste posição
    if (dropToDock) return redockHud();  // encaixou sobre a hotbar → ancora acima dela
    const rect = hudElement.getBoundingClientRect();
    await game.settings.set("shift-vtt", "hudPosition", {
      cx: rect.left + rect.width / 2,
      cy: rect.top
    });
  });
}

function hide() {
  currentActorUuid = null;
  if (hudElement) {
    hudElement.classList.remove("visible");
    hudElement.innerHTML = "";
  }
}

function openMenu(menu) {
  menu.classList.add("open");
  menu.querySelector(".menu-toggle")?.setAttribute("aria-expanded", "true");
  clampPopover(menu.querySelector(".hud-popover"));
}

function closeOneMenu(menu) {
  menu.classList.remove("open");
  menu.querySelector(".menu-toggle")?.setAttribute("aria-expanded", "false");
}

function closeMenus() {
  hudElement?.querySelectorAll(".hud-menu.open").forEach(closeOneMenu);
}

/** Mantém um popover aberto dentro da viewport: desloca-o horizontalmente se
 *  fosse transbordar por um lado, e o vira para baixo da barra se fosse cortar a borda superior. */
function clampPopover(pop) {
  if (!pop) return;
  pop.style.transform = "";
  pop.classList.remove("drop-down");
  const rect = pop.getBoundingClientRect();
  let shift = 0;
  if (rect.left < HUD_MARGIN) shift = HUD_MARGIN - rect.left;
  else if (rect.right > window.innerWidth - HUD_MARGIN) shift = (window.innerWidth - HUD_MARGIN) - rect.right;
  if (shift) pop.style.transform = `translateX(calc(-50% + ${Math.round(shift)}px))`;
  if (rect.top < HUD_MARGIN) pop.classList.add("drop-down");
}

function dieBadge(item) {
  const img = CONFIG.SHIFT.diceImages[item.statusKey];
  if (!img) return `<span class="hud-die exhausted-x"><i class="fa-solid fa-xmark"></i></span>`;
  return `<img class="hud-die" src="${img}" alt="${item.system.currentDie}"/>`;
}

/** Um pip de notificação sem borda, colorido pela Scale (número branco). Passar
 *  o mouse mostra o rótulo completo "Scale N". */
function scalePip(scale, extra = "") {
  const label = `${game.i18n.localize("SHIFT.Trait.Scale")} ${scale}`;
  return `<span class="hud-scale-pip${extra ? ` ${extra}` : ""}" data-scale="${scale}" aria-label="${label}" data-tooltip="${label}">${scale}</span>`;
}

/** Se o sistema opcional de Scale está habilitado (toggle mestre). */
function scaleOn() {
  return game.settings.get("shift-vtt", "enableScale") !== false;
}

function traitButton(t, canExert = false, scaleUpReady = null) {
  const name = foundry.utils.escapeHTML(t.name);
  // Uma Trait com um override de Scale (ou uma Scale herdada que difere da do
  // Actor, ex.: uma Trait de Vehicle tripulado) ganha um pip próprio.
  const pip = (t.scaleIsOverride && scaleOn()) ? scalePip(t.effectiveScale) : "";
  const status = t.system.exhausted
    ? game.i18n.localize("SHIFT.DiceStatus.exhausted")
    : t.system.currentDie.toUpperCase();
  // Este Focus tem uma Scaled Up Technique vinculada ainda com uso: o botão recebe
  // um glow rosa, lembrando que dá pra elevar a Scale deste Trait num roll.
  const scaleUp = !!scaleUpReady?.has(t.id);
  // Dicas de modificador: Pack/Cargo Traits são gastas por uma Focus temporária
  // no Shift+clique; toda outra Trait ativa faz Exert no Ctrl/⌘+clique (Exert é um
  // move de personagem, então a dica só aparece quando o Actor dono pode de fato Exert).
  const hint = ["pack", "cargo"].includes(t.system.category)
    ? ` · ${game.i18n.localize("SHIFT.Hud.PackShiftHint")}`
    : (canExert && !t.system.exhausted) ? ` · ${game.i18n.localize("SHIFT.Hud.ExertHint")}` : "";
  const scaleHint = scaleUp ? ` · ${game.i18n.localize("SHIFT.Hud.ScaleUpReadyHint")}` : "";
  return `
    <button type="button" class="hud-btn trait${t.system.exhausted ? " exhausted" : ""}${t.system.temporary ? " temporary" : ""}${scaleUp ? " scale-up-ready" : ""}"
            data-kind="trait" data-id="${t.id}" aria-label="${name}"
            data-tooltip="${name} (${status})${hint}${scaleHint}">
      ${pip}${dieBadge(t)}
      <span class="hud-label">${name}</span>
    </button>`;
}

function techButton(t) {
  const name = foundry.utils.escapeHTML(t.name);
  const atWill = t.isAtWill;
  const max = t.system.uses?.max ?? 0;
  const value = t.system.uses?.value ?? 0;
  // At Will tem usos ilimitados: mostra o ∞ no lugar do contador. As demais só
  // ganham a pill de usos quando têm um limite real (Max > 0).
  const limited = !atWill && max > 0;
  const exhausted = limited && value <= 0;
  const usesPill = atWill
    ? `<span class="hud-uses infinite" data-tooltip="${game.i18n.localize("SHIFT.Recharge.AtWillHint")}"><i class="fa-solid fa-infinity"></i></span>`
    : limited ? `<span class="hud-uses">${value}</span>` : "";
  const tipUses = atWill
    ? ` · ${game.i18n.localize("SHIFT.Recharge.atWill")}`
    : limited ? ` (${value}/${max})` : "";
  return `
    <button type="button" class="hud-btn technique${exhausted ? " exhausted" : ""}"
            data-kind="technique" data-id="${t.id}" aria-label="${name}"
            data-tooltip="${name}${tipUses}">
      <i class="fa-solid fa-wand-sparkles"></i>
      <span class="hud-label">${name}</span>
      ${usesPill}
    </button>`;
}

function menuGroup(kind, icon, label, buttons) {
  const esc = foundry.utils.escapeHTML(label);
  return `
    <span class="hud-menu" data-menu="${kind}">
      <button type="button" class="hud-btn menu-toggle" data-kind="menu"
              aria-haspopup="true" aria-expanded="false" aria-label="${esc}">
        <i class="fa-solid ${icon}"></i>
        <span class="hud-label">${esc}</span>
        <i class="fa-solid fa-chevron-up caret"></i>
      </button>
      <span class="hud-popover" role="menu">${buttons}</span>
    </span>`;
}

/**
 * Constrói o markup da barra. `collapse` controla apenas as Focus/Other Traits e
 * Techniques: quando false elas renderizam soltas (inline); quando true elas se
 * dobram em submenus de popover para manter a barra curta. Core, Pack e Cargo
 * Traits ficam sempre soltas. `openMenuKey` reabre o submenu que estava aberto
 * antes de uma reconstrução.
 */
function buildHud(actor, collapse, openMenuKey) {
  const el = hudElement;
  const actorScale = actor.system.scale ?? 1;
  const canExert = actor.type === "character";   // Exert é um move de XP de personagem
  const rollable = (actor.traits ?? []).filter(t => t.system.rollable);
  const cores = rollable.filter(t => ["core", "attitude"].includes(t.system.category));
  const others = rollable.filter(t => !["core", "attitude"].includes(t.system.category));
  const allTechniques = actor.techniques ?? [];
  // Scaled Up Techniques saem da barra: não dá pra usá-las sozinhas (o uso só
  // mostra uma dica). Em vez disso, o Focus Trait vinculado recebe o glow rosa.
  const techniques = allTechniques.filter(t => !t.isScaledUp);
  const vehicles = actor.crewedVehicles ?? [];

  // Focus Traits que têm uma Scaled Up Technique vinculada AINDA com uso ganham um
  // glow rosa. Gated no toggle mestre de Scale + no sub-toggle de Scaled Up, para
  // só sinalizar quando o Scale Up de fato pode ser aplicado num roll.
  const scaleUpReady = new Set();
  if (scaleOn() && game.settings.get("shift-vtt", "enableScaledUp")) {
    for (const tech of allTechniques) {
      if (!tech.isScaledUp || !tech.hasUse) continue;
      const focus = tech.focusTrait;
      if (focus && focus.actor === tech.actor) scaleUpReady.add(focus.id);
    }
  }

  const GROUP_OF = c =>
    (c === "focus" || c === "adversary") ? "focus"
    : c === "pack" ? "pack"
    : c === "cargo" ? "cargo"
    : "other";
  const groups = { focus: [], pack: [], cargo: [], other: [] };
  for (const t of others) groups[GROUP_OF(t.system.category)].push(t);

  const loose = list => list.map(t => traitButton(t, canExert, scaleUpReady)).join("");
  const asMenu = (key, icon, labelKey, list) => list.length
    ? menuGroup(key, icon, game.i18n.localize(labelKey), loose(list))
    : "";

  const coreBtns = loose(cores);
  // Focus / Other Traits e Techniques: soltas, a menos que estejamos recolhendo.
  const focusBtns = collapse ? asMenu("focus", "fa-layer-group", "SHIFT.Groups.Focus", groups.focus) : loose(groups.focus);
  const packBtns = loose(groups.pack);   // sempre soltas, entre Focus e Techniques
  const cargoBtns = loose(groups.cargo); // sempre soltas
  const otherBtns = collapse ? asMenu("other", "fa-shapes", "SHIFT.Groups.Other", groups.other) : loose(groups.other);
  const techBtns = !techniques.length ? ""
    : collapse
      ? menuGroup("tech", "fa-wand-sparkles", game.i18n.localize("SHIFT.Hud.Tech"), techniques.map(techButton).join(""))
      : techniques.map(techButton).join("");

  const groupBtn = actor.type === "character" ? `
    <button type="button" class="hud-btn group" data-kind="workTogether"
            aria-label="${game.i18n.localize("SHIFT.Group.Title")}"
            data-tooltip="${game.i18n.localize("SHIFT.Group.Title")}">
      <i class="fa-solid fa-people-arrows"></i>
    </button>` : "";

  const restBtn = actor.type === "character"
    ? menuGroup("rest", "fa-campground", game.i18n.localize("SHIFT.Hud.Rest"), `
        <button type="button" class="hud-btn" data-kind="safeRest">
          <i class="fa-solid fa-campground"></i><span class="hud-label">${game.i18n.localize("SHIFT.Rest.Safe")}</span>
        </button>
        <button type="button" class="hud-btn" data-kind="unsafeRest">
          <i class="fa-solid fa-fire"></i><span class="hud-label">${game.i18n.localize("SHIFT.Rest.Unsafe")}</span>
        </button>`)
    : "";

  let vehicleChip = "";
  if (vehicles.length === 1) {
    const v = vehicles[0];
    const vname = foundry.utils.escapeHTML(v.name);
    vehicleChip = `
      <button type="button" class="hud-btn vehicle" data-kind="vehicle" data-id="${v.id}"
              aria-label="${vname}" data-tooltip="${vname}">
        <i class="fa-solid fa-truck-field"></i>
      </button>`;
  } else if (vehicles.length > 1) {
    const vBtns = vehicles.map(v => {
      const vname = foundry.utils.escapeHTML(v.name);
      return `
        <button type="button" class="hud-btn" data-kind="vehicle" data-id="${v.id}" aria-label="${vname}">
          <i class="fa-solid fa-truck-field"></i><span class="hud-label">${vname}</span>
        </button>`;
    }).join("");
    vehicleChip = menuGroup("vehicle", "fa-truck-field", game.i18n.localize("SHIFT.Groups.Vehicle"), vBtns);
  }

  // Separadores apenas ENTRE clusters não-vazios; sem divisória solta no início ou no fim.
  const SEP = `<span class="hud-sep"></span>`;
  const tail = `${groupBtn}${restBtn}${vehicleChip}`;
  const body = [coreBtns, focusBtns, packBtns, cargoBtns, otherBtns, techBtns, tail]
    .filter(Boolean).join(SEP);

  el.innerHTML = `
    <div class="hud-row">
      ${(scaleOn() && actorScale > 1) ? scalePip(actorScale, "hud-scale") : ""}
      <span class="hud-name">${foundry.utils.escapeHTML(actor.name)}</span>
      <span class="hud-grip" data-tooltip="${game.i18n.localize("SHIFT.Hud.Drag")}"><i class="fa-solid fa-grip-vertical"></i></span>
      ${body}
    </div>`;

  if (openMenuKey) {
    const menu = el.querySelector(`.hud-menu[data-menu="${openMenuKey}"]`);
    if (menu) openMenu(menu);
  }
}

/** Posiciona o nome flutuante rente à borda esquerda da barra (a alça). */
function positionName() {
  const row = hudElement.querySelector(".hud-row");
  const name = row?.querySelector(".hud-name");
  const grip = row?.querySelector(".hud-grip");
  if (name) name.style.left = grip ? `${grip.offsetLeft}px` : "0px";
}

function render(actor) {
  const el = ensureElement();
  currentActorUuid = actor.uuid;
  el.classList.toggle("hover-menus", game.settings.get("shift-vtt", "hudMenuTrigger") === "hover");

  // Preserva um submenu aberto através de um refresh (o CRUD de Item reconstrói a barra).
  const openMenuKey = el.querySelector(".hud-menu.open")?.dataset.menu;

  // Dispõe tudo inline primeiro; só recolhe Focus/Other/Techniques em submenus se
  // os BOTÕES inline transbordarem metade da janela (max-width: 50vw). O nome
  // flutuante é ocultado para a sondagem, para que um nome de Actor longo (que é
  // posicionado de forma absoluta e de outro modo inflaria o scrollWidth) não
  // possa disparar um recolhimento falso.
  buildHud(actor, false, openMenuKey);
  const row = el.querySelector(".hud-row");
  if (row) {
    const name = row.querySelector(".hud-name");
    if (name) name.style.display = "none";
    // Os pips de Scale são overlays posicionados de forma absoluta que vazam
    // para fora da barra/botões (o pip da barra fica em right:-5px). Eles NÃO
    // devem contar na sondagem de overflow, senão um Actor com Scale>1 sempre
    // dispara a checagem de largura e recolhe Focus/Other/Techniques em submenus
    // prematuramente.
    const pips = row.querySelectorAll(".hud-scale-pip");
    pips.forEach(p => { p.style.display = "none"; });
    const overflows = row.scrollWidth > row.clientWidth + 1;
    if (name) name.style.display = "";
    pips.forEach(p => { p.style.display = ""; });
    if (overflows) buildHud(actor, true, openMenuKey);
  }

  positionName();
  el.classList.add("visible");
  positionHud();
}

async function onHudClick(event) {
  const btn = event.target.closest(".hud-btn");
  if (!btn || !currentActorUuid) return;
  const actor = await fromUuid(currentActorUuid);
  if (!actor) return;

  if (btn.dataset.kind === "menu") {
    if (hudElement.classList.contains("hover-menus")) return; // o hover gerencia abrir/fechar
    const menu = btn.closest(".hud-menu");
    const wasOpen = menu.classList.contains("open");
    closeMenus();
    if (!wasOpen) openMenu(menu);
    return;
  }
  closeMenus();

  switch (btn.dataset.kind) {
    case "workTogether": return game.shift.ShiftRoll.promptGroupStart(actor);
    case "safeRest": return actor.safeRest();
    case "unsafeRest": return actor.unsafeRest();
    case "vehicle": {
      const vehicle = actor.crewedVehicles?.find(v => v.id === btn.dataset.id) ?? actor.crewedVehicles?.[0];
      if (!vehicle) return;
      // Shift+clique abre a sheet do Vehicle; um clique normal rola com ele.
      if (event.shiftKey) return void vehicle.sheet?.render(true);
      return game.shift.ShiftRoll.promptActionRoll(vehicle);
    }
    case "technique": {
      const item = actor.items.get(btn.dataset.id);
      return item?.use();
    }
    case "trait": {
      const item = actor.items.get(btn.dataset.id);
      if (!item) return;
      // Shift+clique numa Pack/Cargo Trait a gasta por uma Focus Trait temporária.
      if (event.shiftKey && ["pack", "cargo"].includes(item.system.category)) {
        return actor.createTemporaryFocus(item);
      }
      // Ctrl/⌘+clique faz Exert na Trait (shift down voluntário por um sucesso
      // automático), um move de personagem, igual à sheet; exert() roda sua
      // própria checagem de exhausted, confirmação e fluxo de XP.
      if ((event.ctrlKey || event.metaKey) && actor.type === "character") return actor.exert(item);
      if (item.system.exhausted) {
        return void ui.notifications.warn(game.i18n.format("SHIFT.Warnings.TraitExhaustedNamed", { trait: item.name }));
      }
      if (event.shiftKey) return item.roll();
      return game.shift.ShiftRoll.promptActionRoll(actor, { preselect: item.id });
    }
  }
}

function refresh() {
  if (!game.settings.get("shift-vtt", "enableActionHud")) return hide();
  const controlled = canvas?.tokens?.controlled ?? [];
  let actor = controlled.length === 1 ? controlled[0].actor : null;
  // Players "sempre aberto" mantêm a barra visível para seu personagem
  // atribuído, mas APENAS quando nenhum Token está selecionado. Uma multi-seleção
  // ainda oculta a barra em vez de trocar silenciosamente para o personagem atribuído.
  if (!actor && controlled.length === 0 && game.settings.get("shift-vtt", "hudAlwaysOpen")) {
    actor = game.user.character ?? null;
  }
  if (!actor || !actor.isOwner) return hide();
  render(actor);
}

/** Reavalia qual Actor o HUD deve mostrar (usado pelo onChange da configuração). */
export function refreshActionHud() {
  refresh();
}

export function registerActionHud() {
  // O CRUD de Item pode disparar em rajadas (uma roll faz shift num dado, um rest
  // restaura vários): junta tudo numa única reconstrução. O controle de Token /
  // canvas ready ficam imediatos para que selecionar um Token atualize a barra
  // sem lag perceptível.
  const debouncedRefresh = foundry.utils.debounce(refresh, 50);
  const debouncedPosition = foundry.utils.debounce(positionHud, 100);

  Hooks.on("controlToken", () => refresh());
  Hooks.on("canvasReady", () => refresh());
  for (const hook of ["updateItem", "deleteItem", "createItem"]) {
    Hooks.on(hook, item => {
      if (item.actor?.uuid === currentActorUuid) debouncedRefresh();
    });
  }
  // Mudanças no próprio Actor (nome, Scale) ou no Vehicle que o tripula (deploy/
  // recall escrevem system.crew no Vehicle, não no personagem) também precisam
  // repintar a barra. currentActorUuid é null com a HUD oculta, então o includes()
  // é no-op seguro nesse estado.
  Hooks.on("updateActor", a => {
    if (a.uuid === currentActorUuid ||
        (a.type === "vehicle" && (a.system.crew ?? []).includes(currentActorUuid))) {
      debouncedRefresh();
    }
  });
  // Mantém a barra acima da hotbar e inteira na tela quando a janela é
  // redimensionada (o que também pode mudar se a barra inline ainda cabe) ou
  // quando a hotbar re-renderiza (sua largura muda com macros / trocas de página).
  window.addEventListener("resize", () => { debouncedPosition(); debouncedRefresh(); });
  Hooks.on("renderHotbar", () => positionHud());
}
