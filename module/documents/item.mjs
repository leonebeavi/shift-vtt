/**
 * SHIFT VTT, documento de Item.
 * Concentra todas as transições de estado do Shift Die para que cada chamador
 * (sheets, rolls, botões de chat, macros) compartilhe uma única implementação.
 */
import { DIE_PROGRESSION, dieIndex, dieLabel, fvtt, enrich, promptText, promptTraitChoice, promptChoice, shiftSpeaker } from "../helpers/utils.mjs";
import { computeShift } from "../dice/resolution.mjs";
import { requestCoreDeathPrompt } from "../helpers/socket.mjs";

export class ShiftItem extends Item {

  /** Defaults na criação: ícone padrão por tipo (só se genérico); Quest nova numa Party
   *  entra no topo do seu grupo; Trait solto nasce Focus; Party Trait nasce sem
   *  autoShiftOnRoll; Attitude nasce com Transform habilitado. */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    // Ícone padrão por tipo, aplicado só quando o criador deixou o ícone
    // genérico de saco/vazio (uma imagem escolhida explicitamente é preservada).
    const icon = CONFIG.SHIFT.defaultIcons?.[this.type];
    const generic = !data.img || data.img === "icons/svg/item-bag.svg";
    if (icon && generic) this.updateSource({ img: icon });

    // Quest nova numa Party entra no TOPO do seu grupo: sort ABAIXO do menor sort entre
    // as quests irmãs (mesmo parentId efetivo). Cobre os dois caminhos de criação (botão
    // "Add quest" e arraste do mundo — ambos nascem no topo, parentId ""); reordenar/
    // aninhar usa update e não passa por aqui. No _preCreate de um embedded, this.parent
    // já é a Party.
    if (this.type === "quest" && this.parent?.type === "party") {
      const quests = this.parent.items.filter(i => i.type === "quest");
      const ids = new Set(quests.map(q => q.id));
      const eff = q => (q.system.parentId && ids.has(q.system.parentId)) ? q.system.parentId : "";
      const myParent = eff(this);
      const group = quests.filter(q => eff(q) === myParent);
      const min = group.length ? Math.min(...group.map(q => q.sort ?? 0)) : 0;
      this.updateSource({ sort: min - CONST.SORT_INTEGER_DENSITY });
    }

    if (this.type !== "trait") return;

    // Um Trait criado SOLTO (sem Actor dono: sidebar de Items ou compêndio) nasce
    // como Focus Trait. É o caso típico de montar conteúdo reaproveitável, e a
    // criação do core do Foundry não passa categoria (cairia no default "custom").
    // Só intervém quando o criador NÃO definiu a categoria: um drop de compêndio,
    // um duplicar ou a criação por categoria das fichas já trazem system.category,
    // e essa checagem os preserva.
    if (!this.parent && !foundry.utils.hasProperty(data, "system.category")) {
      this.updateSource({ "system.category": "focus" });
    }

    // Party Traits funcionam como status (igual aos Traits de Location): NÃO
    // fazem auto-shift down nos próprios rolls; servem mais como status de
    // grupo do que para rolar. Aplica a menos que o criador defina explicitamente.
    if (this.system.category === "party" && !foundry.utils.hasProperty(data, "system.autoShiftOnRoll")) {
      this.updateSource({ "system.autoShiftOnRoll": false });
    }

    // Attitude, pelas regras, reseta com uma nova identidade quando exausta → já nasce
    // com Transform habilitado (modo aberto, reset ao próprio Max Die). A menos que o
    // criador especifique transform explicitamente.
    if (this.system.category === "attitude" && !foundry.utils.hasProperty(data, "system.transform")) {
      this.updateSource({
        "system.transform.enabled": true,
        "system.transform.resetDie": this.system.maxDie || "d4"
      });
    }
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
      // Mantém o nome durável do vínculo de Focus do Scaled Up em sincronia com o id escolhido.
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

