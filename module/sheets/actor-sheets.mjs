/**
 * SHIFT VTT, fichas de Actor concretas.
 */
import { BaseShiftActorSheet } from "./base-actor-sheet.mjs";
import { getAdvancements } from "../apps/advancement-config.mjs";
import { enrich, dieLabel, dieStatusLabel, fvtt } from "../helpers/utils.mjs";
import { requestPlayerRoll } from "../helpers/socket.mjs";

const T = "systems/shift-vtt/templates";

/* ------------------------------------------------------------------ */
/* Character                                                           */
/* ------------------------------------------------------------------ */


export class ShiftCharacterSheet extends BaseShiftActorSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["character"],
    position: { width: 720, height: 820 }
  };

  /** @override */
  static PARTS = {
    header: { template: `${T}/actor/character-header.hbs` },
    traits: { template: `${T}/actor/actor-traits.hbs`, scrollable: [""] },
    techniques: { template: `${T}/actor/character-techniques.hbs`, scrollable: [""] },
    biography: { template: `${T}/actor/biography.hbs`, scrollable: [""] }
  };

  /** @override */
  get traitGroupSpec() {
    return [
      { key: "core", label: "SHIFT.Groups.Core", categories: ["core"], css: "grid-3 core-group", create: "core" },
      { key: "focus", label: "SHIFT.Groups.Focus", categories: ["focus", "adversary"], css: "grid-2", create: "focus" },
      { key: "pack", label: "SHIFT.Groups.Pack", categories: ["pack", "cargo"], css: "grid-1 pack-group", create: "pack" },
      { key: "other", label: "SHIFT.Groups.Other", categories: ["attitude", "special", "custom"], css: "grid-2", create: "custom", hideEmpty: true }
    ];
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const xp = this.document.system.xp?.value ?? 0;
    context.xpLimit = game.settings.get("shift-vtt", "xpPerSessionLimit");
    context.advancements = getAdvancements().map(a => ({
      label: a.label, cost: a.cost, affordable: xp >= a.cost
    }));
    context.hasXp = xp > 0;
    const session = this.document.system.xp?.session ?? 0;
    context.xpDots = Array.from({ length: context.xpLimit }, (_, i) => ({ on: i < session }));
    context.tabs = this._visibleTabs([
      { id: "traits", label: "SHIFT.Tabs.Traits", icon: "fa-dice-d20" },
      { id: "techniques", label: "SHIFT.Tabs.Techniques", icon: "fa-wand-sparkles" },
      { id: "biography", label: "SHIFT.Tabs.Notes", icon: "fa-book-open" }
    ]);
    return context;
  }
}

/* ------------------------------------------------------------------ */
/* Adversary                                                           */
/* ------------------------------------------------------------------ */

export class ShiftAdversarySheet extends BaseShiftActorSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["adversary"],
    position: { width: 660, height: 760 }
  };

  /** @override */
  static PARTS = {
    header: { template: `${T}/actor/adversary-header.hbs` },
    traits: { template: `${T}/actor/actor-traits.hbs`, scrollable: [""] },
    biography: { template: `${T}/actor/biography.hbs`, scrollable: [""] }
  };

  /** @override */
  get traitGroupSpec() {
    return [
      { key: "attitude", label: "SHIFT.Groups.Attitude", categories: ["attitude"], css: "grid-1 attitude-group", create: "attitude" },
      { key: "traits", label: "SHIFT.Groups.AdversaryTraits", categories: ["core", "focus", "adversary", "pack", "cargo", "custom"], css: "grid-2", create: "adversary" },
      { key: "special", label: "SHIFT.Groups.Special", categories: ["special"], css: "grid-1 special-group", create: "special" }
    ];
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sys = this.document.system;
    context.derived = {
      defeat: sys.defeat ?? { value: 0, max: sys.power ?? 1 },
      actions: sys.actions ?? sys.power ?? 1,
      traitLimit: sys.traitLimit ?? (sys.power ?? 1) + 2,
      traitCount: sys.traitCount ?? 0,
      overcome: sys.overcome ?? false,
      blockedBy: sys.blockedBy ?? [],
      defeatPct: Math.min(100, Math.round(((sys.defeat?.value ?? 0) / Math.max(1, sys.defeat?.max ?? 1)) * 100))
    };
    context.tabs = this._visibleTabs([
      { id: "traits", label: "SHIFT.Tabs.Traits", icon: "fa-dice-d20" },
      { id: "biography", label: "SHIFT.Tabs.Notes", icon: "fa-book-open" }
    ]);
    return context;
  }
}

/* ------------------------------------------------------------------ */
/* Vehicle                                                             */
/* ------------------------------------------------------------------ */

export class ShiftVehicleSheet extends BaseShiftActorSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["vehicle"],
    position: { width: 680, height: 740 },
    actions: {
      removeCrew: ShiftVehicleSheet.#onRemoveCrew
    }
  };

  /** @override */
  static PARTS = {
    header: { template: `${T}/actor/vehicle-header.hbs` },
    traits: { template: `${T}/actor/actor-traits.hbs`, scrollable: [""] },
    biography: { template: `${T}/actor/biography.hbs`, scrollable: [""] }
  };

  /** @override */
  get traitGroupSpec() {
    return [
      { key: "core", label: "SHIFT.Groups.Core", categories: ["core"], css: "grid-3 core-group", create: "core" },
      { key: "focus", label: "SHIFT.Groups.Focus", categories: ["focus", "adversary", "custom", "attitude", "special"], css: "grid-2", create: "focus" },
      { key: "cargo", label: "SHIFT.Groups.Cargo", categories: ["cargo", "pack"], css: "grid-1 pack-group", create: "cargo" }
    ];
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.typeLabel = game.i18n.localize("TYPES.Actor.vehicle");
    context.crew = [];
    for (const uuid of this.document.system.crew ?? []) {
      const a = await fromUuid(uuid);
      if (a) context.crew.push({ uuid, name: a.name, img: a.img });
    }
    context.tabs = this._visibleTabs([
      { id: "traits", label: "SHIFT.Tabs.Traits", icon: "fa-dice-d20" },
      { id: "biography", label: "SHIFT.Tabs.Notes", icon: "fa-book-open" }
    ]);
    return context;
  }

  /** Solta um Actor sobre o Vehicle para adicioná-lo à crew. */
  async _onDropActor(event, actor) {
    if (!this.isEditable) return false;
    // O V14 passa o Actor já resolvido (`_onDropActor(event, actor)`); tolera um
    // payload bruto de drag-data para cores mais antigos / drops programáticos.
    if (!(actor instanceof Actor)) actor = await Actor.implementation.fromDropData(actor);
    if (!actor || actor.type === "vehicle") return false;
    const crew = [...(this.document.system.crew ?? [])];
    if (crew.includes(actor.uuid)) return false;
    crew.push(actor.uuid);
    await this.document.update({ "system.crew": crew });
    ui.notifications.info(game.i18n.format("SHIFT.Vehicle.CrewAdded", {
      actor: actor.name, vehicle: this.document.name
    }));
    return true;
  }

  /** Remove um membro da crew (data-action="removeCrew"). */
  static async #onRemoveCrew(event, target) {
    const uuid = target.closest("[data-crew-uuid]")?.dataset.crewUuid;
    if (!uuid) return;
    const crew = (this.document.system.crew ?? []).filter(u => u !== uuid);
    await this.document.update({ "system.crew": crew });
  }
}


/* ------------------------------------------------------------------ */
/* Location                                                            */
/* ------------------------------------------------------------------ */

export class ShiftLocationSheet extends BaseShiftActorSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["location"],
    position: { width: 680, height: 720 },
    actions: {
      toggleLandmarkSafe: ShiftLocationSheet.#onToggleLandmarkSafe,
      openNpc: ShiftLocationSheet.#onOpenNpc,
      removeNpc: ShiftLocationSheet.#onRemoveNpc
    }
  };

  /** @override */
  static PARTS = {
    header: { template: `${T}/actor/location-header.hbs` },
    traits: { template: `${T}/actor/actor-traits.hbs`, scrollable: [""] },
    landmarks: { template: `${T}/actor/location-landmarks.hbs`, scrollable: [""] },
    npcs: { template: `${T}/actor/location-npcs.hbs`, scrollable: [""] },
    biography: { template: `${T}/actor/biography.hbs`, scrollable: [""] }
  };

  /** @override
   *  Pelas regras, Locations têm Attitude, Wealth e Security, além de
   *  pelo menos um Focus Trait único. */
  get traitGroupSpec() {
    return [
      { key: "attitude", label: "SHIFT.Groups.Attitude", categories: ["attitude"], css: "grid-1 attitude-group", create: "attitude" },
      { key: "core", label: "SHIFT.Groups.LocationCore", categories: ["core"], css: "grid-2 core-group", create: "core" },
      { key: "focus", label: "SHIFT.Groups.Focus", categories: ["focus", "adversary", "custom", "pack", "cargo", "special"], css: "grid-2", create: "focus" }
    ];
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.typeLabel = game.i18n.localize("TYPES.Actor.location");
    context.landmarks = await this.#prepareLandmarks();
    context.npcs = await this.#prepareNpcs();
    context.tabs = this._visibleTabs([
      { id: "traits", label: "SHIFT.Tabs.Traits", icon: "fa-dice-d20" },
      { id: "landmarks", label: "SHIFT.Location.Landmarks", icon: "fa-map-location-dot" },
      { id: "npcs", label: "SHIFT.Location.NPCs", icon: "fa-users" },
      { id: "biography", label: "SHIFT.Tabs.Notes", icon: "fa-book-open" }
    ]);
    return context;
  }

  /** Landmark Items, apresentados como a lista de Techniques (cards expansíveis). */
  async #prepareLandmarks() {
    const out = [];
    const landmarks = this.document.items
      .filter(i => i.type === "landmark")
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name));
    for (const l of landmarks) {
      const expanded = this._isExpanded(l.id);
      out.push({
        id: l.id,
        name: l.name,
        img: l.img,
        safe: l.system.safe,
        source: l.system.source,
        expanded,
        enrichedDescription: (expanded && this.canViewNotes)
          ? await enrich(l.system.description, { rollData: this.document.getRollData?.() ?? {}, relativeTo: l })
          : null
      });
    }
    return out;
  }

  /** Resolve os UUIDs dos NPCs em dados de card, descartando os que já não existem. */
  async #prepareNpcs() {
    const out = [];
    for (const uuid of this.document.system.npcs ?? []) {
      const a = await fromUuid(uuid);
      if (a) out.push({ uuid, name: a.name, img: a.img, typeLabel: game.i18n.localize(`TYPES.Actor.${a.type}`) });
    }
    return out;
  }

  static async #onToggleLandmarkSafe(event, target) {
    const item = this.getItem(target);
    if (item?.type === "landmark") await item.update({ "system.safe": !item.system.safe });
  }

  /** Solta um Actor sobre a Location para fixá-lo como um NPC. */
  async _onDropActor(event, actor) {
    if (!this.isEditable) return false;
    if (!(actor instanceof Actor)) actor = await Actor.implementation.fromDropData(actor);
    if (!actor || actor.uuid === this.document.uuid) return false;
    const npcs = [...(this.document.system.npcs ?? [])];
    if (npcs.includes(actor.uuid)) return false;
    npcs.push(actor.uuid);
    await this.document.update({ "system.npcs": npcs });
    ui.notifications.info(game.i18n.format("SHIFT.Location.NpcAdded", {
      actor: actor.name, location: this.document.name
    }));
    return true;
  }

  static async #onOpenNpc(event, target) {
    const uuid = target.closest("[data-npc-uuid]")?.dataset.npcUuid;
    if (!uuid) return;
    const actor = await fromUuid(uuid);
    actor?.sheet?.render(true);
  }

  static async #onRemoveNpc(event, target) {
    const uuid = target.closest("[data-npc-uuid]")?.dataset.npcUuid;
    if (!uuid) return;
    const npcs = (this.document.system.npcs ?? []).filter(u => u !== uuid);
    await this.document.update({ "system.npcs": npcs });
  }
}


