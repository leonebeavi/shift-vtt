/**
 * SHIFT VTT — Fichas de Item (ApplicationV2).
 */
import { dieLabel, dieStatusLabel, enrich, fvtt, openImagePicker, bindDescriptionSecrets } from "../helpers/utils.mjs";
import { ShiftBrowser } from "../apps/browser.mjs";
import { scaleEnabled } from "../settings.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

class BaseShiftItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  /** Modo de edição estrutural. Items começam DESTRAVADOS para owners (editar é o
   *  uso principal de uma ficha de Item); clicar no cadeado dá uma prévia da visão de
   *  Player/observador. Não-owners são sempre somente-leitura e nunca veem o cadeado. */
  #editMode = true;

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["shift-vtt", "sheet", "item"],
    position: { width: 520, height: "auto" },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      editImage: BaseShiftItemSheet.#onEditImage,
      toggleEdit: BaseShiftItemSheet.#onToggleEdit
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    Object.assign(context, {
      item,
      system: item.system,
      source: item.system._source ?? item.system,
      config: CONFIG.SHIFT,
      // `editable` = OWNER (jogabilidade + botão de cadeado); `editMode` = OWNER com
      // o cadeado aberto (edição estrutural). Um owner travado vê a prévia da visão de observador.
      editable: this.isEditable,
      editMode: this.#editMode && this.isEditable,
      isGM: game.user.isGM,
      enableScale: scaleEnabled(),
      diceList: CONFIG.SHIFT.dice,
      scaleOptions: [1, 2, 3, 4],
      enrichedDescription: await enrich(item.system.description, {
        // O GM sempre vê os blocos secretos; o botão Revelar/Esconder é ligado
        // pelo core no <prose-mirror> (modo de edição) e por bindDescriptionSecrets
        // na visão de leitura (.bio-display, ficha travada). Veja _onRender abaixo.
        secrets: game.user.isGM,
        rollData: item.actor?.getRollData?.() ?? {},
        relativeTo: item
      })
    });
    return context;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender?.(context, options);
    // Só o GM vê o botão Revelar/Esconder (classe gateia o CSS). Liga o reveal
    // dos blocos secretos mostrados em leitura (.bio-display, fora de um
    // <prose-mirror>) para que o GM revele aos jogadores mesmo com a ficha
    // travada. Subclasses que sobrescrevem _onRender chamam super.
    this.element?.classList.toggle("shift-gm", game.user.isGM);
    bindDescriptionSecrets(this);
  }

  static async #onEditImage(event, target) {
    if (!this.isEditable) return;
    openImagePicker(this.document, target.dataset.edit || "img");
  }

  static #onToggleEdit() {
    if (!this.isEditable) return;
    this.#editMode = !this.#editMode;
    this.render();
  }
}

/* ------------------------------------------------------------------ */
/* Trait                                                               */
/* ------------------------------------------------------------------ */

