/**
 * SHIFT VTT, utilitários compartilhados por todo o sistema.
 * Inclui shims de namespace V12→V14 para que o mesmo código rode em todas
 * as gerações suportadas do Foundry sem quebrar por depreciação.
 */
import { DIE_PROGRESSION } from "../dice/resolution.mjs";

/* ------------------------------------------------------------------ */
/* Shims da API do Foundry                                             */
/* ------------------------------------------------------------------ */

export const fvtt = {
  get renderTemplate() { return foundry.applications.handlebars.renderTemplate; },
  get loadTemplates() { return foundry.applications.handlebars.loadTemplates; },
  get TextEditor() { return foundry.applications.ux.TextEditor.implementation; },
  get ActorsCollection() { return foundry.documents.collections.Actors; },
  get ItemsCollection() { return foundry.documents.collections.Items; },
  get DialogV2() { return foundry.applications.api.DialogV2; }
};

/** Enriquece HTML com segurança em qualquer versão suportada do core. */
export async function enrich(html, options = {}) {
  if (!html) return "";
  try {
    return await fvtt.TextEditor.enrichHTML(html, { async: true, ...options });
  } catch (err) {
    console.warn("shift-vtt | enrichHTML failed", err);
    return html;
  }
}

/* ------------------------------------------------------------------ */
/* Helpers de dados                                                    */
/* ------------------------------------------------------------------ */

// A escada do Shift Die vive no módulo puro de resolution; reexportada aqui
// para que os helpers de dados e seus muitos importadores tenham um único ponto de import.
export { DIE_PROGRESSION };

export function dieIndex(die) {
  return DIE_PROGRESSION.indexOf(die);
}

export function dieLabel(die) {
  if (die === "exhausted") return game.i18n.localize("SHIFT.DiceStatus.exhausted");
  return CONFIG.SHIFT?.diceLabels?.[die] ?? String(die ?? "").toUpperCase();
}

export function dieStatusLabel(key) {
  const k = CONFIG.SHIFT?.diceStatus?.[key];
  return k ? game.i18n.localize(k) : "";
}

/* ------------------------------------------------------------------ */
/* Handlebars                                                          */
/* ------------------------------------------------------------------ */

export function registerHandlebarsHelpers() {
  const H = Handlebars;

  H.registerHelper("shiftEq", (a, b) => a === b);
  H.registerHelper("shiftNeq", (a, b) => a !== b);
  H.registerHelper("shiftAnd", (a, b) => !!(a && b));
  H.registerHelper("shiftOr", (a, b) => !!(a || b));
  H.registerHelper("shiftAdd", (a, b) => (Number(a) || 0) + (Number(b) || 0));
  H.registerHelper("shiftIncludes", (arr, value) => Array.isArray(arr) && arr.includes(value));
  H.registerHelper("shiftSome", (list, prop) => Array.isArray(list) && list.some(e => e?.[prop]));

  H.registerHelper("shiftDieLabel", die => dieLabel(die));
  H.registerHelper("shiftDieStatus", key => dieStatusLabel(key));
  H.registerHelper("shiftLocalizeKey", key => (key ? game.i18n.localize(key) : ""));
  H.registerHelper("shiftTypeLabel", (docName, type) => game.i18n.localize(`TYPES.${docName}.${type}`));
}

/* ------------------------------------------------------------------ */
/* Pré-carga de templates (partials nomeados)                          */
/* ------------------------------------------------------------------ */

export async function preloadTemplates() {
  const load = fvtt.loadTemplates;
  return load({
    "shift.trait-card": "systems/shift-vtt/templates/parts/trait-card.hbs",
    "shift.pill-list": "systems/shift-vtt/templates/parts/pill-list.hbs",
    "shift.party-traits": "systems/shift-vtt/templates/parts/party-trait-tiles.hbs",
    "shift.ptrait-card": "systems/shift-vtt/templates/parts/ptrait-card.hbs",
    "shift.item-source": "systems/shift-vtt/templates/parts/item-source.hbs"
  });
}

/* ------------------------------------------------------------------ */
/* Speaker do chat: nome do User no topo, Actor no card                */
/* ------------------------------------------------------------------ */

export function shiftSpeaker(actor) {
  const speaker = ChatMessage.getSpeaker({ actor });
  speaker.alias = game.user.name;
  return speaker;
}

/* ------------------------------------------------------------------ */
/* Helpers pequenos de UI                                              */
/* ------------------------------------------------------------------ */

/**
 * Renderiza uma lista de "cards" de rádio compartilhada por todo diálogo de
 * seleção de Trait/Actor (imagem do dado/retrato + nome + sub-label opcional).
 * A primeira opção já vem marcada.
 * @param {{value:string,name:string,img?:string,sub?:string,rowClass?:string,subClass?:string}[]} options
 * @param {object} [cfg]
 * @param {string} [cfg.radioName="value"] o atributo name do input de rádio
 * @returns {string} linhas <label> concatenadas
 */
