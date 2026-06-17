/**
 * SHIFT VTT, Item Browser.
 *
 * Um seletor pesquisável que os Players usam ao adicionar Focus Traits,
 * Techniques, Keywords ou Drawbacks. Junta os Items do mundo com todos os
 * compêndios de Item que o mundo enxerga, filtrável por texto, por fonte de
 * Trait e por origem (mundo ou um pack específico). Sempre oferece "Criar novo".
 */
import { promptText } from "../helpers/utils.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class ShiftBrowser extends HandlebarsApplicationMixin(ApplicationV2) {

  /**
   * Abre o browser e resolve com a escolha do usuário.
   * @param {object} opts
   * @param {string[]} opts.types Tipos de Item a listar (ex.: ["trait"]).
   * @param {string} [opts.title]
   * @param {string} [opts.category] Pré-seleciona o filtro de categoria de Trait.
   * @returns {Promise<{doc: Item|null, create: boolean}|null>}
   */
  static pick({ types, title, category } = {}) {
    return new Promise(resolve => {
      new ShiftBrowser({ types, titleText: title, category, resolve }).render(true);
    });
  }

  /**
   * Navega pelos items de Keyword/Drawback (mundo + packs) ou digita um novo;
   * compartilhado pela Actor sheet e pela Trait item sheet para que os dois
   * botões de "adicionar descritor" se comportem de forma idêntica. Quando um
   * descritor existente é escolhido e `host` é um Actor, copia ele (com sua
   * descrição) para o host para que o tooltip da pill e o clicar-para-editar
   * funcionem; para um Trait sem dono (host null), o próprio #ensureDescriptor
   * do documento Trait cria a cópia de apoio a partir do nome retornado.
   * @param {object} opts
   * @param {"keyword"|"drawback"} opts.kind
   * @param {Actor|null} [opts.host] actor onde anexar a cópia do descritor escolhido
   * @param {string} opts.addKey chave i18n para o título do diálogo
   * @param {string} opts.labelKey chave i18n para o rótulo do campo de texto livre
   * @returns {Promise<string|null>} o nome do descritor escolhido, ou null se cancelado
   */
  static async pickDescriptor({ kind, host = null, addKey, labelKey } = {}) {
    const picked = await ShiftBrowser.pick({ types: [kind], title: game.i18n.localize(addKey) });
    if (!picked) return null;
    if (picked.doc) {
      if (host) {
        const match = i => i.type === kind && i.name.toLowerCase() === picked.doc.name.toLowerCase();
        if (!host.items.find(match)) {
          const data = picked.doc.toObject();
          delete data._id;
          try { await host.createEmbeddedDocuments("Item", [data]); } catch (err) { /* sem ação */ }
        }
      }
      return picked.doc.name;
    }
    // Preenche o campo com o nome do tipo ("Keyword" / "Drawback"), pré-selecionado
    // e também mostrado como placeholder, para que confirmar sem digitar ainda
    // crie um descritor em vez de silenciosamente não fazer nada.
    const name = game.i18n.localize(labelKey);
    return promptText({
      title: game.i18n.localize(addKey),
      label: name,
      initial: name,
      placeholder: name
    });
  }

  constructor({ types = [], titleText = "", category = null, resolve } = {}) {
    super();
    this.#types = types;
    this.#titleText = titleText;
    // Filtro de categoria pré-selecionado opcional (Set vazio = mostra toda
    // categoria). Lembrado como "sticky" para refletir a seção de onde o usuário
    // adicionou, mesmo quando ainda não há entrada dessa categoria (ex.: uma
    // lista de Focus recém-criada).
    if (category) {
      this.#categorySel.add(category);
      this.#initialCategory = category;
    }
    this.#resolve = resolve;
  }

  #types;
  #titleText;
  #resolve;
  #initialCategory = null;
  #search = "";
  /** Filtros de seleção múltipla: um Set vazio significa "Todos" (sem restrição)
   *  para aquele grupo. Um chip alterna seu valor; o chip "Todos" limpa o grupo. */
  #categorySel = new Set();
  #sourceSel = new Set();
  #packSel = new Set();
  #entries = null;
  /** Se a escolha inteligente de "padrão para o compêndio do jogo" já rodou uma vez. */
  #packDefaulted = false;
  /** Se a gaveta de filtros está expandida. */
  #filtersOpen = false;

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "shift-browser",
    classes: ["shift-vtt", "browser"],
    position: { width: 460, height: 520 },
    window: { title: "SHIFT.Browser.Title", resizable: true },
    actions: {
      pickEntry: ShiftBrowser.#onPick,
      createNew: ShiftBrowser.#onCreateNew,
      toggleFilters: ShiftBrowser.#onToggleFilters,
      clearFilter: ShiftBrowser.#onClearFilter,
      clearAll: ShiftBrowser.#onClearAll
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/shift-vtt/templates/apps/browser.hbs", scrollable: [".browser-results"] }
  };

  /** @override */
  get title() {
    return this.#titleText || game.i18n.localize("SHIFT.Browser.Title");
  }

  /** Reúne os items do mundo e os índices dos packs uma única vez. */
  async #load() {
    if (this.#entries) return this.#entries;
    const entries = [];

    for (const item of game.items) {
      if (!this.#types.includes(item.type)) continue;
      entries.push({
        uuid: item.uuid,
        name: item.name,
        img: item.img,
        type: item.type,
        source: item.system?.source ?? "",
        category: item.system?.category ?? "",
        die: item.system?.currentDie ?? "",
        origin: "world",
        originLabel: game.i18n.localize("SHIFT.Browser.World")
      });
    }

    const packs = game.packs.filter(p => p.documentName === "Item" && p.visible);
    for (const pack of packs) {
      let index;
      try {
        index = await pack.getIndex({ fields: ["type", "img", "system.source", "system.category", "system.currentDie"] });
      } catch (err) { continue; }
      for (const entry of index) {
        if (!this.#types.includes(entry.type)) continue;
        entries.push({
          uuid: entry.uuid,
          name: entry.name,
          img: entry.img,
          type: entry.type,
          source: entry.system?.source ?? "",
          category: entry.system?.category ?? "",
          die: entry.system?.currentDie ?? "",
          origin: pack.collection,
          originLabel: pack.title
        });
      }
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));
    this.#entries = entries;
    return entries;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const all = await this.#load();

    const sources = [...new Set(all.map(e => e.source).filter(Boolean))].sort();
    const origins = [...new Map(all.map(e => [e.origin, e.originLabel])).entries()]
      .map(([value, label]) => ({ value, label }));

    // Padrão inteligente (uma vez): pré-seleciona o compêndio do sistema embutido
    // (o pack "do jogo") quando ele realmente contém entradas do tipo pedido,
    // para que criar um Trait mostre os presets canônicos primeiro e esconda
    // duplicatas avulsas do mundo. Recai para "Em todo lugar" quando não existe
    // tal pack.
    if (!this.#packDefaulted) {
      this.#packDefaulted = true;
      const systemPack = origins.find(o =>
        o.value.startsWith("shift-vtt.") && all.some(e => e.origin === o.value));
      // Pula o padrão do system-pack quando a categoria sticky da seção não tem
      // entradas lá (ex.: Focus): senão, os Focus Traits do mundo ficariam
      // escondidos atrás de um system pack vazio. Seções que o pack REALMENTE
      // cobre (Core, Special) ainda recaem nele para que os presets canônicos
      // apareçam primeiro.
      const stickyCovered = this.#initialCategory
        ? all.some(e => e.origin === systemPack?.value && e.category === this.#initialCategory)
        : true;
      if (systemPack && stickyCovered) this.#packSel.add(systemPack.value);
    }

    // Filtro de categoria de Trait (só faz sentido ao listar Traits): lista as
    // categorias realmente presentes para o dropdown se manter relevante.
    const showCategories = this.#types.includes("trait");
    const presentCats = new Set(all.map(e => e.category).filter(Boolean));
    // Descarta qualquer categoria selecionada que não tenha entradas
    // correspondentes (ex.: uma pré-seleção obsoleta) para que ela não esvazie a
    // lista silenciosamente; EXCETO a categoria inicial sticky da seção, que
    // permanece selecionada para que o filtro sempre reflita onde o "add" foi
    // clicado (Focus, Pack, …).
    for (const c of this.#categorySel) {
      if (!presentCats.has(c) && c !== this.#initialCategory) this.#categorySel.delete(c);
    }
    // A lista de chips mostra toda categoria presente mais a sticky, para que o
    // filtro pré-selecionado seja renderizado (e removível) mesmo sem entradas ainda.
    const catKeys = new Set(presentCats);
    if (this.#initialCategory) catKeys.add(this.#initialCategory);
    const categories = showCategories
      ? Object.entries(CONFIG.SHIFT.traitCategories)
          .filter(([k]) => catKeys.has(k))
          .map(([value, key]) => ({ value, label: game.i18n.localize(key), active: this.#categorySel.has(value) }))
      : [];

    const needle = this.#search.toLowerCase();
    // Cada grupo é OR-internamente (qualquer valor selecionado casa); grupos são
    // AND-entre-si. Um Set vazio significa que aquele grupo não impõe restrição ("Todos").
    const filtered = all.filter(e =>
      (!needle || e.name.toLowerCase().includes(needle) || e.source.toLowerCase().includes(needle))
      && (!this.#sourceSel.size || this.#sourceSel.has(e.source))
      && (!this.#packSel.size || this.#packSel.has(e.origin))
      && (!this.#categorySel.size || this.#categorySel.has(e.category))
    );

    // Colapsa duplicatas que compartilham tipo + nome entre origens (ex.: um
    // Special Trait presente tanto no mundo quanto no compêndio semeado), para
    // que a mesma entrada nunca apareça duas vezes. Uma cópia do mundo vence uma
    // cópia de pack (as próprias edições do usuário), e o system pack vence packs
    // de terceiros.
    const originRank = e => e.origin === "world" ? 0 : (e.origin.startsWith("shift-vtt.") ? 1 : 2);
    filtered.sort((a, b) => a.name.localeCompare(b.name) || originRank(a) - originRank(b));
    const seen = new Set();
    const results = [];
    for (const e of filtered) {
      const key = `${e.type}::${e.name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(e);
    }

    // Filtros ativos → tokens removíveis (um por valor selecionado). O kind
    // determina a cor do token no CSS (cat = verde, src = amarelo, org = azul).
    const activeFilters = [];
    for (const c of this.#categorySel) {
      const cat = categories.find(x => x.value === c);
      activeFilters.push({ filter: "category", value: c, kind: "cat", label: cat?.label ?? c });
    }
    for (const s of this.#sourceSel) activeFilters.push({ filter: "source", value: s, kind: "src", label: s });
    for (const p of this.#packSel) {
      const org = origins.find(x => x.value === p);
      activeFilters.push({ filter: "pack", value: p, kind: "org", label: org?.label ?? p });
    }

    Object.assign(context, {
      search: this.#search,
      showCategories,
      categories,
      sources: sources.map(s => ({ value: s, label: s, active: this.#sourceSel.has(s) })),
      origins: origins.map(o => ({ value: o.value, label: o.label, active: this.#packSel.has(o.value) })),
      categoryAllActive: !this.#categorySel.size,
      sourceAllActive: !this.#sourceSel.size,
      packAllActive: !this.#packSel.size,
      results: results.slice(0, 200).map(e => ({ ...e, rowColor: ShiftBrowser.#rowColor(e) })),
      total: results.length,
      truncated: results.length > 200,
      filtersOpen: this.#filtersOpen,
      activeFilters,
      activeCount: activeFilters.length
    });
    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender?.(context, options);
    const root = this.element;
    const searchEl = root.querySelector("input[name='search']");
    searchEl?.addEventListener("input", foundry.utils.debounce(ev => {
      this.#search = ev.target.value;
      this.render();
    }, 150));
    // Os filtros são chips de seleção múltipla, não dropdowns: clicar num chip
    // alterna seu valor dentro/fora do grupo; o chip "Todos" (data-value="") o limpa.
    for (const chip of root.querySelectorAll(".bx-chip")) {
      chip.addEventListener("click", ev => {
        const { filter, value } = ev.currentTarget.dataset;
        const set = this.#setFor(filter);
        if (!set) return;
        if (!value) set.clear();
        else if (set.has(value)) set.delete(value);
        else set.add(value);
        this.render();
      });
    }
    if (searchEl && document.activeElement !== searchEl) {
      const v = searchEl.value;
      searchEl.focus();
      searchEl.setSelectionRange(v.length, v.length);
    }
  }

  static async #onPick(event, target) {
    const uuid = target.closest("[data-uuid]")?.dataset.uuid;
    if (!uuid) return;
    const doc = await fromUuid(uuid);
    this.#finish({ doc, create: false });
  }

  static #onCreateNew() {
    this.#finish({ doc: null, create: true });
  }

  static #onToggleFilters() {
    this.#filtersOpen = !this.#filtersOpen;
    this.render();
  }

  /** ✕ num token: remove apenas aquele valor selecionado (o <i> carrega ambos). */
  static #onClearFilter(event, target) {
    const { filter, value } = target.dataset;
    this.#setFor(filter)?.delete(value);
    this.render();
  }

  /** Link "Limpar": reseta todo grupo de filtro (mantém o texto de busca). */
  static #onClearAll() {
    this.#categorySel.clear();
    this.#sourceSel.clear();
    this.#packSel.clear();
    this.render();
  }

  /** O Set de seleção que sustenta um grupo de filtro: "category" | "source" | "pack". */
  #setFor(filter) {
    if (filter === "category") return this.#categorySel;
    if (filter === "source") return this.#sourceSel;
    if (filter === "pack") return this.#packSel;
    return null;
  }

  /**
   * Cor da barra lateral esquerda de uma linha de resultado: a cor do die atual
   * da entrada quando ela é um Trait que carrega um, caso contrário a borda
   * neutra para que Techniques / Keywords / Drawbacks apareçam como linhas comuns.
   * @returns {string} uma referência a custom-property CSS.
   */
  static #rowColor(entry) {
    const DIE = {
      d4: "var(--die-d4)", d6: "var(--die-d6)", d8: "var(--die-d8)",
      d10: "var(--die-d10)", d12: "var(--die-d12)"
    };
    return DIE[entry.die] ?? "var(--shift-border)";
  }

  #finish(result) {
    const resolve = this.#resolve;
    this.#resolve = null;
    this.close();
    resolve?.(result);
  }

  /** @override */
  _onClose(options) {
    super._onClose?.(options);
    this.#resolve?.(null);
    this.#resolve = null;
  }
}
