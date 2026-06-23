/**
 * SHIFT VTT — decoração do Combat Tracker.
 *
 * O tracker é dividido visualmente nas três fases do SHIFT:
 *   Action Phase 1 (Players que passaram na rolagem de ordem de turno)
 *   Adversary Phase (sempre no meio, sem número de iniciativa)
 *   Action Phase 2 (Players que falharam na rolagem de ordem de turno)
 * Characters que ainda não rolaram ficam sob um grupo "Roll Turn Order".
 */

// As keys de fase do tracker (p1/adv/p2) mapeiam para as do CONFIG.SHIFT.phases
// (first/adversary/second), que carregam os números de iniciativa canônicos — a
// fonte de verdade única, compartilhada com o combat document e o roll engine.
const PHASE_META = [
  { key: "advantage", phase: "advantage", icon: "fa-bolt", label: "SHIFT.Combat.AdvantagePhase" },
  { key: "p1", phase: "first", icon: "fa-angles-up", label: "SHIFT.Combat.Phase1" },
  { key: "adv", phase: "adversary", icon: "fa-shield-halved", label: "SHIFT.Combat.PhaseAdversary" },
  { key: "p2", phase: "second", icon: "fa-angles-down", label: "SHIFT.Combat.Phase2" },
  { key: "unrolled", phase: null, icon: "fa-dice", label: "SHIFT.Combat.PhaseUnrolled" }
];

// Construído lazy: CONFIG.SHIFT.phases só é populado no init, depois deste módulo carregar.
function phases() {
  const cfg = CONFIG.SHIFT?.phases ?? {};
  return PHASE_META.map(p => ({ ...p, init: p.phase ? (cfg[p.phase] ?? null) : null }));
}

function phaseFor(combatant) {
  const init = combatant?.initiative;
  const all = phases();
  return all.find(p => p.init === init) ?? all[all.length - 1];
}

// Tomar o spotlight seleciona o token do combatant no canvas de quem clicou —
// operação puramente local (cada cliente tem sua própria seleção). `combatant.token.object`
// só existe se o token estiver na cena ativa, então combate em outra cena é ignorado
// naturalmente. O control() do core já gateia por permissão; players sem posse não
// selecionam nada, GM seleciona qualquer um.
//
// control() retorna false (sem erro) se a camada de Tokens não for a ativa — comum quando
// o GM está em outra ferramenta (Walls/Tiles/Lighting/...). Por isso ativamos a camada
// antes, como acontece ao clicar um token diretamente; senão a seleção falharia em silêncio.
//
// Se o token controlado estiver fora da viewport, damos um pan suave até ele para que
// "selecionar" sempre faça algo visível. Só fora da tela — nunca incondicional — para não
// arrancar o enquadramento que o GM posicionou de propósito a cada spotlight tomado.
function selectCombatantToken(combatant) {
  const token = combatant?.token?.object;
  if (!token || !canvas.ready) return;
  if (!(game.user.isGM || token.isOwner)) return;
  if (!token.layer?.active) canvas.tokens?.activate();
  let controlled = false;
  try { controlled = token.control({ releaseOthers: true }); } catch (_err) { /* sem ação */ }
  if (controlled && isOffScreen(token.center)) canvas.animatePan(token.center);
}

// Verdadeiro se um ponto em coordenadas de mundo cai fora da viewport visível. Projetamos
// pelo worldTransform do stage para pixels de tela e comparamos contra o renderer. Em caso
// de dúvida (sem transform/renderer) assumimos visível, para nunca dar um pan indevido.
function isOffScreen(point) {
  const t = canvas.stage?.worldTransform;
  const screen = canvas.app?.renderer?.screen;
  if (!t || !screen) return false;
  const p = t.apply(point);
  return p.x < 0 || p.y < 0 || p.x > screen.width || p.y > screen.height;
}

