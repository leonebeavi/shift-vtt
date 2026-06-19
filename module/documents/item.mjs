/**
 * SHIFT VTT, documento de Item.
 * Concentra todas as transições de estado do Shift Die para que cada chamador
 * (sheets, rolls, botões de chat, macros) compartilhe uma única implementação.
 */
import { DIE_PROGRESSION, dieIndex, dieLabel, fvtt, enrich, promptText, promptTraitChoice, shiftSpeaker } from "../helpers/utils.mjs";
import { computeShift } from "../dice/resolution.mjs";

export class ShiftItem extends Item {

  /** Padrões por categoria para Keywords/Drawbacks (ajustáveis na sheet):
   *  Focus K+D; Core só D; Pack/Cargo nenhum; Attitude só K;
   *  Focus/Adversary Traits pertencentes a um Adversary só D. */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    // Ícone padrão por tipo, aplicado só quando o criador deixou o ícone
    // genérico de saco/vazio (uma imagem escolhida explicitamente é preservada).
    const icon = CONFIG.SHIFT.defaultIcons?.[this.type];
    const generic = !data.img || data.img === "icons/svg/item-bag.svg";
    if (icon && generic) this.updateSource({ img: icon });

    if (this.type !== "trait") return;

    // Party Traits funcionam como status (igual aos Traits de Location): NÃO
    // fazem auto-shift down nos próprios rolls; servem mais como status de
    // grupo do que para rolar. Aplica a menos que o criador defina explicitamente.
    if (this.system.category === "party" && !foundry.utils.hasProperty(data, "system.autoShiftOnRoll")) {
      this.updateSource({ "system.autoShiftOnRoll": false });
    }

