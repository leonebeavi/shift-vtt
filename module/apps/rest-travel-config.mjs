/**
 * SHIFT VTT, submenu "Rest & Travel".
 * Agrupa os Building Blocks de Rest e Travel num formulário único (como os
 * submenus de Scale/Ranges): modo de Rest, chave-mestra de Travel, modo de Travel
 * e como o fallback de Core é escolhido quando os suprimentos esgotam. Cada campo
 * lê/grava a sua própria world setting (config:false).
 */
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class RestTravelConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "shift-rest-travel-config",
    classes: ["shift-vtt", "settings-config", "rest-travel-config"],
    position: { width: 480, height: "auto" },
    window: { title: "SHIFT.Settings.RestTravelMenu.Name" },
    tag: "form",
    form: {
      handler: RestTravelConfig.#onSubmit,
      closeOnSubmit: true
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/apps/rest-travel-config.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const get = k => game.settings.get("shift-vtt", k);
    const restMode = get("restMode");
    const travelMode = get("travelMode");
    context.enableTravel = get("enableTravel");
    context.travelRandomCore = get("travelRandomCore");
    context.restModeOptions = Object.entries(CONFIG.SHIFT.restModes)
      .map(([value, label]) => ({ value, label, selected: restMode === value }));
    context.travelModeOptions = Object.entries(CONFIG.SHIFT.travelModes)
      .map(([value, label]) => ({ value, label, selected: travelMode === value }));
    context.buttons = [
      { type: "submit", icon: "fa-solid fa-save", label: "SHIFT.Common.Confirm" }
    ];
    return context;
  }

  static async #onSubmit(event, form, formData) {
    const d = formData.object;
    const restModes = Object.keys(CONFIG.SHIFT.restModes);
    const travelModes = Object.keys(CONFIG.SHIFT.travelModes);
    await game.settings.set("shift-vtt", "restMode", restModes.includes(d.restMode) ? d.restMode : "standard");
    await game.settings.set("shift-vtt", "enableTravel", !!d.enableTravel);
    await game.settings.set("shift-vtt", "travelMode", travelModes.includes(d.travelMode) ? d.travelMode : "simple");
    await game.settings.set("shift-vtt", "travelRandomCore", !!d.travelRandomCore);
  }
}
