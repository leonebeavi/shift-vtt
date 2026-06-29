/**
 * SHIFT VTT, comportamento compartilhado da ficha de Actor (ApplicationV2).
 */
import { dieLabel, dieStatusLabel, enrich, fvtt, openImagePicker, bindDescriptionSecrets, shiftSpeaker, dropStickyFocus } from "../helpers/utils.mjs";
import { bindDragFeedback } from "../helpers/drag-feedback.mjs";
import { ShiftBrowser } from "../apps/browser.mjs";
import { TraitLayoutConfig } from "../apps/trait-layout-config.mjs";
import { scaleEnabled } from "../settings.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/** Key do grupo de segurança "Ungrouped": recolhe os Traits cuja tag aponta para
 *  um grupo apagado e cuja categoria nenhuma subdivisão da layout reivindica, para
 *  que um Trait nunca desapareça da ficha. Some quando vazio. Exportada para que
 *  subclasses que estreitam os grupos (a Party) preservem este abrigo. */
export const CATCH_ALL_KEY = "__ungrouped";

/** Normaliza uma subdivisão de layout (basal por tipo OU custom do flag `*Layout`)
 *  para a forma canônica consumida pela ficha. Usada por TODAS as listas agrupáveis
 *  (Traits, Techniques, Landmarks, NPCs). `columns` é 1/2/3; `color` é hex da paleta
 *  ou "" (= cor padrão pela key, via LESS); `categories` null reivindica TODAS as
 *  categorias, array reivindica uma lista, e [] significa "só por tag" (subdivisões
 *  novas não capturam itens antigos por engano). */