export function pickerRows(options = [], { radioName = "value" } = {}) {
  return options.map((o, i) => {
    const badge = o.img
      ? `<img src="${o.img}" alt=""/>`
      : `<span class="opt-die-badge"><i class="fa-solid fa-xmark"></i></span>`;
    const sub = o.sub
      ? `<span class="opt-die${o.subClass ? ` ${o.subClass}` : ""}">${foundry.utils.escapeHTML(o.sub)}</span>`
      : "";
    // Um pip de Scale quando a opção carrega um override (um Trait cuja Scale
    // difere da do seu dono); exibido mesmo em Scale 1.
    const pip = o.isScaled
      ? `<span class="opt-scale-pip" data-scale="${o.scale ?? 1}" data-tooltip="${foundry.utils.escapeHTML(game.i18n.localize("SHIFT.Trait.Scale"))} ${o.scale ?? 1}">${o.scale ?? 1}</span>`
      : "";
    return `
      <label class="trait-opt${o.rowClass ? ` ${o.rowClass}` : ""}">
        <input type="radio" name="${radioName}" value="${foundry.utils.escapeHTML(String(o.value ?? ""))}" ${i === 0 ? "checked" : ""}/>
        <span class="opt-body">${badge}<span class="opt-name">${foundry.utils.escapeHTML(o.name ?? "")}</span>${sub}${pip}</span>
      </label>`;
  }).join("");
}

/** Abre o FilePicker de imagem do core para um atributo do documento (padrão "img"). */
export function openImagePicker(document, attr = "img") {
  const FP = foundry.applications.apps.FilePicker.implementation;
  const current = foundry.utils.getProperty(document, attr);
  const picker = new FP({
    type: "image",
    current,
    callback: path => document.update({ [attr]: path })
  });
  picker.browse(current);
}

/**
 * Pede ao usuário uma única linha de texto.
 * @returns {Promise<string|null>}
 */
export async function promptText({ title, label, initial = "", placeholder = "" } = {}) {
  const value = foundry.utils.escapeHTML(initial ?? "");
  const ph = foundry.utils.escapeHTML(placeholder ?? "");
  const content = `
    <div class="form-group shift-prompt">
      <label>${foundry.utils.escapeHTML(label ?? "")}</label>
      <input type="text" name="value" value="${value}" placeholder="${ph}" autofocus />
    </div>`;
  try {
    const result = await fvtt.DialogV2.prompt({
      window: { title },
      content,
      rejectClose: false,
      // Pré-seleciona qualquer valor padrão para que digitar o substitua de imediato.
      render: (event, dialog) => {
        const input = dialog?.element?.querySelector?.('input[name="value"]');
        if (input) { input.focus(); input.select(); }
      },
      ok: {
        label: game.i18n.localize("SHIFT.Common.Confirm"),
        callback: (event, button) => button.form.elements.value.value?.trim()
      }
    });
    return result || null;
  } catch (err) {
    return null;
  }
}

/**
 * Escolhe um Trait de uma lista, renderizada como cards bonitos no estilo
 * Action Roll (imagem do dado + nome + uma sub-label de transição). Retorna o
 * valor escolhido.
 * @param {object} cfg
 * @param {string} cfg.title
 * @param {string} [cfg.hint]
 * @param {{value:string,name:string,img?:string,sub?:string}[]} cfg.options
 * @returns {Promise<string|null>}
 */
export async function promptTraitChoice({ title, hint, options = [] } = {}) {
  if (!options.length) return null;
  const rows = pickerRows(options);
  const content = `
    <div class="shift-prompt trait-pick">
      ${hint ? `<p class="hint">${foundry.utils.escapeHTML(hint)}</p>` : ""}
      <div class="trait-opts">${rows}</div>
    </div>`;
  try {
    const result = await fvtt.DialogV2.prompt({
      window: { title },
      position: { width: 360 },
      classes: ["shift-vtt", "shift-dialog"],
      content,
      rejectClose: false,
      ok: {
        label: game.i18n.localize("SHIFT.Common.Confirm"),
        callback: (event, button) => button.form.elements.value.value
      }
    });
    return result || null;
  } catch (err) {
    return null;
  }
}

/**
 * Pede ao usuário que escolha uma opção de uma lista.
 * @param {object} cfg
 * @param {string} cfg.title
 * @param {string} [cfg.hint]
 * @param {{value:string,label:string}[]} cfg.options
 * @returns {Promise<string|null>} o valor escolhido
 */
export async function promptChoice({ title, hint, options = [] } = {}) {
  if (!options.length) return null;

  // Listas curtas viram botões diretos: menos cliques, diálogo mais limpo.
  if (options.length <= 4) {
    try {
      const result = await fvtt.DialogV2.wait({
        window: { title },
        position: { width: 320 },
        classes: ["shift-vtt", "shift-dialog"],
        content: hint ? `<p class="hint shift-prompt-hint">${foundry.utils.escapeHTML(hint)}</p>` : "",
        rejectClose: false,
        buttons: options.map((o, i) => ({
          action: o.value,
          label: o.label,
          default: i === 0
        }))
      });
      return result && result !== "cancel" ? result : null;
    } catch (err) {
      return null;
    }
  }

  // Listas longas: lista de rádio compacta estilizada como botões.
  const opts = options
    .map((o, i) => `
      <label class="choice-row">
        <input type="radio" name="value" value="${foundry.utils.escapeHTML(o.value)}" ${i === 0 ? "checked" : ""}/>
        <span>${foundry.utils.escapeHTML(o.label)}</span>
      </label>`)
    .join("");
  const content = `
    <div class="shift-prompt choice-list">
      ${hint ? `<p class="hint">${foundry.utils.escapeHTML(hint)}</p>` : ""}
      ${opts}
    </div>`;
  try {
    const result = await fvtt.DialogV2.prompt({
      window: { title },
      position: { width: 380 },
      classes: ["shift-vtt", "shift-dialog"],
      content,
      rejectClose: false,
      ok: {
        label: game.i18n.localize("SHIFT.Common.Confirm"),
        callback: (event, button) => button.form.elements.value.value
      }
    });
    return result || null;
  } catch (err) {
    return null;
  }
}