/* ------------------------------------------------------------------ */
/* Party                                                              */
/* ------------------------------------------------------------------ */

/** Mapeia o "role" de uma entrada do Codex → agrupamento (filtro), cor, ícone e
 *  uma chave de label do role. O role do Actor é guiado pela DISPOSITION: HOSTILE
 *  → um nível de inimigo por Power; FRIENDLY → ally; NEUTRAL ou SECRET → npc.
 *  Locations/vehicles/items ganham seus próprios grupos para que o codex possa ser
 *  navegado pelo que a coisa É. */
const ROLE_GROUP = {
  boss: "enemy", elite: "enemy", minion: "enemy", foe: "enemy",
  ally: "ally", npc: "npc", place: "place", vehicle: "vehicle", trait: "trait", technique: "technique"
};
const ROLE_ICONS = {
  boss: "fa-skull", elite: "fa-fire", minion: "fa-paw", foe: "fa-skull",
  ally: "fa-handshake", npc: "fa-user", place: "fa-map-location-dot", vehicle: "fa-car-side",
  trait: "fa-dice-d20", technique: "fa-bolt"
};
const ROLE_COLORS = {
  boss: "#de2b54", elite: "#f07d39", minion: "#ffc511", foe: "#de2b54",
  ally: "#45c465", npc: "#2f9fd0", place: "#ffce4a", vehicle: "#5b8def", trait: "#a06bff", technique: "#23bda6"
};
const ROLE_LABEL = {
  boss: "SHIFT.Party.Codex.Role.Boss", elite: "SHIFT.Party.Codex.Role.Elite",
  minion: "SHIFT.Party.Codex.Role.Minion", foe: "SHIFT.Party.Codex.Role.Foe",
  ally: "SHIFT.Party.Codex.Role.Ally", npc: "SHIFT.Party.Codex.Role.NPC",
  place: "SHIFT.Party.Codex.Role.Place", vehicle: "SHIFT.Party.Codex.Role.Vehicle",
  trait: "SHIFT.Party.Codex.Role.Trait", technique: "SHIFT.Party.Codex.Role.Technique"
};
/** id do filtro → os grupos que ele casa (null = todos). Grupos vazios são
 *  ocultados na renderização (ver #codexContext), então só aparecem categorias
 *  com conteúdo. */
const CODEX_FILTERS = {
  all: null, enemy: ["enemy"], ally: ["ally"], npc: ["npc"], place: ["place"],
  trait: ["trait"], technique: ["technique"], vehicle: ["vehicle"]
};
/** Botões de filtro ordenados (chaves de label). `all` sempre aparece; os demais
 *  só quando o grupo deles tem ao menos uma entrada. */
const CODEX_FILTER_BUTTONS = [
  { id: "all", label: "SHIFT.Party.Codex.All", group: null },
  { id: "enemy", label: "SHIFT.Party.Codex.Enemies", group: "enemy" },
  { id: "ally", label: "SHIFT.Party.Codex.Allies", group: "ally" },
  { id: "npc", label: "SHIFT.Party.Codex.NPCs", group: "npc" },
  { id: "place", label: "SHIFT.Party.Codex.Places", group: "place" },
  { id: "vehicle", label: "SHIFT.Party.Codex.Vehicles", group: "vehicle" },
  { id: "trait", label: "SHIFT.Party.Codex.Traits", group: "trait" },
  { id: "technique", label: "SHIFT.Party.Codex.Techniques", group: "technique" }
];
/** As sete flags de reveal por campo, em ordem de exibição (fonte única de verdade). */
const REVEAL_FIELDS = ["name", "concept", "stats", "defeat", "traits", "scale", "note"];

const PARTY_TRAIT_ORDER = ["core", "attitude", "focus", "adversary", "pack", "cargo", "special", "party", "custom"];

/** Chips de link de Quest por TIPO de documento: [ícone FA, cor]. Sem foto — só
 *  ícone num círculo da cor do tipo (estilo do design). Character e Adversary NÃO
 *  entram aqui: variam pela DISPOSITION do token (ver linkChipMeta). */
const LINK_TYPE_META = {
  // Actors
  location: ["fa-location-dot", "#e0a458"],
  vehicle: ["fa-car-side", "#5fb6bd"],
  party: ["fa-users", "#7aa2f7"],
  // Items
  technique: ["fa-bolt", "#c98bff"],
  landmark: ["fa-location-dot", "#e0a458"],          // mesmo ícone/cor de Location
  keyword: ["fa-tag", "#2f9fd0"],                    // cor padrão da pill de Keyword (azul)
  drawback: ["fa-triangle-exclamation", "#de2b54"]   // cor padrão da pill de Drawback (vermelho)
};

/** Resolve [ícone, cor] do chip de um doc vinculado. Characters e Adversaries
 *  variam pela disposition (hostile = caveira vermelha, friendly = pessoa verde,
 *  neutral/secret = pessoa azul); os demais Actors e os Items usam LINK_TYPE_META. */
function linkChipMeta(doc) {
  if (doc.documentName === "Actor") {
    if (doc.type === "character" || doc.type === "adversary") {
      const D = CONST.TOKEN_DISPOSITIONS;
      const disp = doc.prototypeToken?.disposition ?? D.NEUTRAL;
      if (disp === D.HOSTILE) return ["fa-skull", "#e5616b"];
      if (disp === D.FRIENDLY) return ["fa-user", "#6fd69a"];
      return ["fa-user", "#7aa2f7"];                 // Neutral ou Secret
    }
    return LINK_TYPE_META[doc.type] ?? ["fa-user", "#7aa2f7"];
  }
  return LINK_TYPE_META[doc.type] ?? ["fa-gem", "#c98bff"];
}

const cap = s => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);

/** Deriva um role do Codex a partir de um documento referenciado. Items separam
 *  trait↔technique; locations e vehicles ganham seus próprios roles; actors são
 *  guiados pela disposition: HOSTILE → um nível de inimigo por Power; FRIENDLY →
 *  ally; NEUTRAL ou SECRET → npc. */
function deriveCodexRole(doc) {
  if (doc instanceof Item) return doc.type === "technique" ? "technique" : "trait";
  if (doc?.type === "location") return "place";
  if (doc?.type === "vehicle") return "vehicle";
  const D = CONST.TOKEN_DISPOSITIONS;
  const disp = doc?.prototypeToken?.disposition ?? doc?.token?.disposition ?? null;
  if (disp === D.HOSTILE) {
    const p = doc.system?.power ?? 0;
    return p >= 5 ? "boss" : p >= 3 ? "elite" : p >= 1 ? "minion" : "foe";
  }
  if (disp === D.FRIENDLY) return "ally";
  return "npc"; // NEUTRAL / SECRET / não definido
}

/** O "kind" do codex; seleciona o layout de card/detalhe por tipo no template. */
function codexKind(doc) {
  if (doc instanceof Item) return doc.type === "technique" ? "technique" : "trait";
  if (doc?.type === "location") return "location";
  if (doc?.type === "vehicle") return "vehicle";
  return "actor"; // character / adversary
}

function byTraitOrder(a, b) {
  const ai = PARTY_TRAIT_ORDER.indexOf(a.system.category);
  const bi = PARTY_TRAIT_ORDER.indexOf(b.system.category);
  return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
    || (a.sort ?? 0) - (b.sort ?? 0)
    || a.name.localeCompare(b.name);
}

/**
 * A ficha do Party, um "menu de grupo" de quatro abas: Roster (membros + Vehicle
 * ativo), Traits (os Trait items de status compartilhados do próprio party), Codex
 * (um bestiário por tipo de Actors E Items conhecidos, com reveal por campo do GM
 * + Field Notes compartilhadas dos Players) e Quests (metas com clock de dado e
 * links). Construída sobre BaseShiftActorSheet para que a aba Traits reaproveite
 * de graça toda a maquinaria de Trait (roll/shift/keywords).
 */
export class ShiftPartySheet extends BaseShiftActorSheet {

