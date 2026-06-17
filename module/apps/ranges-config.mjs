/**
 * SHIFT VTT, submenu de Distance Ranges.
 * O GM edita as faixas abstratas de distância (rótulo + min/max em unidades da cena) e
 * o que a leitura por hover no canvas mostra (faixa / unidades / ambos). Armazenado nas
 * configurações de mundo `ranges` + `rangeMode`; se vazio, volta aos padrões.
 */
import { getRanges } from "./ranges.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class RangesConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "shift-ranges-config",
    classes: ["shift-vtt", "ranges-config"],
    position: { width: 480, height: "auto" },
    window: { title: "SHIFT.Settings.RangesMenu.Name" },
    tag: "form",
    form: {
      handler: RangesConfig.#onSubmit,
      closeOnSubmit: true
    },
    actions: {
      addRow: RangesConfig.#onAddRow,
      deleteRow: RangesConfig.#onDeleteRow,
      resetDefaults: RangesConfig.#onReset
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/apps/ranges-config.hbs" }
  };

  #rows = null;

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    this.#rows ??= getRanges().map(r => ({ ...r, max: r.max == null ? "" : r.max }));
    context.rows = this.#rows;
    const mode = game.settings.get("shift-vtt", "rangeMode") || "both";
    context.modeOptions = [
      { value: "abstract", label: "SHIFT.Settings.RangesMenu.ModeAbstract", selected: mode === "abstract" },
      { value: "units", label: "SHIFT.Settings.RangesMenu.ModeUnits", selected: mode === "units" },
      { value: "both", label: "SHIFT.Settings.RangesMenu.ModeBoth", selected: mode === "both" }
    ];
    context.unitsLabel = canvas?.scene?.grid?.units || game.i18n.localize("SHIFT.Ranges.Units");
    context.buttons = [
      { type: "submit", icon: "fa-solid fa-save", label: "SHIFT.Common.Confirm" }
    ];
    return context;
  }

  /** Lê de volta as linhas de faixa renderizadas para #rows, para que re-renderizações preservem as edições. */
  #readForm() {
    this.#rows = [...this.element.querySelectorAll(".range-row")].map(row => ({
      label: row.querySelector("input[name='label']")?.value ?? "",
      min: Number(row.querySelector("input[name='min']")?.value) || 0,
      max: row.querySelector("input[name='max']")?.value
    }));
  }

  static #onAddRow() {
    this.#readForm();
    const last = this.#rows[this.#rows.length - 1];
    const min = last ? (Number(last.max) || Number(last.min) || 0) : 0;
    this.#rows.push({ label: "", min, max: "" });
    this.render();
  }

  static #onDeleteRow(event, target) {
    this.#readForm();
    this.#rows.splice(Number(target.dataset.index), 1);
    this.render();
  }

  static #onReset() {
    this.#rows = CONFIG.SHIFT.rangeBands.map(b => ({
      label: game.i18n.localize(b.label),
      min: b.min,
      max: b.max == null ? "" : b.max
    }));
    this.render();
  }

  static async #onSubmit(event, form, formData) {
    this.#readForm();
    const rows = this.#rows
      .filter(r => r.label?.trim())
      .map(r => ({
        label: r.label.trim(),
        min: Number(r.min) || 0,
        max: r.max === "" || r.max == null ? null : Number(r.max)
      }))
      .sort((a, b) => a.min - b.min);
    await game.settings.set("shift-vtt", "ranges", rows);
    const mode = formData.object.rangeMode;
    await game.settings.set("shift-vtt", "rangeMode", ["abstract", "units", "both"].includes(mode) ? mode : "both");
  }
}
