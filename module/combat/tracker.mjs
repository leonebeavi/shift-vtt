/**
 * SHIFT VTT — decoração do Combat Tracker.
 *
 * O tracker é dividido visualmente nas três fases do SHIFT:
 *   Action Phase 1 (Players que passaram na rolagem de ordem de turno)
 *   Adversary Phase (sempre no meio, sem número de iniciativa)
 *   Action Phase 2 (Players que falharam na rolagem de ordem de turno)
 * Characters que ainda não rolaram ficam sob um grupo "Roll Turn Order".
 */

const PHASES = [
  { key: "advantage", init: 4, icon: "fa-bolt", label: "SHIFT.Combat.AdvantagePhase" },
  { key: "p1", init: 3, icon: "fa-angles-up", label: "SHIFT.Combat.Phase1" },
  { key: "adv", init: 2, icon: "fa-shield-halved", label: "SHIFT.Combat.PhaseAdversary" },
  { key: "p2", init: 1, icon: "fa-angles-down", label: "SHIFT.Combat.Phase2" },
  { key: "unrolled", init: null, icon: "fa-dice", label: "SHIFT.Combat.PhaseUnrolled" }
];

function phaseFor(combatant) {
  const init = combatant?.initiative;
  return PHASES.find(p => p.init === init) ?? PHASES[4];
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

      // Spotlight: o owner clica para assumir o turno dentro da sua fase.
      if ((combatant.isOwner || game.user.isGM) && !li.querySelector(".shift-spotlight")) {
        const initBox2 = li.querySelector(".token-initiative") ?? li;
        initBox2.insertAdjacentHTML(
          "beforeend",
          `<a class="shift-spotlight" data-tooltip="${game.i18n.localize("SHIFT.Combat.Spotlight")}"><i class="fa-regular fa-circle-play"></i></a>`
        );
        initBox2.querySelector(".shift-spotlight").addEventListener("click", ev => {
          ev.preventDefault();
          ev.stopPropagation();
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
