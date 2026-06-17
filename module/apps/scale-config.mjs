/**
 * SHIFT VTT, submenu de regras de Scale.
 * Agrupa as configurações opcionais de Scale (interruptor principal + Scaled Up
 * Technique + gastar XP para Scale Up) em um único formulário, como os submenus de
 * Advancement / Status Effects. Cada campo lê e grava sua própria world setting (config:false).
 */
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class ScaleConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "shift-scale-config",
    classes: ["shift-vtt", "settings-config", "scale-config"],
    position: { width: 480, height: "auto" },
    window: { title: "SHIFT.Settings.ScaleMenu.Name" },
    tag: "form",
    form: {
      handler: ScaleConfig.#onSubmit,
      closeOnSubmit: true
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/apps/scale-config.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const get = k => game.settings.get("shift-vtt", k);
    context.enableScale = get("enableScale");
    context.enableScaledUp = get("enableScaledUp");
    context.enableXpScaleUp = get("enableXpScaleUp");
    context.xpPerScaleStep = get("xpPerScaleStep");
    context.buttons = [
      { type: "submit", icon: "fa-solid fa-save", label: "SHIFT.Common.Confirm" }
    ];
    return context;
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    await game.settings.set("shift-vtt", "enableScale", !!data.enableScale);
    await game.settings.set("shift-vtt", "enableScaledUp", !!data.enableScaledUp);
    await game.settings.set("shift-vtt", "enableXpScaleUp", !!data.enableXpScaleUp);
    await game.settings.set("shift-vtt", "xpPerScaleStep", Math.max(0, Number(data.xpPerScaleStep) || 0));
  }
}