export class ShiftTraitSheet extends BaseShiftItemSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["trait"],
    position: { width: 520, height: "auto" },
    actions: {
      rollTrait: ShiftTraitSheet.#onRollTrait,
      shiftUp: ShiftTraitSheet.#onShiftUp,
      shiftDown: ShiftTraitSheet.#onShiftDown,
      exhaustTrait: ShiftTraitSheet.#onExhaust,
      addKeyword: ShiftTraitSheet.#onAddKeyword,
      removeKeyword: ShiftTraitSheet.#onRemoveKeyword,
      addDrawback: ShiftTraitSheet.#onAddDrawback,
      removeDrawback: ShiftTraitSheet.#onRemoveDrawback,
      itemTab: ShiftTraitSheet.#onTab
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/item/trait-sheet.hbs", scrollable: [""] }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    Object.assign(context, {
      statusKey: item.statusKey,
      statusLabel: dieStatusLabel(item.statusKey),
      dieImg: CONFIG.SHIFT.diceImages[item.statusKey] ?? null,
      canEditPills: context.editMode,
      currentLabel: dieLabel(item.system.currentDie),
      maxLabel: dieLabel(item.system.maxDie),
      canShiftUp: item.canShiftUp && this.isEditable,
      canShiftDown: item.canShiftDown && this.isEditable,
      canRoll: item.canRoll && !!item.actor && this.isEditable,
      categoryLabel: game.i18n.localize(CONFIG.SHIFT.traitCategories[item.system.category] ?? ""),
      isPackLike: ["pack", "cargo"].includes(item.system.category),
      categories: Object.entries(CONFIG.SHIFT.traitCategories).map(([k, v]) => ({
        key: k, label: game.i18n.localize(v)
      })),
      diceList: CONFIG.SHIFT.dice,
      scaleOptions: [1, 2, 3, 4],
      effectiveScale: item.effectiveScale,
      showScaleTag: item.scaleIsOverride && context.enableScale,
      scaleTooltip: `${game.i18n.localize("SHIFT.Trait.Scale")} ${item.effectiveScale}`,
      activeTab: this._activeTab ?? "desc"
    });
    return context;
  }

  /** Aceita Keyword e Drawback (items) soltos sobre a ficha. */
  async _onRender(context, options) {
    await super._onRender?.(context, options);
    const el = this.element;
    if (!el || el.dataset.shiftDropBound) return;
    el.dataset.shiftDropBound = "1";
    // Realce visual da ficha inteira enquanto se arrasta um Keyword/Drawback por cima.
    el.addEventListener("dragover", ev => { ev.preventDefault(); el.classList.add("drag-over"); });
    el.addEventListener("dragleave", ev => { if (!el.contains(ev.relatedTarget)) el.classList.remove("drag-over"); });
    el.addEventListener("drop", async ev => {
      el.classList.remove("drag-over");
      if (!this.isEditable) return;
      let data;
      try { data = fvtt.TextEditor.getDragEventData(ev); } catch (err) { return; }
      if (data?.type !== "Item") return;
      const dropped = await Item.implementation.fromDropData(data);
      if (!dropped || !["keyword", "drawback"].includes(dropped.type)) return;
      ev.preventDefault();
      if (dropped.type === "keyword") await this.document.addKeyword(dropped.name);
      else await this.document.addDrawback(dropped.name);
      ui.notifications.info(game.i18n.format("SHIFT.Drop.Attached", { name: dropped.name, trait: this.document.name }));
    });
  }

  static async #onRollTrait() {
    if (!this.isEditable) return;
    if (!this.document.actor) {
      return void ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NeedsActor"));
    }
    await this.document.roll();
  }

  static async #onShiftUp() { if (!this.isEditable) return; await this.document.shiftUp({}); }
  static async #onShiftDown() { if (!this.isEditable) return; await this.document.shiftDown({}); }
  static async #onExhaust() { if (!this.isEditable) return; await this.document.exhaust({}); }

  static async #onAddKeyword() {
    // Mesmo fluxo de Browser-ou-digitar da ficha de Actor; quando o Trait pertence a
    // um Actor, o descritor escolhido é copiado para ele, então a pill aponta para um Item real.
    const text = await ShiftBrowser.pickDescriptor({
      kind: "keyword",
      host: this.document.actor ?? null,
      addKey: "SHIFT.Keywords.Add",
      labelKey: "SHIFT.Keywords.Label"
    });
    if (text) await this.document.addKeyword(text);
  }

  static async #onRemoveKeyword(event, target) {
    const index = Number(target.dataset.index);
    if (Number.isInteger(index)) await this.document.removeKeyword(index);
  }

  static async #onAddDrawback() {
    const text = await ShiftBrowser.pickDescriptor({
      kind: "drawback",
      host: this.document.actor ?? null,
      addKey: "SHIFT.Drawbacks.Add",
      labelKey: "SHIFT.Drawbacks.Label"
    });
    if (text) await this.document.addDrawback(text);
  }

  static async #onRemoveDrawback(event, target) {
    const index = Number(target.dataset.index);
    if (Number.isInteger(index)) await this.document.removeDrawback(index);
  }

  /** Troca a aba ativa direto no DOM (sem re-render), pra escolha sobreviver ao submitOnChange. */
  static #onTab(event, target) {
    const tab = target.dataset.tab;
    if (!tab) return;
    this._activeTab = tab;
    const root = this.element;
    root.querySelectorAll(".item-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
    root.querySelectorAll(".item-tab-panel").forEach(p => p.classList.toggle("active", p.dataset.tab === tab));
  }
}

/* ------------------------------------------------------------------ */
/* Quest                                                               */
/* ------------------------------------------------------------------ */

