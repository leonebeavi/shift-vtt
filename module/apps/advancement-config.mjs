/**
 * SHIFT VTT — Submenu de configuração de Advancement.
 * O GM edita a lista de coisas que XP pode comprar (label + custo). Os chips da
 * sheet do personagem leem essa lista; se vazia, recai nos padrões do sistema.
 */

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export function getAdvancements() {
  const custom = game.settings.get("shift-vtt", "advancements") ?? [];
  // A lista escolhida (custom armazenada ou padrões do sistema) passa SEMPRE por
  // localize: para chaves de locale (defaults) devolve o texto traduzido ao vivo,
  // e para strings literais (labels custom do GM) devolve a entrada inalterada.
  const source = custom.length ? custom : CONFIG.SHIFT.advancements;
  return source.map(a => ({
    label: game.i18n.localize(a.label),
    cost: a.cost
  }));
}

export class AdvancementConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "shift-advancements",
    classes: ["shift-vtt", "advancement-config"],
    position: { width: 420, height: "auto" },
    window: { title: "SHIFT.Settings.Advancements.Name" },
    tag: "form",
    form: {
      handler: AdvancementConfig.#onSubmit,
      closeOnSubmit: true
    },
    actions: {
      addRow: AdvancementConfig.#onAddRow,
      deleteRow: AdvancementConfig.#onDeleteRow,
      resetDefaults: AdvancementConfig.#onReset
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/apps/advancement-config.hbs" }
  };

  #rows = null;

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    this.#rows ??= getAdvancements().map(r => ({ ...r }));
    context.rows = this.#rows;
    context.buttons = [
      { type: "submit", icon: "fa-solid fa-save", label: "SHIFT.Common.Confirm" }
    ];
    return context;
  }

  #readForm() {
    const labels = [...this.element.querySelectorAll("input[name='label']")].map(i => i.value);
    const costs = [...this.element.querySelectorAll("input[name='cost']")].map(i => Number(i.value) || 0);
    this.#rows = labels.map((label, i) => ({ label, cost: costs[i] }));
  }

  static #onAddRow() {
    this.#readForm();
    this.#rows.push({ label: "", cost: 1 });
    this.render();
  }

  static #onDeleteRow(event, target) {
    this.#readForm();
    const index = Number(target.dataset.index);
    this.#rows.splice(index, 1);
    this.render();
  }

  static #onReset() {
    // Mostra os labels DEFAULT já traduzidos no editor (antes mostrava as chaves cruas
    // "SHIFT.Advancement.*"). O #onSubmit reconverte cada default para a sua chave de
    // locale, então após Reset+Save eles seguem localizando ao vivo e não congelam no
    // idioma do GM.
    this.#rows = CONFIG.SHIFT.advancements.map(a => ({
      label: game.i18n.localize(a.label),
      cost: a.cost
    }));
    this.render();
  }

  /** Reconverte um label de volta à CHAVE de locale do default correspondente, casando
   *  pelo texto traduzido. Assim os defaults sobrevivem ao Save como chaves (seguem
   *  traduzindo ao vivo) enquanto labels custom do GM passam como literais. */
  static #defaultKeyFor(row) {
    const def = CONFIG.SHIFT.advancements.find(d => row.label?.trim() === game.i18n.localize(d.label));
    return def ? def.label : row.label;
  }

  static async #onSubmit(event, form, formData) {
    this.#readForm();
    const rows = this.#rows
      .filter(r => r.label?.trim())
      .map(r => ({ label: AdvancementConfig.#defaultKeyFor(r), cost: r.cost }));
    await game.settings.set("shift-vtt", "advancements", rows);
    for (const app of foundry.applications.instances.values()) {
      if (app.document?.type === "character") app.render();
    }
  }
}
