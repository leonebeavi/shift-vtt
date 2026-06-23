/**
 * SHIFT VTT — editor de SUBDIVISÕES, por ficha de Actor e por `kind`.
 *
 * Genérico: edita as seções de qualquer lista agrupável da ficha — Traits, Techniques
 * (Character) e Landmarks/NPCs (Location), conforme o `kind` recebido. Deixa o dono da
 * ficha renomear, reordenar, escolher o número de colunas (1/2/3), o "tipo padrão" do
 * botão "+" (só Trait/Technique; Landmark/NPC não criam por tipo) e a cor de destaque
 * (paleta fixa, a mesma dos Status Effects), além de criar novas seções.
 *
 * A layout escolhida é gravada no flag `${kind}Layout` do PRÓPRIO Actor; cada ficha e
 * cada kind tem a sua. Sem flag, a ficha usa o layout BASAL do kind (BaseShiftActorSheet
 * .groupSpecFor(kind)). O Reset remove o flag (volta ao basal). Itens caem nas seções
 * pela tag (system.group para Items; flag-map no pai para Landmarks/NPCs) ou, sem tag,
 * pela categoria.
 */
import { MARKER_PALETTE } from "../helpers/status-effects.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class TraitLayoutConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(options = {}) {
    // O `kind` da lista agrupável que estamos editando: "trait" (default), "technique",
    // "landmark" ou "npc". Cada um grava o próprio flag `${kind}Layout`.
    const kind = options.kind ?? "trait";
    // Um id único por Actor E por kind: editores de abas/fichas diferentes não colidem.
    options.id ??= `shift-${kind}-layout-${options.actor?.id ?? foundry.utils.randomID()}`;
    super(options);
    /** @type {string} */
    this.kind = kind;
    /** @type {Actor|null} */
    this.actor = options.actor ?? null;
  }

  /** Título por kind (a janela mostra "Edit Trait/Technique/Landmark/NPC Sections"). */
  get title() {
    const key = {
      trait: "SHIFT.TraitLayout.Title",
      technique: "SHIFT.TraitLayout.TitleTechnique",
      landmark: "SHIFT.TraitLayout.TitleLandmark",
      npc: "SHIFT.TraitLayout.TitleNpc"
    }[this.kind] ?? "SHIFT.TraitLayout.Title";
    return game.i18n.localize(key);
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["shift-vtt", "trait-layout-config"],
    position: { width: 600, height: "auto" },
    window: { title: "SHIFT.TraitLayout.Title", icon: "fa-solid fa-table-columns" },
    tag: "form",
    form: {
      handler: TraitLayoutConfig.#onSubmit,
      closeOnSubmit: true
    },
    actions: {
      addRow: TraitLayoutConfig.#onAddRow,
      deleteRow: TraitLayoutConfig.#onDeleteRow,
      moveRow: TraitLayoutConfig.#onMoveRow,
      pickColor: TraitLayoutConfig.#onPickColor,
      resetDefaults: TraitLayoutConfig.#onReset
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/apps/trait-layout-config.hbs" }
  };

  /** As linhas em edição. Seedadas uma vez do layout efetivo da ficha; depois
   *  mantidas em memória entre re-renders (cada ação relê o form antes de mexer). */
  #rows = null;

  /** As "categorias" que alimentam o seletor de tipo padrão do "+", por kind: as
   *  categorias de Trait (trait) ou os techniqueTypes (technique). Landmarks/NPCs não
   *  têm tipo padrão, então o seletor é escondido (ver showCreate). Mapa {key:labelKey}. */
  #categoryChoices() {
    if (this.kind === "technique") return CONFIG.SHIFT.techniqueTypes ?? {};
    return CONFIG.SHIFT.traitCategories ?? {};
  }

  /** Só Trait/Technique têm o seletor de "tipo padrão" do botão "+" (criam Items);
   *  Landmark/NPC não criam por tipo, então o seletor some. */
  get #showCreate() {
    return this.kind === "trait" || this.kind === "technique";
  }

  /** O "tipo padrão" inicial de uma seção nova, por kind. */
  get #defaultCreate() {
    return this.kind === "technique" ? "narrative" : "custom";
  }

  /** O layout BASAL (de fábrica) deste kind nesta ficha — ignora o flag. Usado pelo
   *  Reset e para preservar a chave de locale dos labels não editados. */
  #basalSpec() {
    return this.actor?.sheet?.groupSpecFor?.(this.kind) ?? [];
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    // Seed inicial: o layout EFETIVO da ficha p/ este kind (flag se houver, senão basal),
    // com os labels já localizados para edição (basal grava chave de locale; custom é literal).
    this.#rows ??= (this.actor?.sheet?.layoutFor?.(this.kind) ?? []).map(g => ({
      key: g.key,
      label: game.i18n.localize(g.label),
      columns: g.columns,
      color: g.color || "",
      create: g.create || this.#defaultCreate
    }));

    const choices = this.#categoryChoices();
    const catKeys = Object.keys(choices);
    context.showCreate = this.#showCreate;
    context.hintKey = {
      trait: "SHIFT.TraitLayout.Hint",
      technique: "SHIFT.TraitLayout.HintTechnique",
      landmark: "SHIFT.TraitLayout.HintLandmark",
      npc: "SHIFT.TraitLayout.HintNpc"
    }[this.kind] ?? "SHIFT.TraitLayout.Hint";
    context.rows = this.#rows.map((r, i) => ({
      ...r,
      index: i,
      columnsOptions: [1, 2, 3].map(n => ({ value: n, selected: n === r.columns })),
      categoryOptions: catKeys.map(c => ({
        value: c,
        label: game.i18n.localize(choices[c]),
        selected: c === r.create
      }))
    }));
    context.palette = MARKER_PALETTE;
    context.buttons = [
      { type: "submit", icon: "fa-solid fa-save", label: "SHIFT.Common.Confirm" }
    ];
    return context;
  }

  /** Relê os campos atuais de volta para #rows, 1:1 com as linhas renderizadas (sem
   *  filtrar), para o data-index de cada linha seguir alinhado entre re-renders;
   *  linhas em branco só são descartadas ao salvar. */
  #readForm() {
    this.#rows = [...this.element.querySelectorAll(".tl-row")].map(row => ({
      key: row.dataset.key || foundry.utils.randomID(),
      label: row.querySelector("input[name='label']")?.value ?? "",
      columns: Number(row.querySelector("select[name='columns']")?.value) || 2,
      color: row.querySelector("input[name='color']")?.value ?? "",
      create: row.querySelector("select[name='create']")?.value || "custom"
    }));
  }

  static #onAddRow() {
    this.#readForm();
    // Nova subdivisão: cor da paleta rotacionada pelo índice (evita seção cinza), e
    // tipo padrão "custom". Por padrão não reivindica categoria (só recebe por tag).
    this.#rows.push({
      key: foundry.utils.randomID(),
      label: "",
      columns: 2,
      color: MARKER_PALETTE[this.#rows.length % MARKER_PALETTE.length],
      create: this.#defaultCreate
    });
    this.render();
  }

  static #onDeleteRow(event, target) {
    this.#readForm();
    this.#rows.splice(Number(target.dataset.index), 1);
    this.render();
  }

  static #onMoveRow(event, target) {
    this.#readForm();
    const i = Number(target.dataset.index);
    const j = i + (target.dataset.dir === "up" ? -1 : 1);
    if (j < 0 || j >= this.#rows.length) return;
    [this.#rows[i], this.#rows[j]] = [this.#rows[j], this.#rows[i]];
    this.render();
  }

  static #onPickColor(event, target) {
    this.#readForm();
    const index = Number(target.closest(".tl-row")?.dataset.index);
    if (this.#rows[index]) this.#rows[index].color = target.dataset.color;   // "" = automático (cor pela key)
    this.render();
  }

  /** Reset ao basal do kind: remove o flag e re-renderiza a ficha, fechando o editor. */
  static async #onReset() {
    if (!this.actor?.isOwner) return;
    await this.actor?.unsetFlag("shift-vtt", `${this.kind}Layout`);
    this.actor?.sheet?.render();
    this.close();
  }

  static async #onSubmit() {
    if (!this.actor?.isOwner) return;
    this.#readForm();
    const rows = this.#rows
      .filter(r => r.label?.trim())   // descarta seções sem nome
      .map(r => ({
        key: r.key || foundry.utils.randomID(),
        label: this.#labelKeyFor(r),
        columns: (r.columns === 1 || r.columns === 3) ? r.columns : 2,
        color: typeof r.color === "string" ? r.color : "",
        create: r.create || "custom",
        // Preserva o reivindicado de categorias do basal (para itens sem tag caírem
        // certo); seções NOVAS não reivindicam nada (só por tag) — assim não capturam
        // itens antigos por engano.
        categories: this.#categoriesFor(r.key)
      }));
    await this.actor?.setFlag("shift-vtt", `${this.kind}Layout`, rows);
  }

  /** A linha basal de mesma key, se houver (para preservar locale/categorias). */
  #basalByKey(key) {
    return this.#basalSpec().find(g => g.key === key) ?? null;
  }

  /** Se a linha ainda é um default intacto (mesma key e label = o basal localizado),
   *  grava a CHAVE de locale ("SHIFT.Groups.*") em vez da string traduzida, para o
   *  idioma não congelar. Labels editados/novos ficam literais. */
  #labelKeyFor(r) {
    const b = this.#basalByKey(r.key);
    if (b && r.label?.trim() === game.i18n.localize(b.label)) return b.label;
    return r.label.trim();
  }

  /** As categorias que a seção reivindica para Traits SEM tag: as do basal de mesma
   *  key, senão [] (seções novas são só por tag). null do basal = todas. */
  #categoriesFor(key) {
    const b = this.#basalByKey(key);
    if (!b) return [];
    return b.categories === null ? null : (Array.isArray(b.categories) ? b.categories : []);
  }
}
