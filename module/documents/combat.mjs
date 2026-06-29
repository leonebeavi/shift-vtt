/**
 * SHIFT VTT — Encounters (Combat).
 *
 * SHIFT não usa iniciativa numérica. A cada round:
 *   1. Cada Player escolhe um Core Trait e faz um Action Roll usando só
 *      aquele dado. Sucesso → primeira fase de ação (antes dos Adversaries).
 *      Falha → segunda fase de ação (depois dos Adversaries).
 *   2. Os Adversaries sempre agem na fase do meio, fazendo um número de
 *      Action Rolls igual ao seu Power (mais Special Traits de grupo).
 *
 * Implementação: initiative 3 = primeira fase, 2 = fase dos Adversaries,
 * 1 = segunda fase. A ordem de turno é re-rolada no início de cada round
 * (configurável). As rolagens de ordem de turno seguem todas as regras
 * normais de Action Roll: podem dar crítico e podem fazer ShiftDown.
 */
import { dieIndex, fvtt } from "../helpers/utils.mjs";
import { emitOrRun } from "../helpers/socket.mjs";

/* ------------------------------------------------------------------ */
/* Combatant                                                           */
/* ------------------------------------------------------------------ */

export class ShiftCombatant extends Combatant {
  /** Action Rolls que este Combatant ainda pode fazer no round atual. */
  get actionsLeft() {
    return this.getFlag("shift-vtt", "actionsLeft") ?? this.actionsMax;
  }

  get actionsMax() {
    const a = this.actor;
    if (!a) return 1;
    return a.type === "character" ? 1 : (a.system.actions ?? a.system.power ?? 1);
  }

  /** Combatants que não são character entram direto na fase dos Adversaries. */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;
    const update = { "flags.shift-vtt.actionsLeft": null };
    try { update["flags.shift-vtt.actionsLeft"] = this.actionsMax; } catch (err) { /* sem ação */ }
    if (data.initiative === undefined || data.initiative === null) {
      let type = null;
      try { type = this.actor?.type ?? null; } catch (err) { type = null; }
      if (type && type !== "character") update.initiative = CONFIG.SHIFT.phases.adversary;
    }
    this.updateSource(update);
  }
}

/* ------------------------------------------------------------------ */
/* Combat                                                              */
/* ------------------------------------------------------------------ */

export class ShiftCombat extends Combat {

  /** @inheritdoc */
  async rollInitiative(ids, options = {}) {
    ids = typeof ids === "string" ? [ids] : Array.from(ids ?? []);
    const interactive = !options.bulk && ids.length === 1;

    for (const id of ids) {
      const combatant = this.combatants.get(id);
      if (!combatant) continue;
      const actor = combatant.actor;

      // Adversaries, Challenges, Vehicles, etc.: fase do meio, sem rolagem.
      if (!actor || actor.type !== "character") {
        await this.updateEmbeddedDocuments("Combatant", [
          { _id: id, initiative: CONFIG.SHIFT.phases.adversary }
        ]);
        continue;
      }

      if (!actor.isOwner) {
        ui.notifications.warn(game.i18n.format("SHIFT.Combat.NotYourTurnOrder", { name: combatant.name }));
        continue;
      }

      const phase = await this.#rollTurnOrderFor(actor, { interactive });
      if (phase === null) continue; // diálogo cancelado
      await this.updateEmbeddedDocuments("Combatant", [{ _id: id, initiative: phase }]);
    }
    return this;
  }

  /**
   * Faz o Action Roll de ordem de turno para um character.
   * Interativo: o Player escolhe o Core Trait num diálogo.
   * Em lote (Roll All): usa o Core Trait disponível mais forte.
   * @returns {Promise<number|null>} initiative da fase, ou null se cancelado
   */
  async #rollTurnOrderFor(actor, { interactive = true } = {}) {
    const { ShiftRoll } = game.shift;
    const cores = actor.traits.filter(t => t.canRoll && ["core", "attitude"].includes(t.system.category));
    const fallback = actor.traits.filter(t => t.canRoll);

    if (!cores.length && !fallback.length) {
      ui.notifications.warn(game.i18n.format("SHIFT.Combat.AllExhausted", { name: actor.name }));
      return CONFIG.SHIFT.phases.second;
    }

