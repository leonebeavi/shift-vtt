/**
 * SHIFT VTT — submenu de configuração dos Status Effects.
 * O GM edita a lista de color-markers do Token (nome + cor). Armazenada na
 * world setting `statusEffects`; seu onChange reconstrói CONFIG.statusEffects
 * ao vivo para todos os clientes. Lista vazia recai nos padrões curados.
 */
import { MARKER_PALETTE, DEFAULT_STATUS_EFFECTS, getStatusEffects } from "../helpers/status-effects.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class StatusEffectsConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "shift-status-effects",
    classes: ["shift-vtt", "status-effects-config"],
    position: { width: 480, height: "auto" },
    window: { title: "SHIFT.Settings.StatusEffects.Name" },
    tag: "form",
    form: {
      handler: StatusEffectsConfig.#onSubmit,
      closeOnSubmit: true
    },
    actions: {
      addRow: StatusEffectsConfig.#onAddRow,
      deleteRow: StatusEffectsConfig.#onDeleteRow,
      pickColor: StatusEffectsConfig.#onPickColor,
      resetDefaults: StatusEffectsConfig.#onReset
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/apps/status-effects-config.hbs" }
  };

  #rows = null;

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    this.#rows ??= getStatusEffects().map(r => ({ ...r }));
    context.rows = this.#rows;
    context.palette = MARKER_PALETTE;
    context.buttons = [
      { type: "submit", icon: "fa-solid fa-save", label: "SHIFT.Common.Confirm" }
    ];
    return context;
  }

  /** Relê os valores atuais dos campos de volta para #rows. Mantido 1:1 com as
   *  linhas renderizadas (sem filtragem aqui) para que o data-index de cada linha
   *  fique alinhado com sua posição no array entre re-renders; linhas em branco
   *  são descartadas apenas no momento de salvar. */
  #readForm() {
    this.#rows = [...this.element.querySelectorAll(".status-row")].map(row => ({
      id: row.dataset.id || foundry.utils.randomID(),
      label: row.querySelector("input[name='label']")?.value ?? "",
      color: row.querySelector("input[name='color']")?.value || MARKER_PALETTE[0]
    }));
  }

  static #onAddRow() {
    this.#readForm();
    this.#rows.push({ id: foundry.utils.randomID(), label: "", color: MARKER_PALETTE[0] });
    this.render();
  }

  static #onDeleteRow(event, target) {
    this.#readForm();
    this.#rows.splice(Number(target.dataset.index), 1);
    this.render();
  }

  static #onPickColor(event, target) {
    this.#readForm();
    const index = Number(target.closest(".status-row")?.dataset.index);
    if (this.#rows[index]) this.#rows[index].color = target.dataset.color;
    this.render();
  }

  static #onReset() {
    // Volta aos defaults. No editor mostramos o label localizado (UX), mas na
    // gravação (#onSubmit) reconvertemos para a CHAVE de locale, de modo que o
    // idioma siga vivo após Reset+Save — getStatusEffects relocaliza a cada leitura.
    this.#rows = DEFAULT_STATUS_EFFECTS.map(s => ({
      id: s.id,
      label: game.i18n.localize(s.label),
      color: s.color
    }));
    this.render();
  }

  static async #onSubmit(event, form, formData) {
    this.#readForm();
    const rows = this.#rows
      .filter(r => r.label?.trim())
      .map(r => ({ ...r, label: StatusEffectsConfig.#defaultKeyFor(r) }));
    await game.settings.set("shift-vtt", "statusEffects", rows);
  }

  /** Se a linha ainda é um default intacto (mesmo id e label igual ao default
   *  localizado), grava a CHAVE de locale ("SHIFT.Status.*") em vez da string
   *  traduzida — assim o idioma não congela. Labels editadas/custom ficam literais. */
  static #defaultKeyFor(row) {
    const def = DEFAULT_STATUS_EFFECTS.find(d => d.id === row.id);
    if (def && row.label?.trim() === game.i18n.localize(def.label)) return def.label;
    return row.label;
  }
}