    if (foundry.utils.hasProperty(data, "system.features")) return;
    const category = this.system.category;
    const onAdversary = ["adversary", "location"].includes(this.parent?.type);
    const map = {
      core: { usesKeywords: false, usesDrawbacks: true },
      focus: onAdversary
        ? { usesKeywords: false, usesDrawbacks: true }
        : { usesKeywords: true, usesDrawbacks: true },
      adversary: { usesKeywords: false, usesDrawbacks: true },
      attitude: { usesKeywords: true, usesDrawbacks: false },
      pack: { usesKeywords: false, usesDrawbacks: false },
      cargo: { usesKeywords: false, usesDrawbacks: false },
      special: { usesKeywords: false, usesDrawbacks: false },
      party: { usesKeywords: true, usesDrawbacks: true },
      quest: { usesKeywords: false, usesDrawbacks: false }
    };
    const features = map[category];
    if (features) this.updateSource({ "system.features": features });
  }

  /** Mantém os gatilhos de recarga da Technique consistentes a caminho do banco
   *  de dados, qualquer que seja a forma do update (o objeto `recharges` inteiro
   *  vindo do toggle da sheet, ou um único flag pontilhado): At Will é exclusivo,
   *  e "On any Rest" sempre mantém "On Safe Rest" aceso junto. */
  async _preUpdate(changed, options, user) {
    const allowed = await super._preUpdate(changed, options, user);
    if (allowed === false) return false;
    if (this.type === "technique") {
      const keys = ["session", "safeRest", "unsafeRest", "atWill"];
      const obj = foundry.utils.getProperty(changed, "system.recharges");
      const cur = this.system.recharges ?? {};
      const merged = Object.fromEntries(keys.map(k => [k, !!cur[k]]));
      let touched = false;
      if (obj && typeof obj === "object") {
        for (const k of keys) merged[k] = !!obj[k];
        touched = true;
      } else {
        for (const k of keys) {
          const v = foundry.utils.getProperty(changed, `system.recharges.${k}`);
          if (v !== undefined) { merged[k] = !!v; touched = true; }
        }
      }
      if (touched) {
        if (merged.atWill) { merged.session = false; merged.safeRest = false; merged.unsafeRest = false; }
        else if (merged.unsafeRest) merged.safeRest = true;
        foundry.utils.setProperty(changed, "system.recharges", merged);
        // Ao sair do At Will (estava ligado, agora desligado) sem nenhum limite
        // utilizável: restaura um padrão limitado sensato para o contador não
        // ficar num confuso 0/0. Respeita um uses.* explícito já presente no
        // mesmo update.
        if (!merged.atWill && this.system.recharges?.atWill) {
          const incomingMax = foundry.utils.getProperty(changed, "system.uses.max");
          const effMax = incomingMax !== undefined ? incomingMax : (this.system.uses?.max ?? 0);
          if (effMax < 1) {
            foundry.utils.setProperty(changed, "system.uses.max", 1);
            if (foundry.utils.getProperty(changed, "system.uses.value") === undefined) {
              foundry.utils.setProperty(changed, "system.uses.value", 1);
            }
          }
        }
      }
    }
    // Mantém o nome durável do vínculo de Focus do Scaled Up em sincronia com o id escolhido.
    if (this.type === "technique") {
      const newFocusId = foundry.utils.getProperty(changed, "system.focus.traitId");
      if (newFocusId !== undefined && this.actor) {
        const t = newFocusId ? this.actor.items.get(newFocusId) : null;
        foundry.utils.setProperty(changed, "system.focus.traitName", t?.name ?? "");
      }
    }
  }

  /** Vincula uma Scaled Up Technique a um dos Focus Traits do novo dono no
   *  momento em que ela chega numa sheet de personagem (drop ou create).
   *  Pergunta só ao Player que a adicionou, e só quando o vínculo ainda não
   *  pode ser resolvido. */
  async _onCreate(data, options, userId) {
    await super._onCreate(data, options, userId);
    if (userId !== game.user.id) return;
    if (!this.isScaledUp || !this.actor) return;

    const bound = this.focusTrait;
    if (bound) {
      // Uma cópia de compêndio/arrastada pode resolver só por nome; estabiliza o id.
      if (this.system.focus?.traitId !== bound.id) {
        await this.update({ "system.focus.traitId": bound.id, "system.focus.traitName": bound.name });
      }
      return;
    }

    const focuses = this.actor.getTraits?.("focus") ?? [];
    if (!focuses.length) return; // nada para vincular ainda; vincula depois na sheet
    const id = await promptTraitChoice({
      title: game.i18n.format("SHIFT.Scale.BindFocusTitle", { technique: this.name }),
      hint: game.i18n.localize("SHIFT.Scale.BindFocusHint"),
      options: focuses.map(t => ({
        value: t.id,
        name: t.name,
        img: CONFIG.SHIFT.diceImages[t.statusKey],
        sub: dieLabel(t.system.currentDie)
      }))
    });
    const focus = id ? this.actor.items.get(id) : null;
    if (focus) await this.update({ "system.focus.traitId": focus.id, "system.focus.traitName": focus.name });
  }

  /* ---------------------------------------------------------------- */
  /* Getters de conveniência                                           */
  /* ---------------------------------------------------------------- */

  get isTrait() { return this.type === "trait"; }
  get isTechnique() { return this.type === "technique"; }
  get isQuest() { return this.type === "quest"; }
  get isDescriptor() { return this.type === "keyword" || this.type === "drawback"; }

  /** Carrega um Shift Die como clock: Traits E Quests. O motor de shift/exhaust
   *  abaixo é compartilhado por ambos via este predicado. */
  get hasClock() { return this.isTrait || this.isQuest; }

  /** "d4".."d12" ou "exhausted". */
  get statusKey() {
    if (!this.hasClock) return null;
    return this.system.exhausted ? "exhausted" : this.system.currentDie;
  }

  get faces() {
    return CONFIG.SHIFT.diceFaces[this.system?.currentDie] ?? null;
  }

  get canShiftDown() {
    return this.hasClock && !this.system.exhausted && !this.isResolved && !this.isLocked;
  }

  get canShiftUp() {
    if (!this.hasClock || this.isResolved || this.isLocked) return false;
    if (this.system.exhausted) return true;
    return dieIndex(this.system.currentDie) > dieIndex(this.system.maxDie);
  }

  get isAtMax() {
    return this.hasClock && !this.system.exhausted && this.system.currentDie === this.system.maxDie;
  }

  /**
   * Scale efetivo deste Trait para um Action Roll. O Scale custom do próprio
   * Trait sobrepõe o do dono, nas DUAS direções: um Focus forçado a Scale 1 num
   * personagem de Scale 2 resolve em Scale 1, e um Trait de "magia descontrolada"
   * forçado a Scale 2 num mago de Scale 1 resolve em Scale 2.
   * Items que não são Trait não têm Scale próprio e reportam 1.
   */
  get effectiveScale() {
    if (!this.isTrait) return 1;
    if (this.system.scale?.custom) return this.system.scale.value ?? 1;
    return this.actor?.system?.scale ?? 1;
  }

  /** Se este Trait carrega um Scale diferente do dono: um override custom
   *  explícito (maior OU menor) ou um Scale herdado (por exemplo, o Trait de um
   *  Vehicle tripulado). O único predicado por trás de cada marcador de Scale
   *  (roll dialog, roll card, pip do HUD, trait card, trait sheet). */
  get scaleIsOverride() {
    if (!this.isTrait) return false;
    return !!this.system.scale?.custom || this.effectiveScale !== (this.actor?.system?.scale ?? 1);
  }

  get canRoll() {
    return this.hasClock && this.system.rollable && !this.system.exhausted && !this.isResolved && !this.isLocked;
  }

  /* ---------------------------------------------------------------- */
  /* Quest (desfecho + links)                                          */
  /* ---------------------------------------------------------------- */

  /** Desfecho de uma Quest: "none" (em aberto), "success" ou "failure".
   *  Só itens do tipo "quest" usam isto; os demais reportam "none". */
  get questOutcome() {
    return this.isQuest ? (this.system.outcome ?? "none") : "none";
  }

  /** Uma Quest já resolvida (success/failure) — independente do Exhausted. */
  get isResolved() {
    return this.isQuest && this.questOutcome !== "none";
  }

  /** Uma Quest BLOQUEADA: tem pré-requisitos (system.requires) que ainda não
   *  CONCLUÍRAM (não resolvidos). Enquanto bloqueada não rola/avança/resolve —
   *  "só abre quando X concluir". Pré-requisito apagado não bloqueia. */
  get isLocked() {
    if (!this.isQuest || !this.actor) return false;
    return (this.system.requires ?? []).some(id => {
      const q = this.actor.items.get(id);
      return q?.type === "quest" && !q.isResolved;
    });
  }

  /** Os pré-requisitos pendentes (Quests não resolvidas) desta Quest. */
  get pendingRequirements() {
    if (!this.isQuest || !this.actor) return [];
    return (this.system.requires ?? [])
      .map(id => this.actor.items.get(id))
      .filter(q => q?.type === "quest" && !q.isResolved);
  }

  /** As Quests-filhas desta (mesmo Actor, system.parentId === este id). */
  get childQuests() {
    if (!this.isQuest || !this.actor) return [];
    return this.actor.items.filter(i => i.type === "quest" && i.system.parentId === this.id);
  }

  /* ---------------------------------------------------------------- */
  /* Scaled Up Technique (opcional)                                   */
  /* ---------------------------------------------------------------- */

  /** Uma Technique vinculada a um Focus Trait: depois de rolar esse Trait, faz
   *  shift down num Core para tratar o Focus como um Scale mais alto (padrão Scale 2). */
  get isScaledUp() {
    return this.isTechnique && this.system.techniqueType === "scaledUp";
  }

  /** O Focus Trait ao qual esta Scaled Up Technique está vinculada (pelo id
   *  embutido estável, caindo para o nome para uma cópia de compêndio ainda resolver). */
  get focusTrait() {
    if (!this.isScaledUp || !this.actor) return null;
    const byId = this.system.focus?.traitId && this.actor.items.get(this.system.focus.traitId);
    if (byId?.isTrait) return byId;
    const nm = (this.system.focus?.traitName || "").toLowerCase();
    return nm ? (this.actor.traits.find(t => t.name.toLowerCase() === nm) ?? null) : null;
  }

  /** Uso ilimitado: não precisa de recarga, o contador `uses` é ignorado. */
  get isAtWill() { return !!this.system.recharges?.atWill; }

  /** Uma Technique At Will (ou legada com Max Uses 0) é sempre utilizável;
   *  caso contrário, precisa de um uso restante. */
  get hasUse() {
    if (this.isAtWill) return true;
    const max = this.system.uses?.max ?? 0;
    return max <= 0 || (this.system.uses?.value ?? 0) > 0;
  }

  /** Gasta um uso (no-op para Techniques At Will / ilimitadas). */
  async spendUse() {
    if (!this.isTechnique || this.isAtWill) return;
    if ((this.system.uses?.max ?? 0) > 0) {
      await this.update({ "system.uses.value": Math.max(0, (this.system.uses.value ?? 0) - 1) });
    }
  }

  /** Elegível para ser restaurado por um Unsafe Rest: um Trait que não seja Pack,
   *  Cargo, Special ou Temporário, e que esteja atualmente abaixo do seu Max Die
   *  (ou Exhausted). */
  get needsRestore() {
    if (!this.isTrait) return false;
    if (["pack", "cargo", "special"].includes(this.system.category)) return false;
    if (this.system.temporary) return false;
    return this.system.exhausted || this.system.currentDie !== this.system.maxDie;
  }

  /* ---------------------------------------------------------------- */
  /* Transições do Shift Die                                           */
  /* ---------------------------------------------------------------- */

  /**
   * Piora o die deste Trait em um ou mais passos.
   * d4 → d6 → d8 → d10 → d12 → Exhausted.
   * @param {object} [opts]
   * @param {number}  [opts.steps=1]
   * @param {boolean} [opts.promptDeath=true] Oferece a escolha de exaustão de Core Trait.
   * @param {boolean} [opts.force=false] Pula o gate de irmãos "deve ser Exhausted primeiro" (o shift já comprometido pelo roll engine resolveu o alvo).
   * @returns {Promise<{changed:boolean, from:string, to:string, becameExhausted:boolean}>}
   */
  async shiftDown({ steps = 1, promptDeath = true, force = false } = {}) {
    if (!this.hasClock) return { changed: false };
    const from = this.statusKey;
    if (this.system.exhausted) return { changed: false, from, to: from, becameExhausted: false };

    // Gate estilo Heavily Armored: enquanto um Trait irmão marcado como
    // "deve ser Exhausted primeiro" ainda estiver de pé, os outros Traits não podem fazer shift down.
    // (Só vale entre Traits; Quests não participam desse gate de Encounter.)
    if (!force && this.isTrait && this.actor && !this.system.defeat?.mustBeExhaustedFirst) {
      const blockers = this.actor.items.filter(i =>
        i.type === "trait" && i.id !== this.id
        && i.system.defeat?.mustBeExhaustedFirst && !i.system.exhausted);
      if (blockers.length) {
        ui.notifications.warn(game.i18n.format("SHIFT.Warnings.BlockedBy", {
          traits: blockers.map(b => b.name).join(", ")
        }));
        return { changed: false, from, to: from, becameExhausted: false, blocked: true };
      }
    }

    const { die: nextDie, exhausted } = computeShift(this.system.currentDie, { steps });

    const update = { "system.currentDie": nextDie };
    if (exhausted) update["system.exhausted"] = true;
    await this.update(update);

    const to = this.statusKey;
    if (exhausted) await this.#onBecameExhausted({ promptDeath });
    return { changed: from !== to, from, to, becameExhausted: exhausted };
  }

  /** Desfecho comum de um Trait que atinge Exhausted. */
  async #onBecameExhausted({ promptDeath = true } = {}) {
    Hooks.callAll("shiftRpg.traitExhausted", this.actor, this);

    // Quests não têm temporary, Morte de Core, nem Overcome — só Traits seguem abaixo.
    if (!this.isTrait) return;

    // Traits temporários se consomem por completo assim que ficam Exhausted.
    if (this.system.temporary) {
      const actor = this.actor;
      const name = this.name;
      await this.delete();
      if (actor) {
        await ChatMessage.create({
          speaker: shiftSpeaker(actor),
          content: `<div class="shift-vtt chat-card info-card warn"><p>${game.i18n.format("SHIFT.Temporary.Expired", {
            name: foundry.utils.escapeHTML(name)
          })}</p></div>`
        });
      }
      await ShiftItem.#syncOvercome(actor);
      return;
    }

    const wantsPrompt = promptDeath
      && this.system.category === "core"
      && this.actor?.type === "character"
      && game.settings.get("shift-vtt", "promptCoreExhausted");
    if (wantsPrompt) await this.promptCoreExhausted();
    await ShiftItem.#syncOvercome(this.actor);
  }

  /** Quando um Adversary fica Overcome, marca seus Combatants como derrotados. */
  static async #syncOvercome(actor) {
    if (!actor || actor.type !== "adversary" || !actor.system.overcome) return;
    for (const combat of game.combats ?? []) {
      const matches = combat.combatants.filter(c => c.actor === actor && !c.defeated);
      for (const c of matches) {
        try { await c.update({ defeated: true }); } catch (err) { /* sem permissão */ }
      }
    }
  }

  /**
   * Melhora o die deste Trait em um ou mais passos, nunca além do Max Die.
   * Recuperar de Exhausted para D12 consome um passo.
   */
  async shiftUp({ steps = 1 } = {}) {
    if (!this.hasClock) return { changed: false };
    const from = this.statusKey;
    let exhausted = this.system.exhausted;
    let idx = dieIndex(this.system.currentDie);
    const maxIdx = dieIndex(this.system.maxDie);

    for (let s = 0; s < steps; s++) {
      if (exhausted) { exhausted = false; idx = DIE_PROGRESSION.length - 1; continue; }
      if (idx > maxIdx) idx -= 1;
    }

    const update = { "system.currentDie": DIE_PROGRESSION[idx], "system.exhausted": exhausted };
    await this.update(update);
    return { changed: from !== this.statusKey, from, to: this.statusKey };
  }

  /** Exaure este Trait de imediato. */
  async exhaust({ promptDeath = true, force = false } = {}) {
    if (!this.hasClock || this.system.exhausted) return { changed: false };
    const from = this.statusKey;

    // Gate Heavily Armored: enquanto um Trait irmão marcado como "deve ser
    // Exhausted primeiro" ainda estiver de pé, os outros Traits não podem ser Exhausted (espelha shiftDown).
    if (!force && this.isTrait && this.actor && !this.system.defeat?.mustBeExhaustedFirst) {
      const blockers = this.actor.items.filter(i =>
        i.type === "trait" && i.id !== this.id
        && i.system.defeat?.mustBeExhaustedFirst && !i.system.exhausted);
      if (blockers.length) {
        ui.notifications.warn(game.i18n.format("SHIFT.Warnings.BlockedBy", {
          traits: blockers.map(b => b.name).join(", ")
        }));
        return { changed: false, from, to: from, becameExhausted: false, blocked: true };
      }
    }

    await this.update({ "system.exhausted": true, "system.currentDie": "d12" });
    await this.#onBecameExhausted({ promptDeath });
    return { changed: true, from, to: "exhausted", becameExhausted: true };
  }

  /** Restaura este Trait ao seu Max Die (limpa Exhausted). */
  async restore() {
    if (!this.hasClock) return { changed: false };
    const from = this.statusKey;
    await this.update({ "system.currentDie": this.system.maxDie, "system.exhausted": false });
    return { changed: from !== this.statusKey, from, to: this.statusKey };
  }

  /* ---------------------------------------------------------------- */
  /* Keywords & Drawbacks                                              */
  /* ---------------------------------------------------------------- */

  async addKeyword(text) {
    if (!this.isTrait || !text) return;
    const list = [...(this.system.keywords ?? [])];
    if (list.includes(text)) return;
    list.push(text);
    await this.update({ "system.keywords": list });
    await this.#ensureDescriptor("keyword", text);
  }

  /** As pills são respaldadas por Items reais de Keyword/Drawback para que
   *  possam exibir uma descrição ao passar o mouse e ser abertas para edição. */
  async #ensureDescriptor(kind, text) {
    const match = i => i.type === kind && i.name.toLowerCase() === String(text).toLowerCase();
    if (this.actor) {
      if (this.actor.items.find(match)) return;
      try {
        await this.actor.createEmbeddedDocuments("Item", [{ name: text, type: kind }]);
      } catch (err) { /* sem permissão */ }
      return;
    }
    if (game.items.find(match)) return;
    try {
      await Item.implementation.create({ name: text, type: kind });
    } catch (err) { /* Players podem não ter permissão para criar Items de mundo */ }
  }

  async removeKeyword(index) {
    if (!this.isTrait) return;
    const list = [...(this.system.keywords ?? [])];
    list.splice(index, 1);
    await this.update({ "system.keywords": list });
  }

  async addDrawback(text) {
    if (!this.isTrait || !text) return;
    const list = [...(this.system.drawbacks ?? [])];
    if (list.includes(text)) return;
    list.push(text);
    await this.update({ "system.drawbacks": list });
    await this.#ensureDescriptor("drawback", text);
  }

  async removeDrawback(index) {
    if (!this.isTrait) return;
    const list = [...(this.system.drawbacks ?? [])];
    list.splice(index, 1);
    await this.update({ "system.drawbacks": list });
  }

  /* ---------------------------------------------------------------- */
  /* Techniques                                                        */
  /* ---------------------------------------------------------------- */

  /** Gasta um uso de uma Technique e a publica no chat.
   *  Uma Technique com Max Uses 0 é tratada como ilimitada / at-will: sem gate,
   *  sem decremento. */
  async use() {
    if (!this.isTechnique) return;

    // Uma Scaled Up Technique não faz sentido sem um Action Roll ativo: ela é
    // aplicada pelo botão "Scale Up" num roll card, não usada por conta própria.
    if (this.isScaledUp) {
      await ChatMessage.create({
        speaker: shiftSpeaker(this.actor),
        content: `<div class="shift-vtt chat-card info-card"><p><i class="fa-solid fa-up-right-and-down-left-from-center"></i> ${game.i18n.format("SHIFT.Scale.ScaledUpUseHint", {
          trait: foundry.utils.escapeHTML(this.focusTrait?.name ?? this.system.focus?.traitName ?? "—")
        })}</p></div>`
      });
      return;
    }

    const limited = !this.isAtWill && (this.system.uses?.max ?? 0) > 0;
    if (!this.hasUse) {
      ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NoUsesLeft"));
      return;
    }
    if (limited) await this.spendUse();

    const description = await enrich(this.system.description, {
      rollData: this.actor?.getRollData?.() ?? {},
      relativeTo: this
    });
    const typeLabel = game.i18n.localize(CONFIG.SHIFT.techniqueTypes[this.system.techniqueType] ?? "");
    const content = `
      <div class="shift-vtt chat-card technique-card">
        <header class="card-header">
          <img src="${this.img}" alt="${foundry.utils.escapeHTML(this.name)}"/>
          <div class="card-title">
            <h3>${foundry.utils.escapeHTML(this.name)}</h3>
            <span class="subtitle">${typeLabel}${this.isAtWill
              ? ` · <i class="fa-solid fa-infinity"></i> ${game.i18n.localize("SHIFT.Recharge.atWill")}`
              : limited ? ` · ${game.i18n.format("SHIFT.Technique.UsesLeft", { value: this.system.uses.value, max: this.system.uses.max })}` : ""}</span>
          </div>
        </header>
        <div class="card-body">${description || ""}</div>
      </div>`;
    await ChatMessage.create({
      speaker: shiftSpeaker(this.actor),
      content
    });
  }

  async resetUses() {
    if (!this.isTechnique || this.isAtWill) return;
    await this.update({ "system.uses.value": this.system.uses.max });
  }

  /* ---------------------------------------------------------------- */
  /* Rolagem                                                           */
  /* ---------------------------------------------------------------- */

  /** Action Roll rápido de um único Trait ou Quest (ambos têm clock). */
  async roll(options = {}) {
    if (!this.hasClock) return null;
    const { ShiftRoll } = game.shift;
    return ShiftRoll.actionRoll({ actor: this.actor, traits: [this], ...options });
  }

  /* ---------------------------------------------------------------- */
  /* Exaustão de Core Trait: Drawback ou Morte Heroica                 */
  /* ---------------------------------------------------------------- */

  async promptCoreExhausted() {
    const actor = this.actor;
    if (!actor) return;
    const content = `<p>${game.i18n.format("SHIFT.Death.Prompt", {
      actor: foundry.utils.escapeHTML(actor.name),
      trait: foundry.utils.escapeHTML(this.name)
    })}</p>`;

    let choice = null;
    try {
      choice = await fvtt.DialogV2.wait({
        window: { title: game.i18n.localize("SHIFT.Death.Title") },
        content,
        rejectClose: false,
        buttons: [
          { action: "drawback", label: game.i18n.localize("SHIFT.Death.Drawback"), icon: "fa-solid fa-bandage", default: true },
          { action: "death", label: game.i18n.localize("SHIFT.Death.Heroic"), icon: "fa-solid fa-skull" },
          { action: "later", label: game.i18n.localize("SHIFT.Death.Later"), icon: "fa-solid fa-clock" }
        ]
      });
    } catch (err) { choice = null; }

    if (choice === "drawback") {
      const text = await promptText({
        title: game.i18n.localize("SHIFT.Death.DrawbackTitle"),
        label: game.i18n.localize("SHIFT.Death.DrawbackLabel"),
        initial: game.i18n.localize("SHIFT.Death.DrawbackDefault")
      });
      const drawbacks = [...(this.system.drawbacks ?? [])];
      if (text) drawbacks.push(text);
      await this.update({
        "system.exhausted": false,
        "system.currentDie": "d12",
        "system.drawbacks": drawbacks
      });
      await ChatMessage.create({
        speaker: shiftSpeaker(actor),
        content: `<div class="shift-vtt chat-card info-card warn"><p>${game.i18n.format("SHIFT.Death.DrawbackChat", {
          actor: foundry.utils.escapeHTML(actor.name),
          trait: foundry.utils.escapeHTML(this.name),
          drawback: foundry.utils.escapeHTML(text ?? "—")
        })}</p></div>`
      });
    } else if (choice === "death") {
      await ChatMessage.create({
        speaker: shiftSpeaker(actor),
        content: `<div class="shift-vtt chat-card info-card death"><h3><i class="fa-solid fa-skull"></i> ${game.i18n.localize("SHIFT.Death.HeroicTitle")}</h3><p>${game.i18n.format("SHIFT.Death.HeroicChat", {
          actor: foundry.utils.escapeHTML(actor.name)
        })}</p></div>`
      });
    }
  }
}