  /** Quando o GM liga/desliga "visível pros players" num Trait com Transform, sincroniza o
   *  ownership das formas linkadas: ON → OBSERVER (players OWNER conseguem LER a forma pra
   *  transformar), OFF → NONE (formas secretas somem do diretório de Items dos players).
   *  Só o cliente que fez o update age, e só nas formas (Items de mundo) que ele possui. */
  async _onUpdate(changed, options, userId) {
    await super._onUpdate(changed, options, userId);
    if (!this.isTrait) return;
    const pv = foundry.utils.getProperty(changed, "system.transform.playerVisible");
    if (pv === undefined) return;
    // A sincronia de ownership das formas roda no GM ATIVO (que possui todos os Items de
    // mundo), não em quem togglou — assim funciona mesmo se um Trusted Player ligar/desligar
    // playerVisible em formas que ele não possui, sem deixar ownership obsoleto/vazado.
    const activeGM = game.users?.activeGM;
    if (!activeGM || activeGM.id !== game.user.id) return;
    const OWN = CONST.DOCUMENT_OWNERSHIP_LEVELS;
    const level = pv ? OWN.OBSERVER : OWN.NONE;
    for (const uuid of (this.system.transform?.forms ?? [])) {
      const form = await fromUuid(uuid).catch(() => null);
      if (!form || form.parent || form.pack || !form.isOwner) continue; // só Items de mundo que eu possuo
      if ((form.ownership?.default ?? OWN.NONE) === level) continue;
      try { await form.update({ "ownership.default": level }); } catch (err) { /* sem permissão */ }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Getters de conveniência                                           */
  /* ---------------------------------------------------------------- */

  get isTrait() { return this.type === "trait"; }
  get isTechnique() { return this.type === "technique"; }
  get isQuest() { return this.type === "quest"; }
  get isConnection() { return this.type === "connection"; }
  get isDescriptor() { return this.type === "keyword" || this.type === "drawback"; }

  /** Carrega um Shift Die como clock: Traits, Quests E Connections. O motor de
   *  shift/exhaust abaixo é compartilhado pelos três via este predicado. */
  get hasClock() { return this.isTrait || this.isQuest || this.isConnection; }

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

  /** Há uma próxima forma na fila à frente do estágio atual (usado pelo auto-advance). */
  get hasNextForm() {
    const t = this.system.transform ?? {};
    return (t.forms?.length ?? 0) > 0 && (t.stage ?? -1) < (t.forms.length - 1);
  }

  /** O Trait pode transformar (botão ✦): basta o Transform estar ligado. O ✦ PERGUNTA
   *  pra qual forma transformar (ou reseta + renomeia, no caso aberto/Attitude). */
  get canTransform() {
    return this.isTrait && !!this.system.transform?.enabled;
  }

  /** Quem pode VER a aba Transform e TROCAR de forma / reposicionar (✦ + setas): o GM
   *  sempre; um player OWNER do Trait quando o GM ligou `playerVisible`. (Editar a
   *  estrutura — criar/deletar/configurar — é mais restrito: ver `transformEditable`.) */
  get transformVisible() {
    if (!this.isTrait || !this.system.transform?.enabled) return false;
    return game.user.isGM || (!!this.system.transform.playerVisible && this.isOwner);
  }

  /** Quem pode EDITAR a estrutura da fila (toggles, criar/deletar forma, abrir forma pra
   *  editar, dropar Trait): o GM, ou um Trusted Player+ que já enxergue a aba. Players
   *  comuns (owner) só transformam e reposicionam, não mexem na estrutura. */
  get transformEditable() {
    if (!this.isTrait) return false;
    if (game.user.isGM) return true;
    return this.transformVisible && game.user.role >= CONST.USER_ROLES.TRUSTED;
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
  async shiftDown({ steps = 1, promptDeath = true, force = false, transform = true } = {}) {
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
    if (exhausted) await this.#onBecameExhausted({ promptDeath, transform });
    return { changed: from !== to, from, to, becameExhausted: exhausted };
  }

  /** Desfecho comum de um Trait que atinge Exhausted. */
  async #onBecameExhausted({ promptDeath = true, transform = true } = {}) {
    Hooks.callAll("shiftRpg.traitExhausted", this.actor, this);

    // Quests não têm temporary, Morte de Core, nem Overcome — só Traits seguem abaixo.
    if (!this.isTrait) return;

    // Transform on Exhaust AUTOMÁTICO (formas dramáticas): ao exaurir, vira a nova forma
    // in place e limpa exhausted, então não há morte/overcome a tratar. Só quando o Trait
    // está configurado com auto (a Attitude usa o botão manual, pra respeitar a regra de
    // que exaurir no Encounter conta pro overcome e só reseta depois).
    // Transform on Exhaust: o GM decide (roda no cliente que aplicou o exhaust, que pro
    // relay de ataque do player é o GM). Aberto (Attitude): prompt de novo nome (cancelar
    // = fica exausto). Fila + Auto: avança a sequência. Fila SEM Auto: prompt com as
    // formas + não-transformar. Se transformou, não há overcome/morte.
    if (transform && this.system.transform?.enabled && game.user.isGM) {
      const hasForms = (this.system.transform.forms?.length ?? 0) > 0;
      let did = false;
      if (!hasForms) did = await this.promptOpenReset();
      else if (this.system.transform.auto) {
        if (this.hasNextForm) did = !!(await this.transformTo((this.system.transform.stage ?? -1) + 1)).changed;
      } else did = await this.promptFormChoice();
      if (did) return;
    }

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
    if (wantsPrompt) await this.#routeCoreExhaustedPrompt();
    await ShiftItem.#syncOvercome(this.actor);
  }

  /** Quando um Adversary fica Overcome, marca seus Combatants como derrotados e
   *  aplica o overlay de status DEFEATED no token (como o defeat manual da Combat HUD):
   *  o campo Combatant#defeated não pinta o marker no token por si só. */
  static async #syncOvercome(actor) {
    if (!actor || actor.type !== "adversary" || !actor.system.overcome) return;
    const status = CONFIG.specialStatusEffects?.DEFEATED;
    for (const combat of game.combats ?? []) {
      const matches = combat.combatants.filter(c => c.actor === actor && !c.defeated);
      for (const c of matches) {
        try {
          await c.update({ defeated: true });
          if (status) await c.actor?.toggleStatusEffect(status, { active: true, overlay: true });
        } catch (err) { /* sem permissão */ }
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
  /* Transform on Exhaust (reset da Attitude + formas)                */
  /* ---------------------------------------------------------------- */

  /**
   * Entrada do gatilho MANUAL (botão ✦). Transforma o Trait IN PLACE (mesmo item → sem
   * mexer em UUID/contagem/targeting; limpa exhausted → deixa de contar pro overcome). SEM
   * fila (Attitude): pergunta o novo nome e reseta o die. COM fila: PERGUNTA pra qual forma
   * transformar (não segue a sequência). Cancelar não faz nada.
   * @returns {Promise<boolean>} true se transformou
   */
  async transform() {
    if (!this.isTrait || !this.system.transform?.enabled) return false;
    if ((this.system.transform.forms?.length ?? 0) === 0) return this.promptOpenReset();
    return this.promptFormChoice();
  }

  /** Caso ABERTO (Attitude): reseta o die ao resetDie, limpa exhausted e renomeia. */
  async #openReset(name) {
    const fromName = this.name;
    const die = this.system.transform?.resetDie || "d4";
    const update = { "system.exhausted": false, "system.maxDie": die, "system.currentDie": die };
    if (name) update.name = name;
    await this.update(update);
    await this.#announceTransform(fromName);
  }

  /** Pergunta o novo nome do reset aberto. Cancelar (Esc/X) = nada acontece → fica exausto. */
  async promptOpenReset() {
    const name = await promptText({
      title: game.i18n.localize("SHIFT.Transform.Title"),
      label: game.i18n.localize("SHIFT.Transform.NewName"),
      initial: this.name
    });
    if (name === null) return false;
    await this.#openReset(name || null);
    return true;
  }

  /** Pergunta ao GM pra QUAL forma transformar (Base + formas linkadas, menos a atual) e
   *  aplica. Cancelar = não transformar (fica como está / exausto). */
  async promptFormChoice() {
    const t = this.system.transform ?? {};
    const forms = t.forms ?? [];
    const cur = t.stage ?? -1;
    const options = [];
    if (t.base?.captured && cur !== -1) {
      options.push({ value: "-1", label: t.base.name || game.i18n.localize("SHIFT.Transform.BaseForm") });
    }
    for (let i = 0; i < forms.length; i++) {
      if (i === cur) continue;
      const form = await fromUuid(forms[i]).catch(() => null);
      options.push({ value: String(i), label: form?.name ?? game.i18n.localize("SHIFT.Transform.MissingForm") });
    }
    if (!options.length) { ui.notifications?.info(game.i18n.localize("SHIFT.Transform.NoOtherForm")); return false; }
    const choice = await promptChoice({
      title: game.i18n.localize("SHIFT.Transform.ChooseForm"),
      hint: game.i18n.localize("SHIFT.Transform.ChooseHint"),
      options
    });
    if (choice === null) return false;
    const res = await this.transformTo(Number(choice));
    return !!res?.changed;
  }

  /**
   * Vai pra uma posição específica da fila: -1 = base (snapshot), 0..n = forms[stage].
   * Copia a identidade da forma alvo IN PLACE. Ao SAIR da base pela 1ª vez, captura o
   * snapshot da base (pra poder voltar). Usado pela navegação (escolher/voltar) na aba.
   */
  async transformTo(stage) {
    if (!this.isTrait || !this.system.transform?.enabled) return { changed: false };
    const t = this.system.transform;
    const fromName = this.name;

    // Captura a base ao SAIR dela (estágio -1 → uma forma). SEMPRE re-captura, pra a base
    // refletir as edições mais recentes feitas enquanto se estava nela — assim o snapshot
    // nunca fica desatualizado e voltar à base sempre traz a identidade certa.
    if ((t.stage ?? -1) === -1 && stage >= 0) await this.#captureBase(true);

    let identity = null;
    if (stage < 0) {
      stage = -1;
      const b = this.system.transform.base;
      if (!b?.captured) { ui.notifications?.warn(game.i18n.localize("SHIFT.Transform.NoBase")); return { changed: false }; }
      identity = b;
    } else {
      const uuid = (t.forms ?? [])[stage];
      const form = uuid ? await fromUuid(uuid).catch(() => null) : null;
      if (!form || form.type !== "trait") { ui.notifications?.warn(game.i18n.localize("SHIFT.Transform.FormMissing")); return { changed: false }; }
      identity = {
        name: form.name, maxDie: form.system.maxDie, currentDie: form.system.currentDie,
        keywords: form.system.keywords, drawbacks: form.system.drawbacks, description: form.system.description
      };
    }
    await this.#applyIdentity(identity, { "system.transform.stage": stage });
    await this.#announceTransform(fromName);
    return { changed: true, stage };
  }

  /** Snapshot da identidade atual como base. force=true regrava mesmo se já capturada. */
  async #captureBase(force = false) {
    if (!force && this.system.transform?.base?.captured) return;
    const s = this.system;
    await this.update({ "system.transform.base": {
      captured: true, name: this.name, maxDie: s.maxDie, currentDie: s.currentDie,
      keywords: [...(s.keywords ?? [])], drawbacks: [...(s.drawbacks ?? [])], description: s.description ?? ""
    } });
  }

  /** Aplica uma identidade (nome/dice/keywords/drawbacks/desc) IN PLACE + limpa exhausted.
   *  `extra` mescla campos adicionais no mesmo update (ex.: o novo stage), pra um único
   *  write/re-render por transformação em vez de vários. */
  async #applyIdentity(d, extra = {}) {
    const update = { "system.exhausted": false, ...extra };
    if (d.name) update.name = d.name;
    // Transformar/voltar SEMPRE reseta o die ao Max da forma (uma forma "fresca"); nunca
    // herda um currentDie velho (que podia estar exausto/abaixado antes do exhaust).
    const max = d.maxDie || d.currentDie || "d4";
    update["system.maxDie"] = max;
    update["system.currentDie"] = max;
    update["system.keywords"] = [...(d.keywords ?? [])];
    update["system.drawbacks"] = [...(d.drawbacks ?? [])];
    if (d.description !== undefined) update["system.description"] = d.description;
    await this.update(update);
    for (const k of (d.keywords ?? [])) await this.#ensureDescriptor("keyword", k);
    for (const k of (d.drawbacks ?? [])) await this.#ensureDescriptor("drawback", k);
  }

  /** Card de chat (amarelo, com brilho) anunciando uma transformação/reset. */
  async #announceTransform(fromName) {
    const actor = this.actor;
    const esc = foundry.utils.escapeHTML;
    const die = dieLabel(this.system.currentDie);
    const renamed = fromName !== this.name;
    const body = renamed
      ? game.i18n.format("SHIFT.Transform.Chat", { actor: esc(actor?.name ?? ""), from: esc(fromName), to: esc(this.name), die })
      : game.i18n.format("SHIFT.Transform.ChatReset", { actor: esc(actor?.name ?? ""), trait: esc(this.name), die });
    await ChatMessage.create({
      speaker: shiftSpeaker(actor),
      content: `<div class="shift-vtt chat-card info-card transform">
        <h3><i class="fa-solid fa-wand-magic-sparkles"></i> ${game.i18n.localize("SHIFT.Transform.Title")}</h3>
        <p>${body}</p>
      </div>`
    });
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
      <div class="shift-vtt chat-card technique-card ${this.system.techniqueType || ""}">
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

  /** Decide em QUE cliente o prompt de Going Down aparece. Pelas regras a escolha
   *  (Drawback / Morte Heroica) é do Player dono do character, mas o Core costuma ser
   *  exaurido por outro cliente: o GM aplicando o ataque de um Adversary, ou o relay de
   *  combate. Roteia para o dono NÃO-GM ativo (preferindo aquele cujo personagem
   *  designado é este actor); sem Player online, recai em quem puder escrever o actor
   *  (o GM ativo), para que a consequência nunca se perca em silêncio. */
  async #routeCoreExhaustedPrompt() {
    const actor = this.actor;
    if (!actor) return;
    const owners = game.users.filter(u => u.active && !u.isGM && actor.testUserPermission(u, "OWNER"));
    const target = owners.find(u => u.character?.id === actor.id) ?? owners[0] ?? null;
    if (target) {
      if (target.id === game.user.id) return this.promptCoreExhausted();
      return requestCoreDeathPrompt({ userId: target.id, traitUuid: this.uuid });
    }
    // Sem Player dono online: quem aplicou resolve se pode escrever; senão repassa ao GM ativo.
    if (actor.canUserModify(game.user, "update")) return this.promptCoreExhausted();
    const gm = game.users.activeGM;
    if (gm) requestCoreDeathPrompt({ userId: gm.id, traitUuid: this.uuid });
  }

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