    let result = null;
    if (interactive) {
      result = await ShiftRoll.promptActionRoll(actor, { turnOrder: true });
      if (!result) return null;
    } else {
      const pool = cores.length ? cores : fallback;
      const best = pool.reduce((a, b) =>
        dieIndex(a.system.currentDie) <= dieIndex(b.system.currentDie) ? a : b);
      result = await ShiftRoll.actionRoll({ actor, traits: [best], rollType: "normal", turnOrder: true });
      if (!result) return null;
    }
    return result.phase ?? CONFIG.SHIFT.phases.second;
  }

  /** @inheritdoc */
  async rollAll(options = {}) {
    const ids = this.combatants.filter(c => c.initiative === null || options.force)
      .map(c => c.id);
    return this.rollInitiative(ids, { ...options, bulk: true });
  }

  /** @inheritdoc */
  async rollNPC(options = {}) {
    const ids = this.combatants
      .filter(c => c.initiative === null && c.actor?.type !== "character")
      .map(c => c.id);
    return this.rollInitiative(ids, { ...options, bulk: true });
  }

  /** Rola a ordem de turno dos characters DESTE usuário que ainda não rolaram
   *  (próprios, sem iniciativa). Avisa se não há nada a rolar. Fonte única usada
   *  pelo botão de player da Combat HUD e pelo botão da mensagem de round no chat. */
  async rollOwnTurnOrder() {
    const mine = this.combatants.filter(c =>
      c.actor?.type === "character" && c.isOwner && c.initiative === null);
    if (!mine.length) {
      return void ui.notifications.info(game.i18n.localize("SHIFT.Combat.NothingToRoll"));
    }
    for (const c of mine) await this.rollInitiative([c.id]);
  }

  /** Inicializa os recursos de ação por round de cada Combatant. */
  async resetActionResources() {
    const updates = this.combatants.map(c => ({
      _id: c.id,
      "flags.shift-vtt.actionsLeft": c.actionsMax
    }));
    if (updates.length) await this.updateEmbeddedDocuments("Combatant", updates);
  }

  /** @inheritdoc */
  async startCombat() {
    await super.startCombat();
    await this.resetActionResources();
    if (game.user.isGM) await this.#promptAdvantage();
    // Ninguém entra em cena automaticamente: zera o turno corrente para o spotlight
    // começar VAZIO; o GM escolhe quem age clicando (na Combat HUD ou no tracker).
    try { await this.update({ turn: null }); } catch (err) { /* sem ação */ }
    return this;
  }

  /** Pelas regras: quando um Encounter começa, o GM decide se um dos lados
   *  tem vantagem. Esse lado age primeiro neste round (fase amarela de
   *  Advantage); o round seguinte retoma a ordem de turno normal. */
  async #promptAdvantage() {
    let choice = null;
    try {
      choice = await fvtt.DialogV2.wait({
        window: { title: game.i18n.localize("SHIFT.Combat.AdvantageTitle") },
        position: { width: 340 },
        classes: ["shift-vtt", "shift-dialog"],
        content: `<p class="hint shift-prompt-hint">${game.i18n.localize("SHIFT.Combat.AdvantageHint")}</p>`,
        rejectClose: false,
        buttons: [
          { action: "none", label: game.i18n.localize("SHIFT.Combat.AdvantageNone"), icon: "fa-solid fa-scale-balanced", default: true },
          { action: "players", label: game.i18n.localize("SHIFT.Combat.AdvantagePlayers"), icon: "fa-solid fa-users" },
          { action: "adversaries", label: game.i18n.localize("SHIFT.Combat.AdvantageAdversaries"), icon: "fa-solid fa-shield-halved" }
        ]
      });
    } catch (err) { choice = null; }
    if (!choice || choice === "none" || choice === "cancel") return;

    const updates = [];
    for (const c of this.combatants) {
      const isCharacter = c.actor?.type === "character";
      if (choice === "players") {
        updates.push({ _id: c.id, initiative: isCharacter ? CONFIG.SHIFT.phases.advantage : CONFIG.SHIFT.phases.adversary });
      } else {
        updates.push({ _id: c.id, initiative: isCharacter ? CONFIG.SHIFT.phases.second : CONFIG.SHIFT.phases.advantage });
      }
    }
    if (updates.length) await this.updateEmbeddedDocuments("Combatant", updates);
    await ChatMessage.create({
      content: `<div class="shift-vtt chat-card info-card combat"><h3><i class="fa-solid fa-bolt"></i> ${game.i18n.localize(
        choice === "players" ? "SHIFT.Combat.AdvantagePlayersChat" : "SHIFT.Combat.AdvantageAdversariesChat"
      )}</h3></div>`
    });
  }

  /** Spotlight: coloca um Combatant no turno ativo (estilo Foundryborne). */
  static async spotlight(combat, combatantId) {
    const combatant = combat?.combatants.get(combatantId);
    if (!combatant) return;
    if (!(combatant.isOwner || game.user.isGM)) {
      return void ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NotOwner"));
    }
    await emitOrRun({ action: "spotlight", combatId: combat.id, combatantId });
  }

  /** Re-rola a ordem de turno no início de cada round (pelas regras). */
  async nextRound() {
    await super.nextRound();
    await this.resetActionResources();
    if (game.settings.get("shift-vtt", "rerollTurnOrder")) {
      await this.resetTurnOrder({ announce: true });
    } else {
      // A fase de Advantage (init 4) só vale no primeiro round. Com reroll OFF
      // não há reset, então qualquer colocação de Advantage remanescente
      // persistiria e o lado com vantagem agiria primeiro todo round. Rebaixa
      // essas colocações para a fase normal de primeira ação (Phase 1, init 3),
      // preservando que esses combatants ajam cedo sem repetir a vantagem especial.
      await this.#demoteAdvantage();
      // Sem reroll, resetTurnOrder não roda: zera o turno mesmo assim, para o novo
      // round começar sem ninguém auto-selecionado (seleção sempre manual).
      try { await this.update({ turn: null }); } catch (err) { /* sem ação */ }
    }
    return this;
  }

  /** Converte colocações de Advantage (init 4) na fase normal de primeira ação
   *  (init 3), para a vantagem especial de início de Encounter não se repetir. */
  async #demoteAdvantage() {
    const updates = this.combatants
      .filter(c => c.initiative === CONFIG.SHIFT.phases.advantage)
      .map(c => ({ _id: c.id, initiative: CONFIG.SHIFT.phases.first }));
    if (updates.length) await this.updateEmbeddedDocuments("Combatant", updates);
  }

  /** Limpa as initiatives dos characters para os Players rolarem a ordem de turno do novo round. */
  async resetTurnOrder({ announce = false } = {}) {
    const updates = [];
    for (const c of this.combatants) {
      const type = c.actor?.type;
      if (type === "character") updates.push({ _id: c.id, initiative: null });
      else if (c.initiative !== CONFIG.SHIFT.phases.adversary) {
        updates.push({ _id: c.id, initiative: CONFIG.SHIFT.phases.adversary });
      }
    }
    if (updates.length) await this.updateEmbeddedDocuments("Combatant", updates);
    // Ninguém entra em cena automaticamente: o spotlight começa VAZIO (turn null) e
    // é escolhido manualmente. setupTurns() preserva turn null através das rolagens
    // de iniciativa, então fica vazio até alguém tomar o spotlight de propósito.
    try { await this.update({ turn: null }); } catch (err) { /* sem ação */ }
    if (announce) {
      await ChatMessage.create({
        content: `<div class="shift-vtt chat-card info-card combat">
          <h3><i class="fa-solid fa-flag-checkered"></i> ${game.i18n.format("SHIFT.Combat.NewRound", { round: this.round })}</h3>
          <p>${game.i18n.localize("SHIFT.Combat.RerollHint")}</p>
          <div class="action-row">
            <button type="button" class="card-action" data-shift-turnorder>
              <i class="fa-solid fa-dice-d20"></i> ${game.i18n.localize("SHIFT.Combat.RollFromChat")}
            </button>
          </div>
        </div>`
      });
    }
  }

  /* ---- Ordenação: primeira fase → Adversaries → segunda fase ----------- */

  static #compare(a, b) {
    const num = v => (Number.isFinite(v) ? v : -Infinity);
    const ia = num(a.initiative);
    const ib = num(b.initiative);
    if (ib !== ia) return ib - ia;
    const rank = c => (c.actor?.type === "character" ? 0 : 1);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    return (a.name || "").localeCompare(b.name || "") || (a.id > b.id ? 1 : -1);
  }

  _sortCombatants(a, b) { return ShiftCombat.#compare(a, b); }
}