  /** Filtro/busca/abertura do Codex + tile de trait aberto são estado de view transitório. */
  _codexFilter = "all";
  _codexQuery = "";
  _codexOpen = null;
  _openTile = null;
  /** Guarda de reentrância para a criação lazy do journal de codex no lado do GM. */
  #ensuringJournal = false;
  /** Quests-mãe com as filhas RECOLHIDAS (ids). Estado de view transitório. */
  #questCollapsed = new Set();
  /** Quests com o corpo INVERTIDO do padrão de abertura (clique do usuário). O
   *  default é: topo ou com filhas = expandida; filha-folha = compacta. */
  #questFlipped = new Set();

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["party"],
    position: { width: 900, height: 784 },
    actions: {
      removeMember: ShiftPartySheet.#onRemoveMember,
      openMember: ShiftPartySheet.#onOpenMember,
      toggleTile: ShiftPartySheet.#onToggleTile,
      codexFilter: ShiftPartySheet.#onCodexFilter,
      openCodexEntry: ShiftPartySheet.#onOpenCodexEntry,
      codexBack: ShiftPartySheet.#onCodexBack,
      removeCodexEntry: ShiftPartySheet.#onRemoveCodexEntry,
      toggleCodexReveal: ShiftPartySheet.#onToggleCodexReveal,
      toggleCodexLandmark: ShiftPartySheet.#onToggleCodexLandmark,
      toggleTraitHide: ShiftPartySheet.#onToggleTraitHide,
      rollQuest: ShiftPartySheet.#onRollQuest,
      questResolve: ShiftPartySheet.#onQuestResolve,
      questFail: ShiftPartySheet.#onQuestFail,
      questReopen: ShiftPartySheet.#onQuestReopen,
      toggleQuestKids: ShiftPartySheet.#onToggleQuestKids,
      toggleQuestBody: ShiftPartySheet.#onToggleQuestBody,
      openQuestLink: ShiftPartySheet.#onOpenQuestLink,
      removeQuestLink: ShiftPartySheet.#onRemoveQuestLink,
      clearLocation: ShiftPartySheet.#onClearLocation,
      openLocation: ShiftPartySheet.#onOpenLocation,
      clearVehicle: ShiftPartySheet.#onClearVehicle,
      grantPartyXp: ShiftPartySheet.#onGrantPartyXp,
      requestPartyRoll: ShiftPartySheet.#onRequestRoll,
      partySafeRest: ShiftPartySheet.#onPartySafeRest,
      partyUnsafeRest: ShiftPartySheet.#onPartyUnsafeRest
    }
  };

  /** @override — um PART por aba; Traits reaproveita o template de trait compartilhado. */
  static PARTS = {
    header: { template: `${T}/actor/party-header.hbs` },
    roster: { template: `${T}/actor/party-roster.hbs`, scrollable: [".party-roster"] },
    traits: { template: `${T}/actor/party-traits.hbs`, scrollable: [".party-traits-page"] },
    codex: { template: `${T}/actor/party-codex.hbs`, scrollable: [".codex-grid", ".cd-body"] },
    quests: { template: `${T}/actor/party-quests.hbs`, scrollable: [".party-quests"] }
  };

  tabGroups = { primary: "roster" };

  /** @override — só os Traits PRÓPRIOS do party (aba Traits). As Quests agora são
   *  um tipo de Item próprio (não Traits): a aba Quests é montada à parte, a partir
   *  de `actor.quests`, em #questGroup (compartilha o card .ptrait + o motor do clock). */
  get traitGroupSpec() {
    return [
      { key: "party", label: "SHIFT.Groups.PartyTraits", categories: ["party"], css: "grid-2", create: "party" }
    ];
  }

  /** @override — o core fixa a action "tab" em `_onClickTab` → `changeTab`, que
   *  consulta `.tabs [data-group][data-tab]` e LANÇA erro para a nossa nav
   *  `.party-tabs` (ela não tem um ancestral `.tabs`). Em vez disso, faz a troca de
   *  aba com um re-render simples; cada seção condiciona a visibilidade ao `activeTab`. */
  _onClickTab(event) {
    const tab = event.target.closest("[data-tab]")?.dataset.tab;
    if (!tab || tab === this.tabGroups.primary) return;
    this.tabGroups.primary = tab;
    this.render();
  }

  /* ---------------------------------------------------------------- */
  /* Context                                                          */
  /* ---------------------------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sys = this.document.system;

    context.members = await this.#rosterContext();

    // Os Party Traits renderizam cards ".ptrait" ricos; enriquece cada description
    // para aparecer junto das pills de keyword/drawback (a base só enriquece ao
    // expandir). Também marca `hidden` (o estado de ocultar por card do GM).
    const allGroups = context.traitGroups ?? [];
    for (const g of allGroups) {
      for (const t of g.traits) {
        const item = this.document.items.get(t.id);
        t.desc = (this.canViewNotes && item?.system.description)
          ? await enrich(item.system.description, { relativeTo: item }) : "";
        t.hidden = !item?.system.revealed;     // toggle de ocultar do GM (olho no card)
      }
    }
    context.traitGroups = allGroups.filter(g => g.key === "party");
    // A aba Quests é montada a partir de actor.quests (tipo próprio), não dos Traits.
    context.questGroup = await this.#questGroup();

    const codex = await this.#codexContext();
    context.codex = codex.cards;
    context.codexDetail = await this.#codexDetailContext();
    context.codexFilter = this._codexFilter;
    context.codexQuery = this._codexQuery;
    // Só categorias que realmente contêm entradas ganham um botão de filtro.
    context.codexFilters = CODEX_FILTER_BUTTONS.filter(
      b => b.group === null || (codex.counts[b.group] ?? 0) > 0);

    context.locationInfo = await this.#locationContext();
    context.activeVehicle = await this.#vehicleContext();

    context.memberCount = context.members.length;
    context.codexCount = (sys.codex ?? []).length;
    const questCount = context.questGroup?.traits?.length ?? 0;
    context.tabs = [
      { id: "roster", label: "SHIFT.Tabs.Roster", icon: "fa-users", badge: context.memberCount },
      { id: "traits", label: "SHIFT.Tabs.Traits", icon: "fa-dice-d20", badge: context.traitGroups?.[0]?.traits?.length ?? 0 },
      { id: "codex", label: "SHIFT.Tabs.Codex", icon: "fa-book-skull", badge: context.codexCount },
      { id: "quests", label: "SHIFT.Tabs.Quests", icon: "fa-scroll", badge: questCount }
    ];
    return context;
  }

  /* --- Roster --------------------------------------------------- */

  async #rosterContext() {
    const out = [];
    for (const member of this.document.partyMembers) {
      const canView = member.testUserPermission(game.user, "OBSERVER");
      const traits = await Promise.all(member.items.filter(i => i.type === "trait").sort(byTraitOrder)
        .map(t => this.#traitTile(t, member, canView, member.uuid)));
      out.push({
        uuid: member.uuid, id: member.id, name: member.name, img: member.img,
        typeLabel: game.i18n.localize(`TYPES.Actor.${member.type}`),
        traits, hasTraits: traits.length > 0
      });
    }
    return out;
  }

  /** Monta um "tile" de Trait (dado + nome + status + description + detalhe de
   *  keyword/drawback). O drawer expandido também mostra a description enriquecida. */
  async #traitTile(t, host, canView, ownerUuid) {
    const sys = t.system;
    const keywords = sys.features?.usesKeywords ? this.#descriptors("keyword", sys.keywords, host, canView) : [];
    const drawbacks = sys.features?.usesDrawbacks ? this.#descriptors("drawback", sys.drawbacks, host, canView) : [];
    const desc = (canView && sys.description) ? await enrich(sys.description, { relativeTo: t }) : "";
    const hasDetail = !!desc || (keywords.length + drawbacks.length > 0);
    return {
      id: t.id, name: t.name, statusKey: t.statusKey,
      dieImg: CONFIG.SHIFT.diceImages[t.statusKey] ?? null,
      statusLabel: dieStatusLabel(t.statusKey),
      maxLabel: dieLabel(sys.maxDie),
      exhausted: sys.exhausted,
      desc, keywords, drawbacks, hasDetail,
      kw: keywords.length, db: drawbacks.length,
      open: hasDetail && ownerUuid && this._openTile === `${ownerUuid}::${t.id}`
    };
  }

  /** Resolve nomes de Keyword/Drawback em {name, desc} (desc condicionada a OBSERVER). */
  #descriptors(kind, names, host, canView) {
    return (names ?? []).map(text => {
      const match = i => i.type === kind && i.name.toLowerCase() === String(text).toLowerCase();
      // host é um Actor para traits de member/codex-actor, mas um Item avulso
      // numa entrada de codex de relíquia; Items não têm `.items`, então protege
      // com guard + faz fallback.
      const item = host?.items?.find?.(match) ?? game.items.find(match) ?? null;
      let desc = "";
      if (canView && item?.system.description) {
        const parsed = new DOMParser().parseFromString(item.system.description, "text/html");
        desc = (parsed.body.textContent ?? "").trim().slice(0, 240);
      }
      return { name: text, desc };
    });
  }

  /* --- Quests (tipo próprio; card .ptrait compartilhado) ----------- */

  /** Monta o grupo da aba Quests a partir de `actor.quests`, como uma ÁRVORE: as
   *  filhas (system.parentId) aninham sob a mãe, achatadas em ordem DFS com `depth`
   *  para a indentação. Mãe oculta/inexistente → a filha sobe pro topo. */
  async #questGroup() {
    const isOwner = this.document.isOwner;
    const canSee = q => q.system.revealed || game.user.isGM || isOwner;
    const all = this.document.quests.filter(canSee);
    const ids = new Set(all.map(q => q.id));
    const byParent = new Map();           // parentId ("" = topo) -> [quests]
    for (const q of all) {
      const pid = (q.system.parentId && ids.has(q.system.parentId)) ? q.system.parentId : "";
      (byParent.get(pid) ?? byParent.set(pid, []).get(pid)).push(q);
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name));
    }
    const traits = [];
    const seen = new Set();
    // Marca uma subárvore inteira como vista SEM renderizar (mãe recolhida): assim
    // as filhas somem de fato e o fallback de órfãs abaixo não as ressuscita no topo.
    const hideSubtree = (parentId) => {
      for (const q of (byParent.get(parentId) ?? [])) {
        if (seen.has(q.id)) continue;
        seen.add(q.id);
        hideSubtree(q.id);
      }
    };
    const walk = async (parentId, depth) => {
      const sibs = byParent.get(parentId) ?? [];
      for (let i = 0; i < sibs.length; i++) {
        const q = sibs[i];
        if (seen.has(q.id)) continue;     // proteção contra ciclo
        seen.add(q.id);
        const ctx = await this.#questContext(q, depth);
        ctx.firstSub = i === 0;           // 1ª filha do grupo: conector não emenda pra cima (não toca a mãe)
        traits.push(ctx);
        // Mãe recolhida: esconde a subárvore (marca como vista, não renderiza).
        if (this.#questCollapsed.has(q.id)) hideSubtree(q.id);
        else await walk(q.id, depth + 1);
      }
    };
    await walk("", 0);
    // Qualquer quest presa num ciclo (não visitada) entra no topo, pra não sumir.
    for (const q of all) if (!seen.has(q.id)) { seen.add(q.id); traits.push(await this.#questContext(q, 0)); }
    return { key: "quest", traits };
  }

  /** Contexto de um card de Quest: clock + desfecho + links + hierarquia (depth/
   *  progresso das filhas). `depth` = nível de indentação na árvore. */
  async #questContext(q, depth = 0) {
    const sys = q.system;
    const outcome = q.questOutcome;          // "none" | "success" | "failure"
    const resolved = q.isResolved;
    const locked = q.isLocked;               // pré-requisitos pendentes
    const pending = q.pendingRequirements.map(r => r.name);
    // Progresso das sub-quests (filhas resolvidas / total).
    const children = q.childQuests;
    const childTotal = children.length;
    const childDone = children.filter(c => c.isResolved).length;
    // Padrão de abertura: topo (depth 0) ou quest COM filhas abre expandida; uma
    // filha-folha nasce compacta. O clique do usuário inverte esse default.
    const defaultExpanded = depth === 0 || childTotal > 0;
    const expanded = this.#questFlipped.has(q.id) ? !defaultExpanded : defaultExpanded;
    // Botões de desfecho: mostra Resolve a menos que já success, Fail a menos que
    // já failure, Reopen quando resolvida. Travada não resolve.
    const canResolve = !locked && outcome !== "success";
    const canFail = !locked && outcome !== "failure";
    const canReopen = resolved;
    const desc = (this.canViewNotes && sys.description)
      ? await enrich(sys.description, { relativeTo: q }) : "";
    // Resolve os UUIDs dos links em chips POR TIPO (ícone + cor, sem foto, no
    // estilo do design); descarta os quebrados.
    const linkDocs = await Promise.all((sys.links ?? []).map(u => fromUuid(u).catch(() => null)));
    const links = (sys.links ?? []).map((uuid, i) => {
      const doc = linkDocs[i];
      if (!doc) return null;
      const [icon, color] = linkChipMeta(doc);
      return { uuid, name: doc.name, icon, color };
    }).filter(Boolean);
    return {
      id: q.id, name: q.name,
      links,
      // Hierarquia: indentação + progresso das sub-quests na mãe + recolher filhas.
      depth,
      hasChildren: childTotal > 0,
      progressDone: childDone,
      progressTotal: childTotal,
      kidsCollapsed: this.#questCollapsed.has(q.id),
      // Compacto: corpo (desc/links) só quando expandida (clique no card).
      expanded,
      statusKey: q.statusKey,
      dieImg: CONFIG.SHIFT.diceImages[q.statusKey] ?? null,
      statusLabel: dieStatusLabel(q.statusKey),
      currentLabel: dieLabel(sys.currentDie),
      maxLabel: dieLabel(sys.maxDie),
      exhausted: sys.exhausted,
      hidden: !sys.revealed,
      canRoll: q.canRoll && this.isEditable,
      canUp: q.canShiftUp && this.isEditable,
      canDown: q.canShiftDown && this.isEditable,
      desc,
      // Desfecho (independente do clock/Exhausted).
      outcome, resolved,
      outcomeWord: resolved
        ? game.i18n.localize(outcome === "success" ? "SHIFT.Party.Quests.Success" : "SHIFT.Party.Quests.Failure")
        : "",
      outcomeIcon: outcome === "success" ? "fa-circle-check" : "fa-circle-xmark",
      // Bloqueio por pré-requisito: card de cadeado + pills das quests; não resolve enquanto travada.
      locked,
      requiresPending: pending,
      canResolve, canFail, canReopen,
      // Rodapé INTEIRO (divisória + links + desfecho) só quando EXPANDIDA: a
      // compacta é só o cabeçalho — esconde tudo acima/abaixo da linha de divisão.
      showFoot: expanded && ((this.isEditable && (canResolve || canFail || canReopen)) || links.length > 0)
    };
  }

  /* --- Codex (reveal granular; cards por tipo; Actors E Items) ---
   *  Uma entrada é um rumor travado "???" só quando NADA foi revelado; ocultar
   *  apenas o nome mantém a entrada navegável sob um placeholder ("Unknown"). O GM
   *  sempre vê tudo. Cards/detalhe são CUSTOMIZADOS por kind (actor, location com
   *  landmarks, vehicle, trait, technique). */

  async #codexContext() {
    const isGM = game.user.isGM;
    const entries = this.document.system.codex ?? [];
    // Resolve todos os docs referenciados em paralelo (evita N awaits seriais de fromUuid).
    const docs = await Promise.all(entries.map(e => fromUuid(e.uuid).catch(() => null)));

    const all = [];
    const counts = {};
    for (let i = 0; i < entries.length; i++) {
      const card = this.#codexCard(entries[i], docs[i], isGM);
      if (!card) continue;                              // referência quebrada
      // Conta categorias com conteúdo para que botões de filtro vazios se ocultem.
      // O rumor travado de um Player não conta (vazaria que uma categoria existe).
      if (isGM || !card.locked) counts[card.group] = (counts[card.group] ?? 0) + 1;
      all.push(card);
    }

    // Um filtro cuja categoria esvaziou (última entrada removida) faz fallback para
    // "all", para que a grade nunca mostre uma view falsamente vazia sob um botão sumido.
    let filter = this._codexFilter;
    const fg = CODEX_FILTERS[filter];
    if (filter !== "all" && (!fg || !fg.some(g => (counts[g] ?? 0) > 0))) filter = this._codexFilter = "all";
    const filterGroups = CODEX_FILTERS[filter] ?? null;

    const cards = all.filter(card => {
      // Players veem rumores travados só na view "all", nunca sob um filtro de
      // categoria (isso revelaria a categoria da coisa oculta).
      if (card.locked && !isGM && filterGroups) return false;
      if (filterGroups && !filterGroups.includes(card.group)) return false;
      return true;
    });
    return { cards, counts };
  }

  /** Tudo revelado? (sem o selo "partly hidden" do GM.) Para uma Location, também
   *  exige que todo landmark embutido esteja revelado. */
  #fullyRevealed(entry, doc) {
    const r = entry.reveal ?? {};
    if (!REVEAL_FIELDS.every(k => r[k])) return false;
    if (doc?.type === "location") {
      const lms = doc.items?.filter?.(i => i.type === "landmark") ?? [];
      if (lms.some(l => !entry.revealLandmarks?.includes(l.id))) return false;
    }
    return true;
  }

  #plain(html) {
    if (!html) return "";
    const p = new DOMParser().parseFromString(html, "text/html");
    return (p.body.textContent ?? "").trim();
  }

  #typeLabel(doc) {
    return game.i18n.localize(`TYPES.${doc instanceof Item ? "Item" : "Actor"}.${doc.type}`);
  }

  /** Coleta até cinco tags de Keyword/Drawback dos Traits de um actor. */
  #codexTags(actor) {
    const tags = [];
    for (const t of actor.items?.filter?.(i => i.type === "trait") ?? []) {
      for (const k of t.system.keywords ?? []) if (k && !tags.includes(k)) tags.push(k);
    }
    return tags.slice(0, 5);
  }

  /** Um card da GRADE do codex, customizado por kind. `doc` já vem resolvido pelo chamador. */
  #codexCard(entry, doc, isGM) {
    if (!doc) return null;
    const r = entry.reveal ?? {};
    const see = k => isGM || !!r[k];
    const anyRevealed = isGM || REVEAL_FIELDS.some(k => r[k]) || (entry.revealLandmarks?.length > 0);
    const locked = !anyRevealed;             // um verdadeiro rumor "???" (nada revelado)
    const nameHidden = !see("name");
    const conceal = locked || nameHidden;    // oculta a identidade (nome + retrato)
    const role = deriveCodexRole(doc);
    const kind = codexKind(doc);
    const lower = s => String(s ?? "").toLowerCase();
    const base = {
      uuid: entry.uuid, role, kind, group: ROLE_GROUP[role] ?? "ally",
      locked, nameHidden,
      partlyHidden: isGM && !this.#fullyRevealed(entry, doc),
      name: locked ? "???" : (nameHidden ? game.i18n.localize("SHIFT.Party.Codex.Unknown") : doc.name),
      img: conceal ? null : doc.img, icon: ROLE_ICONS[role] ?? "fa-question",
      roleLabel: locked ? game.i18n.localize("SHIFT.Party.Codex.Locked")
        : `${game.i18n.localize(ROLE_LABEL[role] ?? "")} · ${this.#typeLabel(doc)}`,
      nameLower: conceal ? "" : lower(doc.name)
    };
    if (locked) return base;                  // um card de rumor não precisa de mais nada

    if (kind === "technique") {
      return Object.assign(base, {
        showTech: see("stats"),
        techType: game.i18n.localize(CONFIG.SHIFT.techniqueTypes[doc.system.techniqueType] ?? "")
      });
    }
    if (kind === "trait") {
      const tags = see("traits")
        ? [...(doc.system.keywords ?? []), ...(doc.system.drawbacks ?? [])].slice(0, 5) : [];
      return Object.assign(base, {
        showDie: see("stats"),
        statusKey: doc.statusKey, dieImg: CONFIG.SHIFT.diceImages[doc.statusKey] ?? null,
        statusLabel: dieStatusLabel(doc.statusKey),
        tags, tagsLower: tags.map(lower).join(" ")
      });
    }
    if (kind === "location") {
      const lms = doc.items?.filter?.(i => i.type === "landmark") ?? [];
      const shown = lms.filter(l => isGM || entry.revealLandmarks?.includes(l.id));
      const tags = see("traits") ? this.#codexTags(doc) : [];
      return Object.assign(base, {
        showStats: see("stats"),
        landmarkCount: shown.length,
        tags, tagsLower: tags.map(lower).join(" ")
      });
    }
    if (kind === "vehicle") {
      const tags = see("traits") ? this.#codexTags(doc) : [];
      return Object.assign(base, {
        showStats: see("stats"),
        crewCount: see("stats") ? (doc.system.crew ?? []).length : 0,
        tags, tagsLower: tags.map(lower).join(" ")
      });
    }
    // actor (character / adversary)
    const defeat = doc.system.defeat ?? { value: 0, max: 0 };
    const tags = see("traits") ? this.#codexTags(doc) : [];
    return Object.assign(base, {
      showStats: see("stats"),
      power: doc.system.power ?? 0, actions: doc.system.actions ?? doc.system.power ?? 0,
      showDefeat: see("defeat") && !!defeat.max, defeat,
      tags, tagsLower: tags.map(lower).join(" ")
    });
  }

  async #codexDetailContext() {
    const uuid = this._codexOpen;
    if (!uuid) return null;
    const entry = (this.document.system.codex ?? []).find(e => e.uuid === uuid);
    if (!entry) return null;
    const doc = await fromUuid(uuid);
    if (!doc) return null;
    const isGM = game.user.isGM;
    const r = entry.reveal ?? {};
    const see = k => isGM || !!r[k];
    const anyRevealed = isGM || REVEAL_FIELDS.some(k => r[k]) || (entry.revealLandmarks?.length > 0);
    if (!anyRevealed) return null;                  // um verdadeiro rumor não pode ser aberto
    const nameHidden = !see("name");
    const canViewDesc = isGM || !!doc.testUserPermission?.(game.user, "OBSERVER");
    const role = deriveCodexRole(doc);
    const kind = codexKind(doc);

    const base = {
      uuid, isGM, kind, reveal: r, canEditReveal: isGM, nameHidden,
      role, roleColor: ROLE_COLORS[role] ?? "#b5a4b3",
      name: nameHidden ? game.i18n.localize("SHIFT.Party.Codex.Unknown") : doc.name,
      img: nameHidden ? null : doc.img, icon: ROLE_ICONS[role] ?? "fa-question",
      roleLabel: `${game.i18n.localize(ROLE_LABEL[role] ?? "")} · ${this.#typeLabel(doc)}`,
      showNote: see("note"), note: entry.note ?? "", editable: this.isEditable,
      canOpenSheet: isGM,
      fieldNotes: await this.#fieldNotesContext(entry),
      revealFields: REVEAL_FIELDS.map(f => ({ f, on: !!r[f], label: `SHIFT.Party.Codex.Field.${cap(f)}` }))
    };

    if (kind === "technique") {
      return Object.assign(base, {
        concept: see("concept") ? this.#plain(doc.system.description) : "",
        showTech: see("stats"),
        techType: game.i18n.localize(CONFIG.SHIFT.techniqueTypes[doc.system.techniqueType] ?? ""),
        techUses: doc.system.uses ?? null,
        techAtWill: !!doc.system.recharges?.atWill,
        showScale: see("scale"), scale: doc.system.scale?.value ?? 1
      });
    }
    if (kind === "trait") {
      const traits = see("traits") ? [await this.#traitTile(doc, doc.parent ?? doc, canViewDesc, doc.uuid)] : [];
      return Object.assign(base, {
        concept: see("concept") ? this.#plain(doc.system.description) : "",
        showDie: see("stats"), statusKey: doc.statusKey, dieImg: CONFIG.SHIFT.diceImages[doc.statusKey] ?? null,
        statusLabel: dieStatusLabel(doc.statusKey), maxLabel: dieLabel(doc.system.maxDie),
        showScale: see("scale"), scale: doc.system.scale?.value ?? 1,
        traits, hasTraits: traits.length > 0
      });
    }
    if (kind === "location") {
      const traits = see("traits")
        ? await Promise.all(doc.items.filter(i => i.type === "trait").sort(byTraitOrder).map(t => this.#traitTile(t, doc, canViewDesc, doc.uuid))) : [];
      const landmarks = (doc.items?.filter?.(i => i.type === "landmark") ?? [])
        .filter(l => isGM || entry.revealLandmarks?.includes(l.id))
        .map(l => ({
          id: l.id, name: l.name, safe: !!l.system.safe,
          revealed: !!entry.revealLandmarks?.includes(l.id),
          desc: canViewDesc ? this.#plain(l.system.description).slice(0, 240) : ""
        }));
      return Object.assign(base, {
        concept: see("concept") ? (doc.system.concept ?? "") : "",
        traits, hasTraits: traits.length > 0,
        landmarks, hasLandmarks: landmarks.length > 0
      });
    }
    if (kind === "vehicle") {
      const traits = see("traits")
        ? await Promise.all(doc.items.filter(i => i.type === "trait").sort(byTraitOrder).map(t => this.#traitTile(t, doc, canViewDesc, doc.uuid))) : [];
      const crew = see("stats")
        ? (await Promise.all((doc.system.crew ?? []).map(u => fromUuid(u))))
            .filter(Boolean).map(c => ({ uuid: c.uuid, name: c.name, img: c.img })) : [];
      return Object.assign(base, {
        concept: see("concept") ? (doc.system.concept ?? "") : "",
        traits, hasTraits: traits.length > 0,
        crew, hasCrew: crew.length > 0
      });
    }
    // actor (character / adversary)
    const defeat = doc.system.defeat ?? { value: 0, max: 0 };
    const traits = see("traits")
      ? await Promise.all(doc.items.filter(i => i.type === "trait").sort(byTraitOrder).map(t => this.#traitTile(t, doc, canViewDesc, doc.uuid))) : [];
    return Object.assign(base, {
      concept: see("concept") ? (doc.system.concept ?? "") : "",
      showStats: see("stats"), power: doc.system.power ?? 0, actions: doc.system.actions ?? doc.system.power ?? 0,
      showDefeat: see("defeat") && !!defeat.max, defeat,
      defeatPct: defeat.max ? Math.round((defeat.value / defeat.max) * 100) : 0,
      showScale: see("scale"), scale: doc.system.scale ?? 1,
      traits, hasTraits: traits.length > 0
    });
  }

  /* --- Codex field notes (compartilhadas, editáveis por Player via um Journal vinculado) --- */

  /** Resolve a JournalEntry de codex automática do party; o GM a cria de forma lazy. */
  async #getCodexJournal(create = false) {
    const id = this.document.system.codexJournal;
    const existing = id ? await fromUuid(id) : null;
    if (existing) return existing;
    if (!create || !game.user.isGM) return null;
    return this.#createCodexJournal();
  }

  /** Cria a JournalEntry "Field Notes" compartilhada e de propriedade dos Players para este party. */
  async #createCodexJournal() {
    // Rede de segurança: um party que mora num compendium não pode (e não deve)
    // criar um Journal de MUNDO nem gravar `update()` num pack travado — isso lança
    // "may not update documents in the locked compendium". Falha silenciosa → null.
    if (this.document.pack) return null;
    const folderName = game.i18n.localize("SHIFT.Party.Codex.JournalFolder");
    // Tolera pastas criadas antes da troca de separador " — " → " · " (sem duplicar).
    const legacyName = folderName.replace(" · ", " — ");
    let folder = game.folders.find(f => f.type === "JournalEntry" && (f.name === folderName || f.name === legacyName));
    if (!folder) folder = await Folder.create({ name: folderName, type: "JournalEntry" });
    const journal = await JournalEntry.create({
      name: game.i18n.format("SHIFT.Party.Codex.JournalName", { party: this.document.name }),
      folder: folder?.id ?? null,
      // OWNER por padrão → qualquer Player com acesso ao codex pode contribuir (notas compartilhadas).
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
      flags: { "shift-vtt": { partyUuid: this.document.uuid } }
    });
    await this.document.update({ "system.codexJournal": journal.uuid });
    return journal;
  }

  /** Encontra a JournalEntryPage que sustenta as field notes compartilhadas de uma entrada do codex. */
  #findFieldNotePage(journal, codexUuid) {
    return journal?.pages.find(p => p.getFlag("shift-vtt", "codexUuid") === codexUuid) ?? null;
  }

  /** Resolve (ou cria de forma lazy) a página de field-notes de uma entrada do codex.
   *  O dono do editor (qualquer Player com OWNER no journal) pode criar a página. */
  async #ensureFieldNotePage(codexUuid) {
    const journal = await this.#getCodexJournal(game.user.isGM);
    if (!journal?.testUserPermission(game.user, "OWNER")) return null;
    const existing = this.#findFieldNotePage(journal, codexUuid);
    if (existing) return existing;
    const doc = await fromUuid(codexUuid);
    const [page] = await journal.createEmbeddedDocuments("JournalEntryPage", [{
      name: doc?.name ?? game.i18n.localize("SHIFT.Party.Codex.FieldNotes"),
      flags: { "shift-vtt": { codexUuid } }
    }]);
    return page ?? null;
  }

  /** Monta o contexto de field-notes compartilhadas de uma entrada do codex. */
  async #fieldNotesContext(entry) {
    const journal = await this.#getCodexJournal(false);
    const canEdit = !!journal?.testUserPermission(game.user, "OWNER");
    const page = journal ? this.#findFieldNotePage(journal, entry.uuid) : null;
    const raw = page?.text?.content ?? "";
    return {
      available: !!journal,
      pageUuid: page?.uuid ?? "",
      source: raw,
      content: raw ? await enrich(raw, { relativeTo: page ?? this.document }) : "",
      canEdit
    };
  }

  /* --- Location / Landmark + active Vehicle --------------------- */

  /** O dado do Trait "Wealth" da Location (o teto de recuperação do Challenging Rest). */
  #locationWealthDie(loc) {
    const want = game.i18n.localize("SHIFT.Trait.Wealth").toLowerCase();
    const t = loc?.items?.find?.(i => i.type === "trait" && i.name.toLowerCase() === want);
    return t?.system.currentDie ?? null;
  }

  /** Resolve a Location atual do party + o landmark escolhido (para a faixa do header
   *  e para as regras de Rest sensíveis à localização). */
  async #locationContext() {
    const uuid = this.document.system.location;
    if (!uuid) return null;
    const loc = await fromUuid(uuid);
    if (!loc) return null;
    const landmarks = (loc.items?.filter?.(i => i.type === "landmark") ?? [])
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name))
      .map(l => ({ id: l.id, name: l.name, safe: !!l.system.safe }));
    const current = landmarks.find(l => l.id === this.document.system.landmark) ?? null;
    return {
      uuid, name: loc.name, img: loc.img,
      wealthDie: this.#locationWealthDie(loc),
      landmarks, hasLandmarks: landmarks.length > 0,
      landmarkId: current?.id ?? "",
      landmarkName: current?.name ?? "",
      landmarkSafe: current ? current.safe : null,   // null = nenhum landmark específico escolhido
      canEdit: this.isEditable
    };
  }

  /** Resolve o Vehicle ativo do party (cuja crew espelha o roster). */
  async #vehicleContext() {
    const uuid = this.document.system.vehicle;
    if (!uuid) return null;
    const v = await fromUuid(uuid);
    if (!v) return null;
    return { uuid, name: v.name, img: v.img, crewCount: (v.system.crew ?? []).length, canEdit: this.isEditable };
  }

  /* ---------------------------------------------------------------- */
  /* Rendering: prefs + live listeners                               */
  /* ---------------------------------------------------------------- */

  /** Navegação somente-leitura + o editor de Field-Notes editável pelo Player, que
   *  precisa continuar usável mesmo quando a ficha não é editável (um Player OBSERVER). */
  static VIEW_ACTIONS = ["codexBack", "codexFilter", "openCodexEntry", "openMember",
    "openLocation", "toggleTile"];

  /** @override — o DocumentSheetV2 desabilita TODO controle de formulário (inclusive
   *  `<button>`s) quando a ficha não é editável, o que travaria o clique do botão de
   *  voltar do codex, os tiles de expandir trait e os filtros para Players OBSERVER.
   *  Reabilita as view actions somente-leitura + os editores de field-notes; todos os
   *  handlers que mutam fazem self-gate. */
  _toggleDisabled(disabled) {
    super._toggleDisabled(disabled);
    if (!disabled || !this.element) return;
    const sel = ShiftPartySheet.VIEW_ACTIONS.map(a => `[data-action="${a}"]`).join(", ")
      + ", prose-mirror.codex-fieldnotes";
    for (const el of this.element.querySelectorAll(sel)) el.disabled = false;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender?.(context, options);

    // O CSS do protótipo condiciona as affordances `.edit-only` a uma classe raiz
    // `edit-mode`; adiciona ela (os templates também condicionam em {{#if editMode}},
    // mas o CSS, caso contrário, as ocultaria à força com !important mesmo em modo de edição).
    this.element.classList.toggle("edit-mode", !!context.editMode);

    // Identidade visual fixa (os controles de ajuste foram removidos): pink · compact ·
    // nebula. Mantida como fonte única de verdade para que seja trivial reexpor.
    this.element.dataset.accent = "pink";
    this.element.dataset.atmo = "nebula";
    const roster = this.element.querySelector(".party-roster");
    if (roster) {
      roster.classList.remove("layout-slots", "layout-grid", "layout-compact");
      roster.classList.add("layout-compact");
    }

    // Só (re)conecta listeners para os PARTS que realmente renderizaram; as actions
    // de view/reveal do codex fazem um render({parts:["codex"]}) direcionado, então
    // ligar a ficha inteira aqui geraria binding duplo no roster/quests/header intactos.
    const did = id => !options?.parts || options.parts.includes(id);

    // GM: garante de forma lazy que o Journal de codex compartilhado existe (cobre
    // parties criados antes desta feature). Protegido contra reentrância do render
    // resultante. NÃO faz isso para um party que mora num compendium (ex.: o pack de
    // Sandbox): `update()` num compendium travado lança, e um doc de compendium não
    // deve criar/apontar para um Journal de MUNDO (uuid específico de mundo).
    if (game.user.isGM && !this.document.pack && !this.document.system.codexJournal && !this.#ensuringJournal) {
      this.#ensuringJournal = true;
      this.#getCodexJournal(true).finally(() => { this.#ensuringJournal = false; });
    }

    // Reconcilia a crew do vehicle ativo quando um visualizador autorizado abre a
    // ficha (faz self-guard por owner + diff; cobre edições feitas por quem não é
    // dono do vehicle).
    this.document.syncActiveVehicleCrew().catch(err => console.error("SHIFT | crew sync", err));

    if (did("codex")) {
      // A busca do codex filtra no lado do cliente (instantâneo, sem re-render).
      const search = this.element.querySelector("[data-codex-search]");
      if (search) {
        search.addEventListener("input", ev => this.#applyCodexSearch(ev.currentTarget.value));
        if (this._codexQuery) this.#applyCodexSearch(this._codexQuery);
      }
      // Field Notes compartilhadas do codex; o editor inline salva na PÁGINA do
      // Journal vinculado (que os Players POSSUEM), NÃO no actor do party, para que
      // Players OBSERVER possam contribuir. O elemento não tem `name`, então o
      // formulário do actor o ignora.
      // (_toggleDisabled reabilita estes para visualizadores sem permissão de edição.)
      for (const el of this.element.querySelectorAll("prose-mirror.codex-fieldnotes")) {
        el.addEventListener("change", async ev => {
          ev.stopPropagation();
          const codexUuid = el.dataset.codexUuid;
          let page = el.dataset.pageUuid ? await fromUuid(el.dataset.pageUuid) : null;
          if (!page) page = await this.#ensureFieldNotePage(codexUuid);
          if (!page) return void ui.notifications.warn(game.i18n.localize("SHIFT.Party.Codex.NotesUnavailable"));
          try { await page.update({ "text.content": el.value ?? "" }); el.dataset.pageUuid = page.uuid; }
          catch (err) { ui.notifications.error(game.i18n.localize("SHIFT.Party.Codex.NotesFailed")); }
        });
      }
    }

    if (!this.isEditable) return;

    // <select> de Landmark → system.landmark (o landmark atual do party).
    if (did("header")) {
      const lmSel = this.element.querySelector("[data-landmark-select]");
      if (lmSel) lmSel.addEventListener("change", ev =>
        this.document.update({ "system.landmark": ev.currentTarget.value }));
    }

    // (Quests agora são Trait Items, editados pela ficha de Trait padrão, não por um
    // listener de campo de quest dedicado.)

    // Nota do codex → system.codex[uuid].note (campo de curadoria só do GM).
    if (did("codex") && game.user.isGM) {
      for (const ta of this.element.querySelectorAll("[data-codex-note]")) {
        ta.addEventListener("change", async ev => {
          const uuid = ev.currentTarget.dataset.codexNote;
          const codex = foundry.utils.deepClone(this.document.system.codex ?? []);
          const e = codex.find(x => x.uuid === uuid);
          if (!e) return;
          e.note = ev.currentTarget.value;
          // Sem render; o GM está digitando nesta própria textarea, e um re-render
          // roubaria o foco e piscaria o detalhe.
          await this.document.update({ "system.codex": codex }, { render: false });
        });
      }
    }
  }

  #applyCodexSearch(query) {
    this._codexQuery = query;
    const q = String(query ?? "").trim().toLowerCase();
    for (const card of this.element.querySelectorAll(".codex-card")) {
      const name = card.dataset.name ?? "";
      const tags = card.dataset.tags ?? "";
      card.style.display = (!q || name.includes(q) || tags.includes(q)) ? "" : "none";
    }
  }

  /* ---------------------------------------------------------------- */
  /* Drops                                                           */
  /* ---------------------------------------------------------------- */

  /** @override — o alvo do drop decide: o slot de Location/Vehicle → define ele; a
   *  aba Codex → uma entrada de codex; em qualquer outro lugar → um membro do roster. */
  async _onDropActor(event, actor) {
    if (!this.isEditable) return false;
    let a = (actor instanceof Actor) ? actor : await Actor.implementation.fromDropData(actor);
    if (!a || a.uuid === this.document.uuid) {
      ui.notifications.warn(game.i18n.localize("SHIFT.Party.CannotAdd"));
      return false;
    }
    // Um Actor solto sobre um card de Quest vira um link daquela Quest.
    const questId = this.#questDropTarget(event);
    if (questId) return this.#addQuestLink(questId, a.uuid);
    // Uma Location/Vehicle solta em seu slot vira o place/vehicle do party.
    if (this.#isLocationDrop(event)) return this.#setLocation(a);
    if (this.#isVehicleDrop(event)) return this.#setVehicle(a);
    if (this.#isCodexDrop(event)) return this.#addCodexEntry(a.uuid);
    // Locations/Vehicles/parties NÃO são membros do roster; eles têm seus próprios slots.
    if (["party", "location", "vehicle"].includes(a.type)) {
      ui.notifications.warn(game.i18n.localize("SHIFT.Party.CannotAdd"));
      return false;
    }
    if (a.inCompendium) a = await Actor.implementation.create(game.actors.fromCompendium(a), { fromCompendium: true });
    await this.document.addPartyMembers(a);   // também sincroniza a crew do vehicle ativo
    return true;
  }

  /** @override — um Trait já neste party solto sobre outro de seus cards o REORDENA;
   *  um Trait externo solto na aba Quests vira uma Quest, e nas abas Traits/Roster
   *  vira um Trait do party; a aba Codex cataloga um trait/technique; drops de
   *  Keyword/Drawback são delegados ao handler base. */
  async _onDropItem(event, item) {
    if (!this.isEditable) return false;
    const doc = (item instanceof Item) ? item : await Item.implementation.fromDropData(item);
    if (!doc) return false;

    // Reordenar: um card (Trait/Quest) possuído solto sobre um irmão → integer sort.
    if (doc.parent === this.document && await this.#sortTraitOnDrop(event, doc)) return true;

    // Um Item externo solto sobre um card de Quest vira um link daquela Quest.
    const questId = this.#questDropTarget(event);
    if (questId && doc.uuid) return this.#addQuestLink(questId, doc.uuid);

    if (["trait", "technique"].includes(doc.type) && this.#isCodexDrop(event)) return this.#addCodexEntry(doc.uuid);

    // Um Trait externo solto FORA da aba Quests vira um Party Trait (estilo status).
    // Na aba Quests, soltar coisas vira link (Etapa C) — nunca mais converte Trait→Quest.
    if (doc.type === "trait" && doc.parent !== this.document && !this.#isQuestDrop(event)) {
      const data = doc.toObject();
      delete data._id;
      data.system = foundry.utils.mergeObject(data.system ?? {}, {
        category: "party",
        autoShiftOnRoll: false           // party traits são status, não rolam pra degradar
      });
      return this.document.createEmbeddedDocuments("Item", [data]);
    }
    return super._onDropItem(event, item);
  }

  /** Reordena um card por integer sort quando solto sobre um irmão: Quests entre
   *  Quests, Traits entre Traits da mesma categoria. Retorna true se tratou o evento. */
  async #sortTraitOnDrop(event, source) {
    const targetId = event.target?.closest?.("[data-item-id]")?.dataset.itemId;
    if (!targetId || targetId === source.id) return false;
    const target = this.document.items.get(targetId);
    if (!target) return false;

    let siblings;
    if (source.type === "quest") {
      if (target.type !== "quest") return false;
      siblings = this.document.items.filter(i => i.type === "quest" && i.id !== source.id);
    } else {
      if (target.type !== "trait" || target.system.category !== source.system.category) return false;
      siblings = this.document.items.filter(i =>
        i.type === "trait" && i.system.category === source.system.category && i.id !== source.id);
    }
    const updates = foundry.utils.performIntegerSort(source, { target, siblings })
      .map(u => ({ _id: u.target.id, sort: u.update.sort }));
    if (updates.length) await this.document.updateEmbeddedDocuments("Item", updates);
    return true;
  }

  /** Solta uma Folder de Actors sobre o roster para adicionar todos eles. */
  async _onDropFolder(event, folder) {
    if (!this.isEditable) return false;
    if (folder?.type !== "Actor") return false;
    const actors = folder.contents.filter(x =>
      x instanceof Actor && !["party", "location", "vehicle"].includes(x.type));
    if (actors.length) await this.document.addPartyMembers(...actors);
    return true;
  }

  #isCodexDrop(event) {
    return !!event.target?.closest?.("[data-page='codex'], .party-codex");
  }

  #isLocationDrop(event) {
    return !!event.target?.closest?.("[data-drop='location']");
  }

  #isVehicleDrop(event) {
    return !!event.target?.closest?.("[data-drop='vehicle']");
  }

  #isQuestDrop(event) {
    return !!event.target?.closest?.("[data-page='quests'], .party-quests");
  }

  /** O alvo do drop é um card de Quest específico? Devolve o id da Quest ou null.
   *  (Espelha #isCodexDrop, mas mira o card individual para vincular ali.) */
  #questDropTarget(event) {
    const card = event.target?.closest?.(".party-quests .ptrait[data-item-id]");
    return card?.dataset.itemId ?? null;
  }

  /** Vincula um UUID de Actor/Item a uma Quest (espelha #addCodexEntry, mas guarda
   *  os UUIDs em system.links da própria Quest). */
  async #addQuestLink(questId, uuid) {
    const quest = this.document.items.get(questId);
    if (!quest || quest.type !== "quest" || !uuid || quest.uuid === uuid) return false;
    const links = foundry.utils.deepClone(quest.system.links ?? []);
    if (links.includes(uuid)) {
      ui.notifications.info(game.i18n.localize("SHIFT.Party.Codex.Already"));
      return true;
    }
    links.push(uuid);
    await quest.update({ "system.links": links });
    return true;
  }

  /** Define a Location do party (sempre catalogada no codex) + limpa o landmark. */
  async #setLocation(actor) {
    if (actor?.type !== "location") {
      ui.notifications.warn(game.i18n.localize("SHIFT.Party.NotLocation"));
      return false;
    }
    const update = { "system.location": actor.uuid, "system.landmark": "" };
    const codex = foundry.utils.deepClone(this.document.system.codex ?? []);
    if (!codex.some(e => e.uuid === actor.uuid)) {
      codex.push(ShiftPartySheet.#newCodexEntry(actor.uuid, ["name"]));
      update["system.codex"] = codex;
    }
    await this.document.update(update);
    return true;
  }

  /** Define o Vehicle ativo (limpa a crew do vehicle anterior, sincroniza a do novo). */
  async #setVehicle(actor) {
    if (actor?.type !== "vehicle") {
      ui.notifications.warn(game.i18n.localize("SHIFT.Party.NotVehicle"));
      return false;
    }
    await this.document.setActiveVehicle(actor.uuid);
    return true;
  }

  /** Um conjunto de reveal com apenas os campos dados ligados (o resto oculto). */
  static #revealSet(on = []) {
    const r = { name: false, concept: false, stats: false, defeat: false, traits: false, scale: false, note: false };
    for (const k of on) r[k] = true;
    return r;
  }

  /** Uma entrada de codex nova com um formato consistente em todo caminho de adição. */
  static #newCodexEntry(uuid, revealOn = []) {
    return { uuid, reveal: ShiftPartySheet.#revealSet(revealOn), revealLandmarks: [] };
  }

  /** Adiciona um UUID de Actor/Item ao codex. Entradas novas começam OCULTAS (um
   *  rumor "???"); o GM revela os campos deliberadamente. */
  async #addCodexEntry(uuid) {
    const codex = foundry.utils.deepClone(this.document.system.codex ?? []);
    if (codex.some(e => e.uuid === uuid)) {
      ui.notifications.info(game.i18n.localize("SHIFT.Party.Codex.Already"));
      return false;
    }
    codex.push(ShiftPartySheet.#newCodexEntry(uuid));
    await this.document.update({ "system.codex": codex });
    return true;
  }

  /* ---------------------------------------------------------------- */
  /* Actions                                                         */
  /* ---------------------------------------------------------------- */

  static async #onRemoveMember(event, target) {
    if (!this.isEditable) return;
    const uuid = target.closest("[data-member-uuid]")?.dataset.memberUuid;
    if (uuid) await this.document.removePartyMembers(uuid);
  }

  static async #onOpenMember(event, target) {
    const uuid = target.closest("[data-member-uuid]")?.dataset.memberUuid
      ?? target.closest("[data-codex-uuid]")?.dataset.codexUuid;
    const a = uuid ? await fromUuid(uuid) : null;
    a?.sheet?.render(true);
  }

  static #onToggleTile(event, target) {
    const tile = target.closest("[data-tile-id]");
    const container = tile?.closest(".pm-traits");
    const owner = container?.dataset.memberUuid;
    const tid = tile?.dataset.tileId;
    if (!owner || !tid) return;
    const key = `${owner}::${tid}`;
    const opening = this._openTile !== key;
    this._openTile = opening ? key : null;

    // Toggle puro de DOM (um único drawer aberto por vez na ficha inteira), sem
    // re-render, de modo que o detalhe do codex nunca pisca e um editor de
    // Field-Notes aberto nunca é destruído no meio da edição. O estado persiste em
    // `_openTile` para o próximo render.
    for (const t of this.element.querySelectorAll(".trait-tile.is-open")) t.classList.remove("is-open");
    for (const d of this.element.querySelectorAll(".pm-detail.is-open")) d.classList.remove("is-open");
    for (const c of this.element.querySelectorAll(".pm-detail .detail-card")) c.hidden = true;
    if (!opening) return;
    tile.classList.add("is-open");
    let detail = container.nextElementSibling;
    if (!detail?.classList.contains("pm-detail")) detail = container.parentElement?.querySelector(".pm-detail");
    if (detail) {
      detail.classList.add("is-open");
      const card = detail.querySelector(`.detail-card[data-detail-for="${tid}"]`);
      if (card) card.hidden = false;
    }
  }

  /* --- Codex (a curadoria é só do GM; a config de reveal também) ------- */

  static #onCodexFilter(event, target) {
    this._codexFilter = target.dataset.filter ?? "all";
    this._codexOpen = null;   // não deixa um detalhe aberto isolado sob uma grade filtrada
    this.render({ parts: ["codex"] });   // direcionado → sem flash da ficha inteira
  }

  static #onOpenCodexEntry(event, target) {
    this._codexOpen = target.closest("[data-codex-uuid]")?.dataset.codexUuid ?? null;
    this.render({ parts: ["codex"] });
  }

  static #onCodexBack() {
    this._codexOpen = null;
    this.render({ parts: ["codex"] });
  }

  static async #onRemoveCodexEntry(event, target) {
    if (!game.user.isGM) return;
    const uuid = target.closest("[data-codex-uuid]")?.dataset.codexUuid;
    if (!uuid) return;
    const codex = (this.document.system.codex ?? []).filter(e => e.uuid !== uuid);
    if (this._codexOpen === uuid) this._codexOpen = null;
    const update = { "system.codex": codex };
    // Não deixa a Location/Vehicle ativa apontando para uma entrada descatalogada.
    if (this.document.system.location === uuid) { update["system.location"] = ""; update["system.landmark"] = ""; }
    await this.document.update(update);
    if (this.document.system.vehicle === uuid) await this.document.setActiveVehicle("");
    // Apaga a página de Field-Notes compartilhada agora órfã (senão, readicionar a religaria).
    const journal = await this.#getCodexJournal(false);
    const page = journal ? this.#findFieldNotePage(journal, uuid) : null;
    if (page) await page.delete();
  }

  /** Alterna um campo de reveal de uma entrada do codex (só do GM). */
  static async #onToggleCodexReveal(event, target) {
    if (!game.user.isGM) return;
    const uuid = target.closest("[data-codex-uuid]")?.dataset.codexUuid;
    const field = target.dataset.field;
    if (!uuid || !field) return;
    const codex = foundry.utils.deepClone(this.document.system.codex ?? []);
    const e = codex.find(x => x.uuid === uuid);
    if (!e) return;
    e.reveal = e.reveal ?? {};
    e.reveal[field] = !e.reveal[field];
    // Um toggle de reveal nunca muda a PRÓPRIA view do GM (o GM vê tudo), então
    // atualiza o toggle no lugar + persiste SEM render; a tela de detalhe não pode
    // piscar (e um editor de Field-Notes aberto não pode ser destruído).
    const on = e.reveal[field];
    target.classList.toggle("on", on);
    const icon = target.querySelector("i");
    if (icon) { icon.classList.toggle("fa-eye", on); icon.classList.toggle("fa-eye-slash", !on); }
    await this.document.update({ "system.codex": codex }, { render: false });
  }

  /** Alterna se os Players podem ver um landmark de uma entrada de Location (só do GM). */
  static async #onToggleCodexLandmark(event, target) {
    if (!game.user.isGM) return;
    const uuid = target.closest("[data-codex-uuid]")?.dataset.codexUuid;
    const lmId = target.dataset.landmarkId;
    if (!uuid || !lmId) return;
    const codex = foundry.utils.deepClone(this.document.system.codex ?? []);
    const e = codex.find(x => x.uuid === uuid);
    if (!e) return;
    e.revealLandmarks = e.revealLandmarks ?? [];
    const i = e.revealLandmarks.indexOf(lmId);
    if (i >= 0) e.revealLandmarks.splice(i, 1); else e.revealLandmarks.push(lmId);
    // Cirúrgico (sem render): alterna o olho + o estado hidden da linha do landmark.
    const on = i < 0;
    target.classList.toggle("on", on);
    const icon = target.querySelector("i");
    if (icon) { icon.classList.toggle("fa-eye", on); icon.classList.toggle("fa-eye-slash", !on); }
    target.closest(".cd-landmark")?.classList.toggle("is-hidden", !on);
    await this.document.update({ "system.codex": codex }, { render: false });
  }

  /* --- Trait/Quest hide (toggle de reveal de um botão) -------------- */

  /** Oculta/mostra um Trait (ou Quest, que É um Trait) para os Players com um
   *  clique, via a flag `system.revealed` do trait. Só do GM; a própria view do GM
   *  não muda (o GM vê tudo), então alterna o olho no lugar sem re-render. */
  static async #onToggleTraitHide(event, target) {
    if (!game.user.isGM) return;
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    const item = id ? this.document.items.get(id) : null;
    if (!item) return;
    const revealed = !item.system.revealed;
    target.classList.toggle("on", !revealed);   // "on" = oculto
    const icon = target.querySelector("i");
    if (icon) { icon.classList.toggle("fa-eye", revealed); icon.classList.toggle("fa-eye-slash", !revealed); }
    target.closest("[data-item-id]")?.classList.toggle("is-gmhidden", !revealed);
    await item.update({ "system.revealed": revealed }, { render: false });
  }

  /* --- Quests (rolar + desfecho) ---------------------------------- */

  /** Rola o dado de uma Quest direto (single-die action roll na Party; com
   *  autoShiftOnRoll, o clock dá ShiftDown = "o tempo acabando"). Não passa pelo
   *  diálogo de Action Roll (esse monta da lista de Traits do actor, sem Quests). */
  static async #onRollQuest(event, target) {
    if (!this.isEditable) return;
    await this.getItem(target)?.roll();
  }

  /** Define o desfecho de uma Quest. Só GM/editável (espelha #onToggleTraitHide). */
  static async #onQuestResolve(event, target) {
    if (!this.isEditable) return;
    await this.getItem(target)?.update({ "system.outcome": "success" });
  }
  static async #onQuestFail(event, target) {
    if (!this.isEditable) return;
    await this.getItem(target)?.update({ "system.outcome": "failure" });
  }
  static async #onQuestReopen(event, target) {
    if (!this.isEditable) return;
    await this.getItem(target)?.update({ "system.outcome": "none" });
  }

  /** Recolhe/expande as sub-quests de uma mãe (esconde as filhas na árvore). */
  static #onToggleQuestKids(event, target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    if (!id) return;
    this.#questCollapsed.has(id) ? this.#questCollapsed.delete(id) : this.#questCollapsed.add(id);
    this.render({ parts: ["quests"] });   // direcionado → não re-roda _onRender da ficha inteira
  }

  /** Expande/recolhe o CORPO da quest (desc + links + desfecho), invertendo o
   *  padrão de abertura. Ignora cliques em botões/inputs internos. */
  static #onToggleQuestBody(event, target) {
    if (event.target.closest("input, select, textarea, prose-mirror, a[data-action]:not([data-action='toggleQuestBody']), button")) return;
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    if (!id) return;
    this.#questFlipped.has(id) ? this.#questFlipped.delete(id) : this.#questFlipped.add(id);
    this.render({ parts: ["quests"] });   // direcionado → não re-roda _onRender da ficha inteira
  }

  /** Abre a ficha do documento vinculado a uma Quest. Ignora cliques no X de
   *  remover (que fica dentro do mesmo chip) para nunca abrir + remover juntos. */
  static async #onOpenQuestLink(event, target) {
    if (event?.target?.closest?.(".pt-link-x")) return;
    const uuid = target.closest("[data-link-uuid]")?.dataset.linkUuid;
    const doc = uuid && await fromUuid(uuid);
    doc?.sheet?.render(true);
  }

  /** Remove um link de uma Quest (espelha #onRemoveCodexEntry). */
  static async #onRemoveQuestLink(event, target) {
    if (!this.isEditable) return;
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    const uuid = target.closest("[data-link-uuid]")?.dataset.linkUuid;
    const quest = id ? this.document.items.get(id) : null;
    if (!quest || !uuid) return;
    const links = (quest.system.links ?? []).filter(u => u !== uuid);
    await quest.update({ "system.links": links });
  }

  /* --- Party-wide actions (GM/owner) ---------------------------- */

  /** Concede XP como a macro: escolhe o valor e quais characters num prompt. */
  static async #onGrantPartyXp() {
    if (!this.isEditable) return;
    const chars = this.document.partyMembers.filter(m => m.type === "character");
    if (!chars.length) return void ui.notifications.info(game.i18n.localize("SHIFT.Party.NoCharacters"));
    const esc = foundry.utils.escapeHTML;
    const rows = chars.map(m => `
      <label class="party-xp-row">
        <input type="checkbox" name="pick.${m.id}" checked/>
        <img src="${m.img}" alt=""/> <span class="pxr-name">${esc(m.name)}</span>
        <span class="pxr-xp">${m.system.xp?.value ?? 0} XP</span>
      </label>`).join("");
    const content = `
      <div class="shift-prompt party-xp-prompt">
        <div class="form-group pxp-amount">
          <label>${game.i18n.localize("SHIFT.Party.XpAmount")}</label>
          <input type="number" name="amount" value="1" min="1" step="1" autofocus/>
        </div>
        <div class="pxp-list">${rows}</div>
      </div>`;
    let data;
    try {
      data = await foundry.applications.api.DialogV2.prompt({
        window: { title: game.i18n.localize("SHIFT.Party.GrantXp"), icon: "fa-solid fa-arrow-trend-up" },
        position: { width: 380 },
        classes: ["shift-vtt", "shift-dialog"],
        content, rejectClose: false,
        ok: {
          label: game.i18n.localize("SHIFT.Party.GrantXp"),
          callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object
        }
      });
    } catch (err) { return; }
    if (!data) return;
    const amount = Math.max(1, Math.floor(Number(data.amount) || 0));
    if (!amount) return;
    let n = 0;
    for (const m of chars) {
      if (!data.pick?.[m.id]) continue;
      if (await m.addXP(amount, { limited: false, reason: game.i18n.localize("SHIFT.Party.GrantXp"), toChat: true })) n++;
    }
    if (n) ui.notifications.info(game.i18n.format("SHIFT.Party.XpGranted", { amount, count: n }));
  }

  /** GM: solicita um Action Roll DE um Player. Escolhe o character, o leque de
   *  Traits permitidos (nenhum = todos) e o tipo de roll; então o(s) Player(s) dono(s)
   *  do character escolhido recebem o prompt de Action Roll (restrito + tipo de roll
   *  predefinido). */
  static async #onRequestRoll() {
    if (!game.user.isGM) return;
    const chars = this.document.partyMembers.filter(m => m.type === "character");
    if (!chars.length) return void ui.notifications.info(game.i18n.localize("SHIFT.Party.NoCharacters"));

    // Espelha o diálogo de Action Roll padrão: o character é escolhido por cards de
    // retrato (sem dropdown), os Traits permitidos como os mesmos cards de trait-opt,
    // e radios de tipo de roll.
    const characters = chars.map(m => ({
      id: m.id, name: m.name, img: m.img,
      traits: m.items.filter(t => t.type === "trait" && t.canRoll).map(t => ({
        uuid: t.uuid, name: t.name,
        dieLabel: dieLabel(t.system.currentDie),
        img: CONFIG.SHIFT.diceImages[t.statusKey] ?? null
      }))
    }));
    const rollTypes = ["normal", "risky", "inspired"].map(k => ({ key: k, label: game.i18n.localize(CONFIG.SHIFT.rollTypes[k]) }));
    const content = await fvtt.renderTemplate("systems/shift-vtt/templates/apps/request-roll-dialog.hbs", { characters, rollTypes });

    let data;
    try {
      data = await foundry.applications.api.DialogV2.prompt({
        window: { title: game.i18n.localize("SHIFT.Party.RequestRoll.Title"), icon: "fa-solid fa-dice" },
        position: { width: 500 },
        classes: ["shift-vtt", "shift-dialog", "action-roll-window"],
        content, rejectClose: false,
        render: (event, dialog) => {
          const root = dialog.element ?? dialog;
          const blocks = root.querySelectorAll(".rr-traits");
          const sync = () => {
            for (const lbl of root.querySelectorAll(".rr-char")) lbl.classList.toggle("selected", !!lbl.querySelector("input")?.checked);
          };
          for (const radio of root.querySelectorAll("input[name='character']")) {
            radio.addEventListener("change", () => {
              for (const b of blocks) b.hidden = b.dataset.char !== radio.value;
              sync();
            });
          }
        },
        ok: {
          label: game.i18n.localize("SHIFT.Party.RequestRoll.Send"),
          callback: (event, button) => {
            const form = button.form;
            const charId = form.elements.character?.value;
            const block = form.querySelector(`.rr-traits[data-char="${charId}"]`);
            const traits = Array.from(block?.querySelectorAll("input[name='trait']:checked") ?? []).map(i => i.value);
            return { charId, traits, rollType: form.elements.rollType?.value || "normal" };
          }
        }
      });
    } catch (err) { return; }
    if (!data?.charId) return;

    const character = chars.find(m => m.id === data.charId);
    if (!character) return;
    // Mira o(s) Player(s) dono(s) do character que estiverem online; faz fallback para o GM.
    const owners = game.users.filter(u => u.active && !u.isGM && character.testUserPermission(u, "OWNER"));
    const targets = owners.length ? owners : [game.user];
    for (const u of targets) {
      requestPlayerRoll({ userId: u.id, actorUuid: character.uuid, allowedTraits: data.traits, rollType: data.rollType });
    }
    if (owners.length) ui.notifications.info(game.i18n.format("SHIFT.Party.RequestRoll.Sent", { count: owners.length, actor: character.name }));
    else ui.notifications.warn(game.i18n.localize("SHIFT.Party.RequestRoll.NoOwner"));
  }

  static async #onPartySafeRest(event) {
    await this.#partyRest("safeRest", "SHIFT.Party.SafeRestConfirm", { override: !!event?.shiftKey });
  }

  static async #onPartyUnsafeRest() {
    await this.#partyRest("unsafeRest", "SHIFT.Party.UnsafeRestConfirm");
  }

  /** Executa um rest por membro após uma confirmação. Sensível à localização: num
   *  landmark Unsafe, um Safe Rest é bloqueado (SHIFT+clique sobrepõe), e no modo de
   *  rest Challenging o dado Wealth da Location limita automaticamente a recuperação
   *  do Safe Rest (sem prompt). Fora isso, o fluxo de rest de cada membro (prompts,
   *  chat, XP) roda inalterado. */
  async #partyRest(method, confirmKey, { override = false } = {}) {
    if (!this.isEditable) return;
    const members = this.document.partyMembers.filter(m => typeof m[method] === "function");
    if (!members.length) return;

    const loc = await this.#locationContext();
    if (method === "safeRest" && loc?.landmarkSafe === false && !override) {
      return void ui.notifications.warn(
        game.i18n.format("SHIFT.Party.UnsafeLandmarkBlock", { landmark: loc.landmarkName }));
    }

    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: this.document.name },
      content: `<p>${game.i18n.format(confirmKey, { count: members.length })}</p>`,
      rejectClose: false
    });
    if (!ok) return;

    const opts = {};
    if (method === "safeRest" && game.settings.get("shift-vtt", "restMode") === "challenging" && loc?.wealthDie) {
      opts.wealthDie = loc.wealthDie;   // auto-cap; o safeRest do membro pula seu prompt
    }
    for (const m of members) await m[method](opts);
  }

  /* --- Location / active Vehicle -------------------------------- */

  static async #onClearLocation() {
    if (!this.isEditable) return;
    await this.document.update({ "system.location": "", "system.landmark": "" });
  }

  static async #onOpenLocation() {
    const loc = this.document.system.location ? await fromUuid(this.document.system.location) : null;
    loc?.sheet?.render(true);
  }

  static async #onClearVehicle() {
    if (!this.isEditable) return;
    await this.document.setActiveVehicle("");   // também limpa a crew do ex-vehicle
  }
}
