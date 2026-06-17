/**
 * SHIFT VTT — submenu do Action HUD.
 * Agrupa as configurações do Action HUD por Player em um único formulário (como
 * os submenus de Advancement / Status Effects). Cada campo lê e grava sua própria
 * configuração de cliente (config:false); o onChange de cada uma atualiza a barra.
 */
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class ActionHudConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "shift-action-hud-config",
    classes: ["shift-vtt", "settings-config", "action-hud-config"],
    position: { width: 480, height: "auto" },
    window: { title: "SHIFT.Settings.ActionHudMenu.Name" },
    tag: "form",
    form: {
      handler: ActionHudConfig.#onSubmit,
      closeOnSubmit: true
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/apps/action-hud-config.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const get = k => game.settings.get("shift-vtt", k);
    context.enableActionHud = get("enableActionHud");
    context.hudAlwaysOpen = get("hudAlwaysOpen");
    const trigger = get("hudMenuTrigger");
    context.triggerOptions = [
      { value: "click", label: "SHIFT.Settings.HudMenuTrigger.click", selected: trigger === "click" },
      { value: "hover", label: "SHIFT.Settings.HudMenuTrigger.hover", selected: trigger === "hover" }
    ];
    context.buttons = [
      { type: "submit", icon: "fa-solid fa-save", label: "SHIFT.Common.Confirm" }
    ];
    return context;
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    // configurações config:false ainda disparam onChange no set(), então a barra atualiza.
    await game.settings.set("shift-vtt", "enableActionHud", !!data.enableActionHud);
    await game.settings.set("shift-vtt", "hudAlwaysOpen", !!data.hudAlwaysOpen);
    await game.settings.set("shift-vtt", "hudMenuTrigger", data.hudMenuTrigger === "hover" ? "hover" : "click");
  }
}