/** Ficha enxuta da Quest: o clock (Shift Die) + config de dado + descrição. O
 *  desfecho (success/failure) e os links são geridos no card da aba Quests da
 *  Party — aqui é a configuração do clock e o texto da quest. */
export class ShiftQuestSheet extends BaseShiftItemSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["quest"],
    position: { width: 520, height: "auto" },
    actions: {
      rollTrait: ShiftQuestSheet.#onRoll,
      shiftUp: ShiftQuestSheet.#onShiftUp,
      shiftDown: ShiftQuestSheet.#onShiftDown,
      exhaustTrait: ShiftQuestSheet.#onExhaust,
      addRequire: ShiftQuestSheet.#onAddRequire,
      removeRequire: ShiftQuestSheet.#onRemoveRequire,
      openRequire: ShiftQuestSheet.#onOpenRequire
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/item/quest-sheet.hbs", scrollable: [""] }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    // Pré-requisitos atuais (Quests irmãs já escolhidas), resolvidos em {id, name}
    // para virar pills. O "+" cria nova ou escolhe existente.
    const requires = (item.system.requires ?? [])
      .map(id => item.actor?.items.get(id))
      .filter(q => q?.type === "quest")
      .map(q => ({ id: q.id, name: q.name, resolved: q.isResolved }));
    // Quest-mãe: candidatos = outras Quests, exceto a própria e seus DESCENDENTES
    // (senão criaria ciclo na árvore).
    const descendants = new Set();
    const collectDesc = id => {
      for (const c of item.actor?.quests ?? []) {
        if (c.system.parentId === id && !descendants.has(c.id)) { descendants.add(c.id); collectDesc(c.id); }
      }
    };
    collectDesc(item.id);
    const parentOptions = (item.actor?.quests ?? [])
      .filter(q => q.id !== item.id && !descendants.has(q.id))
      .map(q => ({ id: q.id, name: q.name, selected: q.id === item.system.parentId }));
    Object.assign(context, {
      parentId: item.system.parentId ?? "",
      parentOptions,
      statusKey: item.statusKey,
      statusLabel: dieStatusLabel(item.statusKey),
      dieImg: CONFIG.SHIFT.diceImages[item.statusKey] ?? null,
      currentLabel: dieLabel(item.system.currentDie),
      maxLabel: dieLabel(item.system.maxDie),
      canShiftUp: item.canShiftUp && this.isEditable,
      canShiftDown: item.canShiftDown && this.isEditable,
      canRoll: item.canRoll && !!item.actor && this.isEditable,
      diceList: CONFIG.SHIFT.dice,
      resolved: item.isResolved,
      outcome: item.questOutcome,
      locked: item.isLocked,
      requires,
      // Em leitura a seção aparece só se há pré-requisitos; em edição sempre
      // (dá pra criar/escolher), pois o "+" também CRIA uma quest nova.
      showPrereqs: context.editMode || requires.length > 0
    });
    return context;
  }

  static async #onRoll() {
    if (!this.isEditable) return;
    if (!this.document.actor) return void ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NeedsActor"));
    await this.document.roll();
  }
  static async #onShiftUp() { if (!this.isEditable) return; await this.document.shiftUp({}); }
  static async #onShiftDown() { if (!this.isEditable) return; await this.document.shiftDown({}); }
  static async #onExhaust() { if (!this.isEditable) return; await this.document.exhaust({}); }

  /** Adiciona um pré-requisito: escolhe uma Quest irmã existente OU cria uma nova
   *  ali mesmo (espelha o "browse-ou-digitar" de Keyword/Drawback). */
  static async #onAddRequire() {
    if (!this.isEditable) return;
    const quest = this.document;
    const actor = quest.actor;
    if (!actor) return void ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NeedsActor"));
    const L = k => game.i18n.localize(k);
    const esc = foundry.utils.escapeHTML;

    const reqs = new Set(quest.system.requires ?? []);
    const available = actor.quests.filter(q => q.id !== quest.id && !reqs.has(q.id));
    const opts = available.map(q => `<option value="${q.id}">${esc(q.name)}</option>`).join("");
    const content = `
      <div class="shift-prompt quest-prereq-add">
        ${available.length ? `<div class="form-group">
          <label>${esc(L("SHIFT.Party.Quests.PickExisting"))}</label>
          <select name="existing"><option value="">—</option>${opts}</select>
        </div>` : ""}
        <div class="form-group">
          <label>${esc(L("SHIFT.Party.Quests.CreateNew"))}</label>
          <input type="text" name="newName" placeholder="${esc(L("SHIFT.Party.Quests.NamePlaceholder"))}" autofocus/>
        </div>
      </div>`;

    let pick = null;
    try {
      pick = await fvtt.DialogV2.prompt({
        window: { title: L("SHIFT.Party.Quests.AddPrereq") },
        classes: ["shift-vtt", "shift-dialog"],
        content,
        rejectClose: false,
        ok: {
          label: L("SHIFT.Common.Confirm"),
          callback: (event, button) => ({
            existing: button.form.elements.existing?.value ?? "",
            newName: button.form.elements.newName?.value?.trim() ?? ""
          })
        }
      });
    } catch (err) { pick = null; }
    if (!pick) return;

    let id = pick.existing || null;
    if (pick.newName) {
      const [created] = await actor.createEmbeddedDocuments("Item", [{ type: "quest", name: pick.newName }]);
      id = created?.id ?? id;
    }
    if (!id) return;
    reqs.add(id);
    await quest.update({ "system.requires": [...reqs] });
  }

  /** Remove um pré-requisito (pelo id no chip). */
  static async #onRemoveRequire(event, target) {
    if (!this.isEditable) return;
    const id = target.closest("[data-req-id]")?.dataset.reqId;
    if (!id) return;
    const reqs = (this.document.system.requires ?? []).filter(r => r !== id);
    await this.document.update({ "system.requires": reqs });
  }

  /** Abre a ficha da Quest pré-requisito. */
  static #onOpenRequire(event, target) {
    const id = target.closest("[data-req-id]")?.dataset.reqId;
    const q = id ? this.document.actor?.items.get(id) : null;
    q?.sheet?.render(true);
  }
}