function decorate(app, html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  const combat = app.viewed ?? game.combats?.viewed ?? null;

  root.querySelectorAll(".shift-phase-header").forEach(n => n.remove());
  const rows = root.querySelectorAll("li.combatant");
  if (!combat || !rows.length) return;

  let lastKey = null;
  for (const li of rows) {
    const combatant = combat.combatants.get(li.dataset.combatantId);
    const phase = phaseFor(combatant);

    if (phase.key !== lastKey) {
      const header = document.createElement("li");
      header.className = `shift-phase-header phase-${phase.key}`;
      header.innerHTML = `<i class="fa-solid ${phase.icon}"></i><span>${game.i18n.localize(phase.label)}</span>`;
      li.before(header);
      lastKey = phase.key;
    }
    li.classList.add(`shift-phase-${phase.key}`);

    // Números nunca aparecem: limpa da caixa de iniciativa tudo que não
    // é nosso, mantendo o controle de rolagem do core só enquanto unrolled.
    const initBox = li.querySelector(".token-initiative");
    if (initBox && combatant) {
      const isCharacter = combatant.actor?.type === "character";
      const unrolled = combatant.initiative === null || combatant.initiative === undefined;
      for (const node of [...initBox.childNodes]) {
        const el = node.nodeType === Node.ELEMENT_NODE ? node : null;
        if (el?.classList?.contains("shift-spotlight")) continue;
        if (isCharacter && unrolled && el && (el.matches("a, button") || el.querySelector?.("a, button"))) continue;
        node.remove();
      }
    }

    // Pips de recurso de Action + barra de Overcome do Adversary.
    const nameBox = li.querySelector(".token-name") ?? li;
    li.querySelectorAll(".shift-combat-extra").forEach(n => n.remove());
    const actor = combatant?.actor;
    if (actor) {
      const max = combatant.actionsMax ?? 1;
      const left = Math.min(combatant.actionsLeft ?? max, max);
      const pips = Array.fromRange(max)
        .map(i => `<i class="fa-solid fa-bolt pip${i < left ? " on" : ""}"></i>`)
        .join("");
      let overcome = "";
      if (actor.type === "adversary") {
        const d = actor.system.defeat ?? { value: 0, max: 1 };
        const pct = Math.min(100, Math.round((d.value / Math.max(1, d.max)) * 100));
        overcome = `<span class="shift-overcome${actor.system.overcome ? " done" : ""}"
            data-tooltip="${game.i18n.localize("SHIFT.Adversary.Defeat")}: ${d.value}/${d.max}">
            <span class="bar"><span class="fill" style="width:${pct}%"></span></span>
            <span class="num">${d.value}/${d.max}</span>
          </span>`;
      }
      nameBox.insertAdjacentHTML(
        "beforeend",
        `<span class="shift-combat-extra" data-tooltip="${game.i18n.localize("SHIFT.Combat.ActionsLeft")}">${pips}${overcome}</span>`
      );

      // O controle da caixa de iniciativa é único: enquanto o character não
      // rolou a ordem de turno, é o dado; depois de rolar, vira o spotlight.
      // Nunca os dois empilhados.
      const unrolledChar = actor.type === "character"
        && (combatant.initiative === null || combatant.initiative === undefined);
      const rollBtn = li.querySelector(".token-initiative [data-action='rollInitiative']");
      if (unrolledChar) {
        // Troca o grande SVG de d20 do core por um fa-icon limpo, mantendo o
        // data-action="rollInitiative" (o clique do core ainda rola a ordem).
        if (rollBtn) {
          rollBtn.classList.add("shift-init-roll");
          if (!rollBtn.querySelector("i")) rollBtn.innerHTML = `<i class="fa-solid fa-dice-d20"></i>`;
        }
      } else if ((combatant.isOwner || game.user.isGM) && !li.querySelector(".shift-spotlight")) {
        // Spotlight: o owner clica para assumir o turno dentro da sua fase.
        const initBox2 = li.querySelector(".token-initiative") ?? li;
        initBox2.insertAdjacentHTML(
          "beforeend",
          `<a class="shift-spotlight" data-tooltip="${game.i18n.localize("SHIFT.Combat.Spotlight")}"><i class="fa-regular fa-circle-play"></i></a>`
        );
        initBox2.querySelector(".shift-spotlight").addEventListener("click", ev => {
          ev.preventDefault();
          ev.stopPropagation();
          selectCombatantToken(combatant);
          const CombatCls = CONFIG.Combat.documentClass;
          CombatCls.spotlight?.(combat, combatant.id);
        });
      }
    }
  }
}

export function registerTrackerDecorations() {
  Hooks.on("renderCombatTracker", decorate);
  // Mantém as barras de Overcome atualizadas quando Traits de Adversary mudam durante a rodada.
  const refresh = doc => {
    const actor = doc?.actor ?? doc;
    if (actor?.type === "adversary" && game.combats?.some(c => c.combatants.some(cb => cb.actor === actor))) {
      ui.combat?.render();
    }
  };
  // O CRUD de Item de um Adversary em combate pode vir em rajada (vários shifts numa
  // ação, edição em massa); junta tudo num único re-render, como o Action HUD faz.
  const debouncedRefresh = foundry.utils.debounce(refresh, 50);
  Hooks.on("updateItem", debouncedRefresh);
  Hooks.on("deleteItem", debouncedRefresh);
  Hooks.on("createItem", debouncedRefresh);
}
