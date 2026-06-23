/**
 * SHIFT VTT — editor de SUBDIVISÕES de Trait, por ficha de Actor.
 *
 * As subdivisões são as seções da aba Traits (Core Traits, Focus Traits, Pack
 * Trait, ...). Este editor deixa o dono da ficha renomear, reordenar, escolher o
 * número de colunas (1/2/3), o "tipo de trait padrão" do botão "+" e a cor de
 * destaque (paleta fixa, a mesma dos Status Effects), além de criar novas seções.
 *
 * A layout escolhida é gravada no flag `traitLayout` do PRÓPRIO Actor; cada ficha
 * tem a sua. Sem flag, a ficha usa o layout BASAL do tipo (BaseShiftActorSheet
 * .traitGroupSpec). O Reset remove o flag (volta ao basal). Os Traits caem nas
 * seções pela tag system.group (criar/arrastar) ou, sem tag, pela categoria.
 */
import { MARKER_PALETTE } from "../helpers/status-effects.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class TraitLayoutConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(options = {}) {
    // Um id único por Actor: dois editores de fichas diferentes não colidem.
    options.id ??= `shift-trait-layout-${options.actor?.id ?? foundry.utils.randomID()}`;
    super(options);
    /** @type {Actor|null} */
    this.actor = options.actor ?? null;
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

  /** As 9 categorias de Trait, em opções {value,label} (a "quest" é tipo próprio
   *  de Item agora, então fica de fora do seletor de tipo padrão). */
  get #categoryKeys() {
    return Object.keys(CONFIG.SHIFT.traitCategories);
  }

  /** O layout BASAL (de fábrica) do tipo desta ficha — ignora o flag. Usado pelo
   *  Reset e para preservar a chave de locale dos labels não editados. */
  #basalSpec() {
    return this.actor?.sheet?.traitGroupSpec ?? [];
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    // Seed inicial: o layout EFETIVO da ficha (flag se houver, senão basal), com os
    // labels já localizados para edição (basal grava chave de locale; custom é literal).
    this.#rows ??= (this.actor?.sheet?.traitLayout ?? []).map(g => ({
      key: g.key,
      label: game.i18n.localize(g.label),
      columns: g.columns,
      color: g.color || "",
      create: g.create || "custom"
    }));

    const cats = this.#categoryKeys;
    context.rows = this.#rows.map((r, i) => ({
      ...r,
      index: i,
      columnsOptions: [1, 2, 3].map(n => ({ value: n, selected: n === r.columns })),
      categoryOptions: cats.map(c => ({
        value: c,
        label: game.i18n.localize(CONFIG.SHIFT.traitCategories[c]),
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
      create: "custom"
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

  /** Reset ao basal do TIPO: remove o flag e re-renderiza a ficha, fechando o editor. */
  static async #onReset() {
    if (!this.actor?.isOwner) return;
    await this.actor?.unsetFlag("shift-vtt", "traitLayout");
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
        // Preserva o reivindicado de categorias do basal (para Traits sem tag caírem
        // certo); seções NOVAS não reivindicam nada (só por tag) — assim não capturam
        // Traits antigos por engano.
        categories: this.#categoriesFor(r.key)
      }));
    await this.actor?.setFlag("shift-vtt", "traitLayout", rows);
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