/* ------------------------------------------------------------------ */
/* Technique                                                           */
/* ------------------------------------------------------------------ */

export class ShiftTechniqueSheet extends BaseShiftItemSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["technique"],
    position: { width: 520, height: "auto" },
    actions: {
      useTechnique: ShiftTechniqueSheet.#onUse,
      resetTechnique: ShiftTechniqueSheet.#onReset,
      toggleTechniqueType: ShiftTechniqueSheet.#onToggleType,
      toggleRecharge: ShiftTechniqueSheet.#onToggleRecharge,
      cycleFocusScale: ShiftTechniqueSheet.#onCycleScale
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/item/technique-sheet.hbs", scrollable: [""] }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.typeOptions = Object.entries(CONFIG.SHIFT.techniqueTypes).map(([k, v]) => ({
      key: k, label: game.i18n.localize(v)
    }));
    context.typeLabel = game.i18n.localize(
      CONFIG.SHIFT.techniqueTypes[this.document.system.techniqueType] ?? ""
    );
    const r = this.document.system.recharges ?? {};
    // As quatro opções sempre aparecem como pills de toggle (edição) e só a(s)
    // escolhida(s) são refletidas na visão. "On any Rest" mantém "On Safe Rest"
    // aceso junto (nunca escondido); At Will é exclusivo e mostra o chip ∞.
    context.recharges = [
      { key: "session", icon: "fa-hourglass", label: game.i18n.localize("SHIFT.Recharge.session"), checked: !!r.session },
      { key: "safeRest", icon: "fa-campground", label: game.i18n.localize("SHIFT.Recharge.safeRest"), checked: !!r.safeRest },
      { key: "unsafeRest", icon: "fa-bed", label: game.i18n.localize("SHIFT.Recharge.unsafeRest"), checked: !!r.unsafeRest },
      { key: "atWill", icon: "fa-infinity", label: game.i18n.localize("SHIFT.Recharge.atWill"), checked: !!r.atWill }
    ];
    context.isAtWill = !!r.atWill;
    context.isCustomRecharge = !r.session && !r.safeRest && !r.unsafeRest && !r.atWill;

    // Scaled Up: o Focus Trait que ele eleva + a Scale como a qual é tratado.
    // Totalmente escondido quando o sistema de Scale está desativado.
    const sys = this.document.system;
    context.isScaledUp = this.document.isScaledUp && scaleEnabled();
    const focus = sys.focus ?? {};
    // A Scale "tratado como" é um pip compacto e clicável (2 → 3 → 4); nunca 1.
    context.focusScale = Math.max(2, focus.scale ?? 2);
    context.focusOptions = (this.document.actor?.getTraits?.("focus") ?? []).map(t => ({
      id: t.id, name: t.name, selected: t.id === focus.traitId
    }));
    // Um Focus vinculado que depois foi recategorizado para fora de "focus" some da
    // lista acima; mantemos visível+selecionado pra que o owner veja o vínculo real
    // (que ainda resolve na hora do roll) em vez de um enganoso "(none)".
    if (focus.traitId && !context.focusOptions.some(o => o.selected)) {
      context.focusOptions.push({
        id: focus.traitId,
        name: this.document.focusTrait?.name ?? focus.traitName ?? focus.traitId,
        selected: true
      });
    }
    // O vínculo de Focus só faz sentido num personagem: esconder quando sem dono
    // (ex.: num compêndio ou no diretório de items).
    context.focusUnowned = !this.document.actor;
    // Nome de exibição somente-leitura para observadores: o Trait vinculado resolvido,
    // depois o nome armazenado como fallback.
    context.focusBoundName = this.document.focusTrait?.name ?? focus.traitName ?? "";
    return context;
  }

  static async #onUse() { await this.document.use(); }
  static async #onReset() { await this.document.resetUses(); }

  static async #onToggleType() {
    // Scaled Up só é oferecido enquanto o sistema de Scale está ativado.
    const order = scaleEnabled() ? ["narrative", "mechanical", "scaledUp"] : ["narrative", "mechanical"];
    const cur = order.indexOf(this.document.system.techniqueType);
    const next = order[(cur + 1) % order.length];
    await this.document.update({ "system.techniqueType": next });
  }

  /** Alterna uma pill de gatilho de recharge. As regras (espelhadas em _preUpdate /
   *  prepareDerivedData pra que edições diretas fiquem consistentes):
   *   - At Will é exclusivo: ligá-lo limpa os três gatilhos de rest;
   *     desligá-lo deixa uma Technique manual (custom) com ≥1 uso.
   *   - Qualquer gatilho de rest limpa o At Will.
   *   - Ligar "On any Rest" também acende "On Safe Rest" (nunca é escondido);
   *     desligar "On Safe Rest" também limpa o redundante "On any Rest". */
  static async #onToggleRecharge(event, target) {
    if (!this.isEditable) return;
    const key = target.dataset.key;
    if (!key) return;
    const src = this.document.system.recharges ?? {};
    const r = {
      session: !!src.session, safeRest: !!src.safeRest,
      unsafeRest: !!src.unsafeRest, atWill: !!src.atWill
    };
    if (key === "atWill") {
      // Exclusivo, limpa os gatilhos de rest. Sair do At Will restaura um limite
      // utilizável (tratado em ShiftItem._preUpdate, pra todo caminho de update concordar).
      Object.assign(r, { session: false, safeRest: false, unsafeRest: false, atWill: !r.atWill });
    } else {
      r.atWill = false;
      r[key] = !r[key];
      if (key === "unsafeRest" && r.unsafeRest) r.safeRest = true;
      if (key === "safeRest" && !r.safeRest) r.unsafeRest = false;
    }
    await this.document.update({ "system.recharges": r });
  }

  /** Cicla o pip de Scale "tratado como": 2 → 3 → 4 → 2 (Scale 1 não faz sentido). */
  static async #onCycleScale() {
    const cur = Math.max(2, this.document.system.focus?.scale ?? 2);
    const next = cur >= 4 ? 2 : cur + 1;
    await this.document.update({ "system.focus.scale": next });
  }
}

/* ------------------------------------------------------------------ */
/* Keyword / Drawback                                                  */
/* ------------------------------------------------------------------ */

export class ShiftDescriptorSheet extends BaseShiftItemSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["descriptor"],
    position: { width: 460, height: "auto" }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/item/descriptor-sheet.hbs", scrollable: [""] }
  };
}

/* ------------------------------------------------------------------ */
/* Landmark                                                            */
/* ------------------------------------------------------------------ */

export class ShiftLandmarkSheet extends BaseShiftItemSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["landmark"],
    position: { width: 480, height: "auto" }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/item/landmark-sheet.hbs", scrollable: [""] }
  };
}
