/**
 * SHIFT VTT, comportamento compartilhado da ficha de Actor (ApplicationV2).
 */
import { dieLabel, dieStatusLabel, enrich, fvtt, openImagePicker } from "../helpers/utils.mjs";
import { ShiftBrowser } from "../apps/browser.mjs";
import { scaleEnabled } from "../settings.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class BaseShiftActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  /** Descrições inline expandidas (ids de Item). */
  #expanded = new Set();
  /** Modo de edição estrutural (travado por padrão: somente jogo). */
  #editMode = false;
  /** Grupos de Trait recolhidos (chaves de grupo). */
  #collapsed = new Set();

  tabGroups = { primary: "traits" };

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["shift-vtt", "sheet", "actor"],
    position: { width: 700, height: 760 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      tab: BaseShiftActorSheet.#onTab,
      actionRoll: BaseShiftActorSheet.#onActionRoll,
      rollTrait: BaseShiftActorSheet.#onRollTrait,
      shiftUp: BaseShiftActorSheet.#onShiftUp,
      shiftDown: BaseShiftActorSheet.#onShiftDown,
      exhaustTrait: BaseShiftActorSheet.#onExhaustTrait,
      exertTrait: BaseShiftActorSheet.#onExertTrait,
      makeTemporary: BaseShiftActorSheet.#onMakeTemporary,
      safeRest: BaseShiftActorSheet.#onSafeRest,
      unsafeRest: BaseShiftActorSheet.#onUnsafeRest,
      createItem: BaseShiftActorSheet.#onCreateItem,
      editItem: BaseShiftActorSheet.#onEditItem,
      deleteItem: BaseShiftActorSheet.#onDeleteItem,
      useTechnique: BaseShiftActorSheet.#onUseTechnique,
      resetTechnique: BaseShiftActorSheet.#onResetTechnique,
      addKeyword: BaseShiftActorSheet.#onAddKeyword,
      removeKeyword: BaseShiftActorSheet.#onRemoveKeyword,
      addDrawback: BaseShiftActorSheet.#onAddDrawback,
      removeDrawback: BaseShiftActorSheet.#onRemoveDrawback,
      adjustXp: BaseShiftActorSheet.#onAdjustXp,
      toggleExpand: BaseShiftActorSheet.#onToggleExpand,
      toggleEdit: BaseShiftActorSheet.#onToggleEdit,
      rechargeAll: BaseShiftActorSheet.#onRechargeAll,
      cycleScale: BaseShiftActorSheet.#onCycleScale,
      workTogether: BaseShiftActorSheet.#onWorkTogether,
      toggleGroup: BaseShiftActorSheet.#onToggleGroup,
      openDescriptor: BaseShiftActorSheet.#onOpenDescriptor,
      editImage: BaseShiftActorSheet.#onEditImage
    }
  };

  /* ---------------------------------------------------------------- */
  /* Context                                                           */
  /* ---------------------------------------------------------------- */

  /** As subclasses definem como os Items de Trait são agrupados na ficha. */
  get traitGroupSpec() {
    return [{ key: "all", label: "SHIFT.TraitCategory.custom", categories: null, css: "grid-2", create: "custom" }];
  }

  /** Se o usuário atual pode LER o texto narrativo deste Actor: a aba de
   *  notas/biografia e toda descrição em rich-text. Um Player LIMITED
   *  (abaixo de OBSERVER) vê apenas o estado de jogo; OBSERVER+ e GMs leem tudo. */
  get canViewNotes() {
    return this.document.testUserPermission(game.user, "OBSERVER");
  }

  /** Remove as abas que um Player LIMITED não pode abrir (a aba de notas/biografia). */
  _visibleTabs(tabs) {
    return this.canViewNotes ? tabs : tabs.filter(t => t.id !== "biography");
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;

    Object.assign(context, {
      actor,
      system: actor.system,
      source: actor.system._source ?? actor.system,
      config: CONFIG.SHIFT,
      editable: this.isEditable,
      isOwner: actor.isOwner,
      isGM: game.user.isGM,
      activeTab: this.tabGroups.primary,
      editMode: this.#editMode && this.isEditable,
      canViewNotes: this.canViewNotes,
      enableScale: scaleEnabled(),
      diceList: CONFIG.SHIFT.dice,
      scaleOptions: [1, 2, 3, 4],
      enrichedDescription: this.canViewNotes
        ? await enrich(actor.system.description, {
            rollData: actor.getRollData?.() ?? {},
            relativeTo: actor
          })
        : ""
    });

    context.traitGroups = await this.#prepareTraitGroups();
    context.techniques = await this.#prepareTechniques();
    return context;
  }

  async #prepareTraitGroups() {
    const actor = this.document;
    const canSee = item => item.system.revealed || game.user.isGM || actor.isOwner;
    const groups = [];

    for (const spec of this.traitGroupSpec) {
      const traits = actor.traits
        .filter(t => (spec.categories ? spec.categories.includes(t.system.category) : true))
        .filter(canSee)
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name));
      const ctxs = [];
      for (const t of traits) ctxs.push(await this.#traitContext(t));
      groups.push({
        key: spec.key,
        label: game.i18n.localize(spec.label),
        css: spec.css ?? "grid-2",
        createCategory: spec.create ?? null,
        special: spec.special ?? false,
        hideEmpty: spec.hideEmpty ?? false,
        collapsed: this.#collapsed.has(spec.key),
        traits: ctxs
      });
    }
    return groups.filter(g => g.traits.length || (!g.hideEmpty && this.isEditable));
  }

  /** Resolve um Item de Keyword/Drawback que corresponda ao texto de uma pill (Actor primeiro, depois world). */
  #findDescriptor(kind, text) {
    const match = i => i.type === kind && i.name.toLowerCase() === String(text).toLowerCase();
    return this.document.items.find(match) ?? game.items.find(match) ?? null;
  }

  #pillContext(kind, text) {
    const item = this.#findDescriptor(kind, text);
    let tooltip = "";
    // A descrição em rich-text de um descritor é narrativa: esconde de Players
    // LIMITED (o texto da pill + link ainda aparecem para o card seguir navegável).
    if (this.canViewNotes && item?.system.description) {
      // Faz o parse para um documento inerte (DOMParser não executa scripts nem
      // carrega recursos) antes de ler o texto; mais seguro que atribuir innerHTML.
      const parsed = new DOMParser().parseFromString(item.system.description, "text/html");
      tooltip = (parsed.body.textContent ?? "").trim().slice(0, 160);
    }
    return { text, tooltip, linked: !!item, uuid: item?.uuid ?? "" };
  }

  async #traitContext(item) {
    const sys = item.system;
    const expanded = this.#expanded.has(item.id);
    return {
      id: item.id,
      name: item.name,
      img: item.img,
      category: sys.category,
      categoryLabel: game.i18n.localize(CONFIG.SHIFT.traitCategories[sys.category] ?? ""),
      statusKey: item.statusKey,
      statusLabel: dieStatusLabel(item.statusKey),
      dieImg: CONFIG.SHIFT.diceImages[item.statusKey] ?? CONFIG.SHIFT.diceImages.exhausted,
      currentLabel: dieLabel(sys.currentDie),
      maxLabel: dieLabel(sys.maxDie),
      exhausted: sys.exhausted,
      temporary: sys.temporary,
      hidden: !sys.revealed,
      source: sys.source,
      // Uma Trait improvisada a partir do Pack mostra um ícone de mochila em vez de texto.
      fromPack: !!sys.source && sys.source === game.i18n.localize("SHIFT.Temporary.Source"),
      rollable: sys.rollable,
      canRoll: item.canRoll && this.isEditable,
      canUp: item.canShiftUp && this.isEditable,
      canDown: item.canShiftDown && this.isEditable,
      isPack: ["pack", "cargo"].includes(sys.category),
      usesKeywords: sys.features.usesKeywords,
      usesDrawbacks: sys.features.usesDrawbacks,
      keywords: (sys.keywords ?? []).map(k => this.#pillContext("keyword", k)),
      drawbacks: (sys.drawbacks ?? []).map(d => this.#pillContext("drawback", d)),
      hasDrawbacks: (sys.drawbacks ?? []).length > 0,
      loadout: sys.loadout ?? "",
      showScaleTag: item.scaleIsOverride && scaleEnabled(),
      effectiveScale: item.effectiveScale,
      scaleTooltip: `${game.i18n.localize("SHIFT.Trait.Scale")} ${item.effectiveScale}`,
      defeat: sys.defeat,
      extraActions: sys.adversary?.extraActions ?? 0,
      showAdversaryMeta: this.document.type === "adversary",
      expanded,
      enrichedDescription: (expanded && this.canViewNotes)
        ? await enrich(sys.description, { rollData: this.document.getRollData?.() ?? {}, relativeTo: item })
        : null
    };
  }

  async #prepareTechniques() {
    const out = [];
    for (const t of this.document.techniques.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name))) {
      const expanded = this.#expanded.has(t.id);
      const atWill = t.isAtWill;
      out.push({
        id: t.id,
        name: t.name,
        img: t.img,
        typeKey: t.system.techniqueType,
        typeLabel: game.i18n.localize(CONFIG.SHIFT.techniqueTypes[t.system.techniqueType] ?? ""),
        rechargeBadges: [
          atWill ? { icon: "fa-infinity", label: game.i18n.localize("SHIFT.Recharge.atWill") } : null,
          t.system.recharges?.session ? { icon: "fa-hourglass", label: game.i18n.localize("SHIFT.Recharge.session") } : null,
          t.system.recharges?.safeRest ? { icon: "fa-campground", label: game.i18n.localize("SHIFT.Recharge.safeRest") } : null,
          t.system.recharges?.unsafeRest ? { icon: "fa-bed", label: game.i18n.localize("SHIFT.Recharge.unsafeRest") } : null
        ].filter(Boolean),
        uses: t.system.uses,
        atWill,
        // Uma Technique At Will / ilimitada nunca está "spent"; uma limitada fica
        // spent assim que chega a 0 usos.
        spent: !atWill && (t.system.uses?.max ?? 0) > 0 && (t.system.uses?.value ?? 0) <= 0,
        canUse: this.isEditable && t.hasUse,
        isScaledUp: t.isScaledUp,
        expanded,
        enrichedDescription: (expanded && this.canViewNotes)
          ? await enrich(t.system.description, { rollData: this.document.getRollData?.() ?? {}, relativeTo: t })
          : null
      });
    }
    return out;
  }

  /* ---------------------------------------------------------------- */
  /* Renderização: origens de drag                                     */
  /* ---------------------------------------------------------------- */

  /** @override */
  async _onRender(context, options) {
    await super._onRender?.(context, options);
    if (!this.isEditable) return;
    // Faz o bind uma vez por elemento. Uma renderização parcial (render({parts:[…]}))
    // reexecuta este hook mas mantém em pé os nós das partes não renderizadas; a flag
    // impede o empilhamento de listeners duplicados nesses sobreviventes. Nós recém
    // renderizados chegam sem a flag e são vinculados normalmente.
    for (const input of this.element.querySelectorAll("[data-loadout]")) {
      if (input.dataset.shiftBound) continue;
      input.dataset.shiftBound = "1";
      input.addEventListener("change", async ev => {
        const id = ev.currentTarget.closest("[data-item-id]")?.dataset.itemId;
        const item = id ? this.document.items.get(id) : null;
        if (item) await item.update({ "system.loadout": ev.currentTarget.value });
      });
    }
    for (const el of this.element.querySelectorAll("[data-item-id][data-draggable='true']")) {
      el.setAttribute("draggable", "true");
      if (el.dataset.shiftDragBound) continue;
      el.dataset.shiftDragBound = "1";
      el.addEventListener("dragstart", ev => {
        const item = this.document.items.get(el.dataset.itemId);
        if (!item) return;
        ev.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Drops                                                             */
  /* ---------------------------------------------------------------- */

  /** @override */
  async _onDropItem(event, item) {
    if (!this.isEditable) return false;
    // O core do V14 resolve o Item antes de chamar isto, conforme o contrato
    // `_onDropItem(event, item)` do ActorSheetV2. Tolera também um payload bruto de
    // drag-data, para que um core mais antigo ou um chamador programático ainda
    // funcione (e para nunca reresolvermos um documento em memória sem uuid, o que
    // o fromDropData rejeita).
    if (!(item instanceof Item)) item = await Item.implementation.fromDropData(item);
    if (!item) return false;

    // Keywords e Drawbacks se anexam a um card de Trait.
    if (["keyword", "drawback"].includes(item.type)) {
      const row = event.target?.closest?.("[data-item-id]");
      const target = row ? this.document.items.get(row.dataset.itemId) : null;
      if (target?.isTrait) {
        if (item.type === "keyword") await target.addKeyword(item.name);
        else await target.addDrawback(item.name);
        ui.notifications.info(game.i18n.format("SHIFT.Drop.Attached", { name: item.name, trait: target.name }));
        return target;
      }
      ui.notifications.warn(game.i18n.localize("SHIFT.Drop.NeedsTrait"));
      return false;
    }

    if (!["trait", "technique", "landmark"].includes(item.type)) return false;

    // Soltar um item que JÁ está neste Actor é um reordenamento: reordena-o em
    // relação ao card onde caiu. Sempre fazemos isso nós mesmos e nunca delegamos
    // ao core aqui (o handler de drop do ActorSheetV2 do core não reordena de forma
    // confiável um item já embutido), para que cards de Trait / Technique / Landmark
    // possam ser arrastados em qualquer ordem em vez de ficarem presos à alfabética.
    if (item.parent === this.document) return this.#sortItem(event, item);

    // De outro lugar (sidebar, compendium, outro Actor) → cria-o aqui,
    // preferindo o caminho de criação do core quando presente.
    if (typeof super._onDropItem === "function") return super._onDropItem(event, item);
    return this.document.createEmbeddedDocuments("Item", [item.toObject()]);
  }

  async #sortItem(event, item) {
    const row = event.target?.closest?.("[data-item-id]");
    const target = row ? this.document.items.get(row.dataset.itemId) : null;
    if (!target || target.id === item.id || target.type !== item.type) return false;

    // As Traits são divididas em GRUPOS por categoria na ficha (veja traitGroupSpec):
    // só reordena dentro do PRÓPRIO grupo do card arrastado, para que um drop entre
    // grupos seja um no-op limpo em vez de embaralhar silenciosamente o grupo de origem.
    // Techniques e Landmarks são listas planas únicas, então ordenam contra todos os
    // irmãos do seu tipo.
    const groupKey = this.#traitGroupKeyFor(item);
    if (item.type === "trait" && this.#traitGroupKeyFor(target) !== groupKey) return false;

    const sameGroup = i => i.id !== item.id && i.type === item.type
      && (item.type !== "trait" || this.#traitGroupKeyFor(i) === groupKey);
    const siblings = this.document.items.filter(sameGroup);
    const updates = foundry.utils.performIntegerSort(item, { target, siblings })
      .map(u => ({ _id: u.target.id, sort: u.update.sort }));
    return this.document.updateEmbeddedDocuments("Item", updates);
  }

  /** A chave do trait-group que exibe uma dada Trait (conforme {@link traitGroupSpec}),
   *  ou null para items que não são Trait / uma categoria que nenhum grupo reivindica.
   *  Usada para manter um reordenamento por drag dentro do grupo visual do próprio card. */
  #traitGroupKeyFor(item) {
    if (item.type !== "trait") return null;
    const cat = item.system.category;
    const spec = this.traitGroupSpec.find(s => !s.categories || s.categories.includes(cat));
    return spec?.key ?? null;
  }

  /** @override */
  async _onDropActor() { return false; }

  /* ---------------------------------------------------------------- */
  /* Helpers                                                           */
  /* ---------------------------------------------------------------- */


  getItem(target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    return id ? this.document.items.get(id) : null;
  }

  /** Se a descrição inline de um item embutido está atualmente expandida.
   *  Exposto para que subclasses (por exemplo, Landmarks de Location) possam
   *  reutilizar o estado compartilhado de expandir/recolher acionado pela action toggleExpand. */
  _isExpanded(id) {
    return this.#expanded.has(id);
  }

  /* ---------------------------------------------------------------- */
  /* Actions (static; `this` é a instância da ficha)                   */
  /* ---------------------------------------------------------------- */

  static #onTab(event, target) {
    const tab = target.dataset.tab;
    if (!tab) return;
    this.tabGroups.primary = tab;
    if (typeof this.changeTab === "function") {
      try { return this.changeTab(tab, "primary", { force: true }); }
      catch (err) { /* cai para o render */ }
    }
    this.render();
  }

  static async #onActionRoll() {
    if (!this.isEditable) return;
    await game.shift.ShiftRoll.promptActionRoll(this.document);
  }

  static async #onRollTrait(event, target) {
    if (!this.isEditable) return;
    const item = this.getItem(target);
    if (!item) return;
    if (!item.canRoll) {
      return void ui.notifications.warn(game.i18n.format("SHIFT.Warnings.TraitExhaustedNamed", { trait: item.name }));
    }
    if (event.shiftKey) return item.roll();
    await game.shift.ShiftRoll.promptActionRoll(this.document, { preselect: item.id });
  }

  static async #onShiftUp(event, target) {
    await this.getItem(target)?.shiftUp({});
  }

  static async #onShiftDown(event, target) {
    await this.getItem(target)?.shiftDown({ force: event.ctrlKey || event.metaKey });
  }

  static async #onExhaustTrait(event, target) {
    await this.getItem(target)?.exhaust({ force: event.ctrlKey || event.metaKey });
  }

  static async #onExertTrait(event, target) {
    if (!this.isEditable) return;
    const item = this.getItem(target);
    if (item) await this.document.exert(item);
  }

  static async #onMakeTemporary(event, target) {
    await this.document.createTemporaryFocus(this.getItem(target));
  }

  static async #onSafeRest() {
    await this.document.safeRest();
  }

  static async #onUnsafeRest() {
    await this.document.unsafeRest();
  }

  static async #onCreateItem(event, target) {
    const type = target.dataset.type ?? "trait";
    const category = target.dataset.category ?? "custom";

    if (["trait", "technique"].includes(type)) {
      const picked = await ShiftBrowser.pick({
        types: [type],
        // Ao adicionar uma Trait, define o filtro inteligente do Browser para a
        // categoria do grupo por padrão (por exemplo, o grupo Special mostra Special Traits primeiro).
        category: type === "trait" ? category : null,
        title: game.i18n.localize(category === "special" ? "SHIFT.Special.Add" : `SHIFT.New.${type}`)
      });
      if (!picked) return;
      if (picked.doc) {
        const data = picked.doc.toObject();
        delete data._id;
        if (type === "trait") {
          data.system.category = category;
          data.system.temporary = false;
        }
        await this.document.createEmbeddedDocuments("Item", [data]);
        return;
      }
    }

    const data = { type, name: game.i18n.localize(`SHIFT.New.${type}`) };
    if (type === "trait") {
      data.system = { category, maxDie: "d6", currentDie: "d6" };
      if (category === "focus") data.system.source = "";
      if (category === "special") {
        // Special Traits são roláveis e contam para Overcoming (a contagem de defeat /
        // desgaste) por padrão, mas nunca para o orçamento de Power+2 Traits.
        // (img deixado sem definir → _preCreate aplica o ícone padrão de Trait.)
        data.system.adversary = { countsTowardTraitLimit: false };
      }
    }
    if (type === "landmark") data.img = "icons/svg/village.svg";
    const [created] = await this.document.createEmbeddedDocuments("Item", [data]);
    created?.sheet?.render(true);
  }

  static #onEditItem(event, target) {
    this.getItem(target)?.sheet?.render(true);
  }

  static async #onDeleteItem(event, target) {
    const item = this.getItem(target);
    if (!item) return;
    const confirmed = await fvtt.DialogV2.confirm({
      window: { title: game.i18n.localize("SHIFT.Common.Delete") },
      content: `<p>${game.i18n.format("SHIFT.Common.DeleteConfirm", { name: foundry.utils.escapeHTML(item.name) })}</p>`,
      rejectClose: false
    });
    if (confirmed) await item.delete();
  }

  static async #onUseTechnique(event, target) {
    if (!this.isEditable) return;
    await this.getItem(target)?.use();
  }

  static async #onResetTechnique(event, target) {
    await this.getItem(target)?.resetUses();
  }

  static async #onAddKeyword(event, target) {
    const item = this.getItem(target);
    if (!item) return;
    const text = await this.#pickDescriptorText("keyword", "SHIFT.Keywords.Add", "SHIFT.Keywords.Label");
    if (text) await item.addKeyword(text);
  }

  /** Navega pelos items de Keyword/Drawback (world + packs) ou digita um novo.
   *  Compartilhado com a ficha de Item de Trait via {@link ShiftBrowser.pickDescriptor}. */
  async #pickDescriptorText(kind, addKey, labelKey) {
    return ShiftBrowser.pickDescriptor({ kind, host: this.document, addKey, labelKey });
  }

  static async #onRemoveKeyword(event, target) {
    const item = this.getItem(target);
    const index = Number(target.dataset.index);
    if (item && Number.isInteger(index)) await item.removeKeyword(index);
  }

  static async #onAddDrawback(event, target) {
    const item = this.getItem(target);
    if (!item) return;
    const text = await this.#pickDescriptorText("drawback", "SHIFT.Drawbacks.Add", "SHIFT.Drawbacks.Label");
    if (text) await item.addDrawback(text);
  }

  static async #onRemoveDrawback(event, target) {
    const item = this.getItem(target);
    const index = Number(target.dataset.index);
    if (item && Number.isInteger(index)) await item.removeDrawback(index);
  }

  static async #onAdjustXp(event, target) {
    const delta = Number(target.dataset.delta) || 0;
    const value = Math.max(0, (this.document.system.xp?.value ?? 0) + delta);
    await this.document.update({ "system.xp.value": value });
  }

  static async #onCycleScale() {
    if (!this.isEditable || !scaleEnabled()) return;
    const opts = [1, 2, 3, 4];
    const cur = this.document.system.scale ?? 1;
    const next = opts[(opts.indexOf(cur) + 1) % opts.length];
    await this.document.update({ "system.scale": next });
  }

  static #onToggleExpand(event, target) {
    if (event.target.closest("input, select, textarea, prose-mirror, a[data-action]:not([data-action='toggleExpand']), button")) return;
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    if (!id) return;
    if (this.#expanded.has(id)) this.#expanded.delete(id);
    else this.#expanded.add(id);
    this.render();
  }

  static #onToggleEdit() {
    this.#editMode = !this.#editMode;
    this.render();
  }

  static async #onRechargeAll() {
    if (!this.isEditable) return;
    const n = await this.document.rechargeAllTraits();
    if (n) ui.notifications.info(game.i18n.format("SHIFT.Rest.RechargedAll", { actor: this.document.name }));
    else ui.notifications.info(game.i18n.localize("SHIFT.Rest.NothingToRestore"));
  }

  static async #onWorkTogether() {
    if (!this.isEditable) return;
    await game.shift.ShiftRoll.promptGroupStart(this.document);
  }

  static #onToggleGroup(event, target) {
    const key = target.closest("[data-group-key]")?.dataset.groupKey;
    if (!key) return;
    if (this.#collapsed.has(key)) this.#collapsed.delete(key);
    else this.#collapsed.add(key);
    this.render();
  }

  static async #onOpenDescriptor(event, target) {
    event.stopPropagation();
    const uuid = target.dataset.uuid;
    if (uuid) {
      const item = await fromUuid(uuid);
      item?.sheet?.render(true);
      return;
    }
    ui.notifications.info(game.i18n.localize("SHIFT.Drop.NoLinkedItem"));
  }

  static async #onEditImage(event, target) {
    if (!this.isEditable) return;
    openImagePicker(this.document, target.dataset.edit || "img");
  }
}