function normalizeLayoutGroup(g) {
  const cols = Number(g.columns);
  return {
    key: g.key ?? foundry.utils.randomID(),
    label: g.label ?? "",
    columns: (cols === 1 || cols === 3) ? cols : 2,
    color: typeof g.color === "string" ? g.color : "",
    categories: g.categories === null ? null : (Array.isArray(g.categories) ? g.categories : []),
    create: g.create ?? null,
    hideEmpty: !!g.hideEmpty,
    special: !!g.special
  };
}

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
      transformTrait: BaseShiftActorSheet.#onTransformTrait,
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
      toggleExpand: BaseShiftActorSheet.#onToggleExpand,
      toggleEdit: BaseShiftActorSheet.#onToggleEdit,
      rechargeAll: BaseShiftActorSheet.#onRechargeAll,
      cycleScale: BaseShiftActorSheet.#onCycleScale,
      workTogether: BaseShiftActorSheet.#onWorkTogether,
      toggleGroup: BaseShiftActorSheet.#onToggleGroup,
      openTraitLayout: BaseShiftActorSheet.#onOpenTraitLayout,
      openDescriptor: BaseShiftActorSheet.#onOpenDescriptor,
      editImage: BaseShiftActorSheet.#onEditImage
    }
  };

  /* ---------------------------------------------------------------- */
  /* Context                                                           */
  /* ---------------------------------------------------------------- */

  /** As subclasses definem o layout BASAL das subdivisões de Trait (uma por tipo de
   *  Actor). Forma: {key, label, columns:1|2|3, color, categories, create, ...}.
   *  `categories` é o conjunto que a subdivisão reivindica para Traits SEM tag;
   *  `create` é a categoria que o botão "+" dá a um Trait novo (o "tipo padrão" da
   *  subdivisão). É o default de fábrica; cada Actor pode sobrescrever via flag. */
  get traitGroupSpec() {
    return [{ key: "all", label: "SHIFT.TraitCategory.custom", categories: null, columns: 2, color: "", create: "custom" }];
  }

  /** Basal das subdivisões de Technique (só a ficha de Character mostra Techniques).
   *  Um único grupo que reivindica tudo: o default é a lista plana de antes; quem
   *  quiser separa em seções no editor. `create` = o techniqueType padrão do "+". */
  get techniqueGroupSpec() {
    return [{ key: "techniques", label: "SHIFT.Tabs.Techniques", categories: null, columns: 1, color: "", create: "narrative" }];
  }

  /** Basal das subdivisões de Landmark (Location). Um único grupo claiming-all (a
   *  lista de antes). Landmarks são Locations-filhas (UUID), então a tag de grupo
   *  vive num flag-map no pai, não num campo do item. */
  get landmarkGroupSpec() {
    return [{ key: "landmarks", label: "SHIFT.Location.Landmarks", categories: null, columns: 1, color: "" }];
  }

  /** Basal das subdivisões de NPC (Location). Um único grupo claiming-all em grade. */
  get npcGroupSpec() {
    return [{ key: "npcs", label: "SHIFT.Location.NPCs", categories: null, columns: 2, color: "" }];
  }

  /** O basal (de fábrica) das subdivisões de um dado `kind` ("trait"/"technique"/
   *  "landmark"/"npc"). Centraliza o switch para o getter genérico e o editor. */
  groupSpecFor(kind) {
    switch (kind) {
      case "technique": return this.techniqueGroupSpec;
      case "landmark": return this.landmarkGroupSpec;
      case "npc": return this.npcGroupSpec;
      default: return this.traitGroupSpec;
    }
  }

  /** A layout EFETIVA das subdivisões de um `kind` desta ficha: o flag por-Actor
   *  `${kind}Layout` quando existe, senão o basal por tipo ({@link groupSpecFor}).
   *  Sempre normalizada. O editor {@link TraitLayoutConfig} grava o flag; o Reset
   *  dele o remove (voltando ao basal). */
  layoutFor(kind) {
    const custom = this.document.getFlag?.("shift-vtt", `${kind}Layout`);
    const source = (Array.isArray(custom) && custom.length) ? custom : this.groupSpecFor(kind);
    return source.map(normalizeLayoutGroup);
  }

  /** Atalho histórico: a layout efetiva das subdivisões de Trait. */
  get traitLayout() {
    return this.layoutFor("trait");
  }

  /** Se o usuário atual pode LER o texto narrativo deste Actor: a aba de
   *  notas/biografia e toda descrição em rich-text. Um Player LIMITED
   *  (abaixo de OBSERVER) vê apenas o estado de jogo; OBSERVER+ e GMs leem tudo. */
  get canViewNotes() {
    return this.document.testUserPermission(game.user, "OBSERVER");
  }

  /** Quem pode ROLAR os Traits/Quests desta ficha. Por padrão exige edição (OWNER),
   *  como toda ação; a Party afrouxa para OBSERVER, já que os Traits/Quests são
   *  compartilhados — o engine de roll relaya o ShiftDown via socket para o GM. */
  get canRollTraits() {
    return this.isEditable;
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
            // O GM sempre vê os blocos secretos do Foundry (revelados e ocultos);
            // o botão Revelar/Esconder do core funciona no <prose-mirror> fechado
            // mesmo fora do modo de edição. Jogadores só recebem o que foi revelado.
            secrets: game.user.isGM,
            rollData: actor.getRollData?.() ?? {},
            relativeTo: actor
          })
        : ""
    });

    // GM Note: campo privado do GM nas fichas que NÃO são de Character (Adversary,
    // Vehicle, Location têm system.gmNote; Character não). É o mesmo campo que o Codex
    // do Party lê/edita → as duas visões sincronizam. Só o GM o vê/edita. Nota SIMPLES:
    // editada por um <textarea name="system.gmNote"> (auto-save via submitOnChange), texto
    // puro — então o template usa source.gmNote direto, sem enrich.
    context.hasGmNote = "gmNote" in actor.system;

    context.traitGroups = await this.#prepareTraitGroups();
    // techniqueGroups só é consumido pelo PART "techniques" (hoje só a ficha de
    // Character o tem); não desperdiça a preparação em Adversary/Vehicle/Location/etc.
    if (this.constructor.PARTS?.techniques) {
      context.techniqueGroups = await this.#prepareTechniqueGroups();
    }
    return context;
  }

  /** Motor genérico de subdivisão, compartilhado por Traits/Techniques/Landmarks/NPCs.
   *  Recebe a `layout` normalizada e uma lista de ENTRADAS já preparadas (contextos de
   *  render), e bucketiza cada uma na seção que a exibe: a tag explícita (`tagOf`)
   *  vence se o grupo ainda existe; senão cai pela `categoryOf` no primeiro grupo que
   *  a reivindica (`categories` null = todas); o que não casa nada vira "órfão" → o
   *  abrigo {@link CATCH_ALL_KEY} no fim (some quando vazio). `itemsKey` nomeia o array
   *  de cada grupo (ex.: "traits", "techniques", "children", "npcs") para o template.
   *  "Protegido" (underscore) para que subclasses (Location) o reusem em Landmarks/NPCs. */
  _groupEntries(layout, entries, { tagOf, categoryOf = () => null, itemsKey, ungroupedLabel = "SHIFT.Groups.Ungrouped" }) {
    const keyFor = e => BaseShiftActorSheet.#groupKeyFor(layout, { tag: tagOf(e), category: categoryOf(e) });
    const buckets = new Map(layout.map(g => [g.key, []]));
    const orphans = [];
    for (const e of entries) {
      const k = keyFor(e);
      if (buckets.has(k)) buckets.get(k).push(e);
      else orphans.push(e);
    }
    const groups = layout.map(spec => ({
      key: spec.key,
      label: game.i18n.localize(spec.label),   // basal = chave de locale; custom = literal (localize deixa passar)
      columns: spec.columns,
      color: spec.color || "",
      createCategory: spec.create ?? null,
      special: spec.special,
      hideEmpty: spec.hideEmpty,
      collapsed: this.#collapsed.has(spec.key),
      [itemsKey]: buckets.get(spec.key)
    }));
    if (orphans.length) {
      groups.push({
        key: CATCH_ALL_KEY,
        label: game.i18n.localize(ungroupedLabel),
        columns: layout[0]?.columns ?? 2, color: "", createCategory: null, special: false, hideEmpty: true,
        collapsed: this.#collapsed.has(CATCH_ALL_KEY),
        [itemsKey]: orphans
      });
    }
    return groups.filter(g => g[itemsKey].length || (!g.hideEmpty && this.isEditable));
  }

  async #prepareTraitGroups() {
    const actor = this.document;
    const canSee = item => item.system.revealed || game.user.isGM || actor.isOwner;
    const visible = actor.traits.filter(canSee)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name));
    const entries = [];
    for (const t of visible) entries.push(await this.#traitContext(t));
    return this._groupEntries(this.layoutFor("trait"), entries, {
      tagOf: e => e.group, categoryOf: e => e.category, itemsKey: "traits"
    });
  }

  /** Subdivisões da aba Techniques (só Character a renderiza). Espelha os Traits:
   *  tag em system.group, fallback pela categoria = techniqueType. */
  async #prepareTechniqueGroups() {
    const entries = await this.#prepareTechniques();
    return this._groupEntries(this.layoutFor("technique"), entries, {
      tagOf: e => e.group, categoryOf: e => e.typeKey, itemsKey: "techniques"
    });
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
      group: sys.group ?? "",
      category: sys.category,
      categoryLabel: game.i18n.localize(CONFIG.SHIFT.traitCategories[sys.category] ?? ""),
      statusKey: item.statusKey,
      statusLabel: dieStatusLabel(item.statusKey),
      dieImg: CONFIG.SHIFT.diceImages[item.statusKey] ?? null,
      currentLabel: dieLabel(sys.currentDie),
      maxLabel: dieLabel(sys.maxDie),
      exhausted: sys.exhausted,
      temporary: sys.temporary,
      hidden: !sys.revealed,
      source: sys.source,
      // Uma Trait improvisada a partir do Pack mostra um ícone de mochila em vez de texto.
      fromPack: !!sys.source && sys.source === game.i18n.localize("SHIFT.Temporary.Source"),
      rollable: sys.rollable,
      canRoll: item.canRoll && this.canRollTraits,
      canUp: item.canShiftUp && this.isEditable,
      canDown: item.canShiftDown && this.isEditable,
      canTransform: item.canTransform && item.transformVisible,
      isPack: ["pack", "cargo"].includes(sys.category),
      keywords: (sys.keywords ?? []).map(k => this.#pillContext("keyword", k)),
      drawbacks: (sys.drawbacks ?? []).map(d => this.#pillContext("drawback", d)),
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
        group: t.system.group ?? "",
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
    // Só o GM vê o botão Revelar/Esconder dos blocos secretos do Foundry (a
    // classe gateia o CSS); evita que um owner não-GM altere o estado revelado
    // de um segredo pelo botão que o core liga no <prose-mirror>. O bind cobre a
    // visão de leitura (.bio-display) por simetria com as fichas de Item.
    this.element?.classList.toggle("shift-gm", game.user.isGM);
    bindDescriptionSecrets(this);
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
    // Feedback visual de arraste (source esmaecido, realce da drop-zone, linha de reorder).
    bindDragFeedback(this.element);
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

    if (!["trait", "technique"].includes(item.type)) return false;

    // Soltar um item que JÁ está neste Actor é um reordenamento: reordena-o em
    // relação ao card onde caiu. Sempre fazemos isso nós mesmos e nunca delegamos
    // ao core aqui (o handler de drop do ActorSheetV2 do core não reordena de forma
    // confiável um item já embutido), para que cards de Trait / Technique
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

    // Traits E Techniques são divididos em SUBDIVISÕES (system.group). Outros tipos de
    // Item (sem grupos) caem na ordenação plana entre irmãos do mesmo tipo.
    const kind = item.type === "trait" ? "trait" : item.type === "technique" ? "technique" : null;
    if (!kind) {
      if (!target || target.id === item.id || target.type !== item.type) return false;
      const siblings = this.document.items.filter(i => i.id !== item.id && i.type === item.type);
      const updates = foundry.utils.performIntegerSort(item, { target, siblings })
        .map(u => ({ _id: u.target.id, sort: u.update.sort }));
      return this.document.updateEmbeddedDocuments("Item", updates);
    }

    // O destino é a subdivisão onde o card caiu, lido direto do DOM (data-group-key):
    // soltar num grupo DIFERENTE RE-TAGUEIA o item (system.group) para ele grudar lá;
    // soltar no mesmo grupo só reordena. Snapshot da layout uma vez (o getter
    // reconstrói o array a cada acesso).
    const layout = this.layoutFor(kind);
    const destKey = event.target?.closest?.("[data-group-key]")?.dataset.groupKey
      ?? this.#itemGroupKeyFor(item, kind, layout);
    const curKey = this.#itemGroupKeyFor(item, kind, layout);

    // Nova tag ao mudar de grupo: a key do destino; o grupo de segurança limpa a tag
    // (volta ao fallback por categoria). null = não mudou de grupo.
    const regroup = destKey === curKey ? null : (destKey === CATCH_ALL_KEY ? "" : destKey);

    // Irmãos = os items do mesmo tipo exibidos no grupo DESTINO (fora o arrastado).
    const siblings = this.document.items.filter(i =>
      i.id !== item.id && i.type === item.type && this.#itemGroupKeyFor(i, kind, layout) === destKey);

    let updates = [];
    if (target && target.id !== item.id && target.type === item.type
        && this.#itemGroupKeyFor(target, kind, layout) === destKey) {
      updates = foundry.utils.performIntegerSort(item, { target, siblings })
        .map(u => ({ _id: u.target.id, sort: u.update.sort }));
    }

    // Garante a (re)tag do arrastado no update set; se ele só trocou de grupo (sem um
    // card-alvo de reorder), dá a ele um sort no fim do grupo destino.
    if (regroup !== null) {
      const own = updates.find(u => u._id === item.id);
      if (own) own["system.group"] = regroup;
      else {
        const maxSort = siblings.reduce((m, s) => Math.max(m, s.sort ?? 0), 0);
        updates.push({ _id: item.id, "system.group": regroup, sort: maxSort + CONST.SORT_INTEGER_DENSITY });
      }
    }

    if (!updates.length) return false;
    return this.document.updateEmbeddedDocuments("Item", updates);
  }

  /** Regra ÚNICA de bucketização de uma subdivisão, compartilhada pela preparação de
   *  contexto ({@link _groupEntries}) e pelo reorder por drag ({@link #itemGroupKeyFor}),
   *  para que as duas NUNCA divirjam: a tag explícita vence se o grupo ainda existe; senão
   *  a `category` cai no primeiro grupo que a reivindica (categories null = todas); senão
   *  o abrigo {@link CATCH_ALL_KEY}. Recebe {tag, category} já resolvidos, ficando agnóstica
   *  ao formato do campo (Trait usa `category`; Technique usa `techniqueType`). */
  static #groupKeyFor(layout, { tag, category }) {
    if (tag && layout.some(s => s.key === tag)) return tag;
    const found = layout.find(s => s.categories === null
      || (Array.isArray(s.categories) && category != null && s.categories.includes(category)));
    return found?.key ?? CATCH_ALL_KEY;
  }

  /** A key da subdivisão que exibe um dado Item (Trait ou Technique), conforme a layout
   *  efetiva do `kind`: a tag explícita `system.group` vence se o grupo ainda existe;
   *  senão cai pela categoria (Trait = `category`; Technique = `techniqueType`) no
   *  primeiro grupo que a reivindica (categories null = todas); senão o abrigo
   *  {@link CATCH_ALL_KEY}. Usada para agrupar e para manter o reorder por drag. */
  #itemGroupKeyFor(item, kind, layout = this.layoutFor(kind)) {
    const category = kind === "trait" ? item.system.category
      : kind === "technique" ? item.system.techniqueType : null;
    return BaseShiftActorSheet.#groupKeyFor(layout, { tag: item.system.group, category });
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
    if (!this.canRollTraits) return;
    const item = this.getItem(target);
    if (!item) return;
    if (!item.canRoll) {
      // Distingue o motivo: um Trait com `rollable: false` (o ícone 🚫) NÃO está
      // exausto — avisar "Exhausted" ali confunde. Só cai no aviso de exausto quando
      // o motivo é mesmo esse.
      const key = item.system.rollable ? "SHIFT.Warnings.TraitExhaustedNamed" : "SHIFT.Warnings.TraitNotRollable";
      return void ui.notifications.warn(game.i18n.format(key, { trait: item.name }));
    }
    if (event.shiftKey) return item.roll();
    await game.shift.ShiftRoll.promptActionRoll(this.document, { preselect: item.id });
  }

  static async #onShiftUp(event, target) {
    if (!this.isEditable) return;
    const item = this.getItem(target);
    if (!item) return;
    const res = await item.shiftUp({});
    if (res?.changed) await BaseShiftActorSheet.#announceSheetShift(item, res, "up");
  }

  static async #onShiftDown(event, target) {
    if (!this.isEditable) return;
    const item = this.getItem(target);
    if (!item) return;
    const res = await item.shiftDown({ force: event.ctrlKey || event.metaKey });
    if (res?.changed) await BaseShiftActorSheet.#announceSheetShift(item, res, "down");
  }

  /** Registra no chat um shift up/down feito DIRETO num botão da ficha de Actor.
   *  Só os handlers acima chamam aqui: rolls (auto-shift) e os botões de chat
   *  (crit bonus, Scaled Up, ataque ao alvo) já têm seus próprios anúncios, e os
   *  botões de shift das fichas de Item ficam de fora por design. */
  static async #announceSheetShift(item, res, direction) {
    const actor = item.actor;
    // Só personagens registram no chat: Adversary/Vehicle/Location/Party fazem muito
    // bookkeeping de dado na ficha e gerariam ruído. O efeito é dos PCs.
    if (!actor || actor.type !== "character") return;
    const up = direction === "up";
    const text = game.i18n.format(up ? "SHIFT.Shift.UpChat" : "SHIFT.Shift.DownChat", {
      actor: foundry.utils.escapeHTML(actor.name),
      trait: foundry.utils.escapeHTML(item.name),
      from: dieLabel(res.from),
      to: dieLabel(res.to)
    });
    const icon = up ? "fa-arrow-up" : "fa-arrow-down";
    await ChatMessage.create({
      speaker: shiftSpeaker(actor),
      content: `<div class="shift-vtt chat-card info-card shift${up ? "up" : "down"}"><p><i class="fa-solid ${icon}"></i> ${text}</p></div>`
    });
  }

  static async #onExhaustTrait(event, target) {
    if (!this.isEditable) return;
    await this.getItem(target)?.exhaust({ force: event.ctrlKey || event.metaKey });
  }

  /** Transforma/reseta um Trait (✦). Nível VER: GM, ou player OWNER com playerVisible.
   *  transform() já pergunta: nome (caso aberto, Attitude) ou pra qual forma (fila). */
  static async #onTransformTrait(event, target) {
    const item = this.getItem(target);
    if (!item?.transformVisible) return;
    await item.transform();
  }

  static async #onExertTrait(event, target) {
    if (!this.isEditable) return;
    const item = this.getItem(target);
    if (item) await this.document.exert(item);
  }

  static async #onMakeTemporary(event, target) {
    if (!this.isEditable) return;
    await this.document.createTemporaryFocus(this.getItem(target));
  }

  static async #onSafeRest() {
    if (!this.isEditable) return;
    await this.document.safeRest();
  }

  static async #onUnsafeRest() {
    if (!this.isEditable) return;
    await this.document.unsafeRest();
  }

  static async #onCreateItem(event, target) {
    if (!this.isEditable) return;
    const type = target.dataset.type ?? "trait";
    const category = target.dataset.category ?? "custom";
    // A subdivisão dona do "+" tagueia o Trait novo (system.group) para ele nascer
    // exatamente nela, independente da categoria. Vazio = sem tag (cai pela categoria).
    const groupKey = target.dataset.groupKey ?? "";

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
          if (groupKey) data.system.group = groupKey;
        }
        if (type === "technique" && groupKey) data.system.group = groupKey;
        await this.document.createEmbeddedDocuments("Item", [data]);
        return;
      }
    }

    const data = { type, name: game.i18n.localize(`SHIFT.New.${type}`) };
    if (type === "technique") {
      data.system = {};
      if (groupKey) data.system.group = groupKey;
      // O "tipo padrão" da subdivisão vira o techniqueType inicial do "+".
      if (["narrative", "mechanical", "scaledUp"].includes(category)) data.system.techniqueType = category;
    }
    if (type === "trait") {
      data.system = { category, maxDie: "d6", currentDie: "d6" };
      if (groupKey) data.system.group = groupKey;
      if (category === "focus") data.system.source = "";
      if (category === "special") {
        // Special Traits são roláveis e contam para Overcoming (a contagem de defeat /
        // desgaste) por padrão, mas nunca para o orçamento de Power+2 Traits.
        // (img deixado sem definir → _preCreate aplica o ícone padrão de Trait.)
        data.system.adversary = { countsTowardTraitLimit: false };
      }
    }
    const [created] = await this.document.createEmbeddedDocuments("Item", [data]);
    created?.sheet?.render(true);
  }

  static #onEditItem(event, target) {
    this.getItem(target)?.sheet?.render(true);
  }

  static async #onDeleteItem(event, target) {
    if (!this.isEditable) return;
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
    if (!this.isEditable) return;
    await this.getItem(target)?.resetUses();
  }

  static async #onAddKeyword(event, target) {
    if (!this.isEditable) return;
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
    if (!this.isEditable) return;
    const item = this.getItem(target);
    const index = Number(target.dataset.index);
    if (item && Number.isInteger(index)) await item.removeKeyword(index);
  }

  static async #onAddDrawback(event, target) {
    if (!this.isEditable) return;
    const item = this.getItem(target);
    if (!item) return;
    const text = await this.#pickDescriptorText("drawback", "SHIFT.Drawbacks.Add", "SHIFT.Drawbacks.Label");
    if (text) await item.addDrawback(text);
  }

  static async #onRemoveDrawback(event, target) {
    if (!this.isEditable) return;
    const item = this.getItem(target);
    const index = Number(target.dataset.index);
    if (item && Number.isInteger(index)) await item.removeDrawback(index);
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
    dropStickyFocus(event);   // sem anel de foco rosa preso no card após recolher
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

  /** A aba ativa → o `kind` de subdivisão que o editor deve abrir (null se a aba não
   *  tem subdivisões customizáveis). */
  #layoutKindForTab(tab) {
    return { traits: "trait", techniques: "technique", landmarks: "landmark", npcs: "npc" }[tab] ?? null;
  }

  /** Abre o editor de subdivisões DESTA ficha para a aba ativa (Traits/Techniques/
   *  Landmarks/NPCs): renomear, reordenar, colunas, tipo padrão, criar novas, cor de
   *  destaque. É por-Actor e por-kind: grava o flag `${kind}Layout`. O botão é inline
   *  na aba, então reaproveita um editor já aberto deste par Actor+kind em vez de criar
   *  uma janela órfã de mesmo id. */
  static #onOpenTraitLayout() {
    if (!this.isEditable) return;
    const kind = this.#layoutKindForTab(this.tabGroups.primary);
    if (!kind) return;
    const id = `shift-${kind}-layout-${this.document.id}`;
    const existing = foundry.applications.instances.get(id);
    if (existing) return void existing.bringToFront?.();
    new TraitLayoutConfig({ actor: this.document, kind }).render(true);
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
