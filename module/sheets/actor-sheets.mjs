/**
 * SHIFT VTT, fichas de Actor concretas.
 */
import { BaseShiftActorSheet } from "./base-actor-sheet.mjs";
import { getAdvancements } from "../apps/advancement-config.mjs";
import { enrich, dieLabel, dieStatusLabel, fvtt } from "../helpers/utils.mjs";
import { requestPlayerRoll, emitOrRun } from "../helpers/socket.mjs";
import { travelEnabled } from "../settings.mjs";

const T = "systems/shift-vtt/templates";

/* ------------------------------------------------------------------ */
/* Character                                                           */
/* ------------------------------------------------------------------ */


export class ShiftCharacterSheet extends BaseShiftActorSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["character"],
    position: { width: 720, height: 820 },
    actions: { buyAdvancement: ShiftCharacterSheet.#onBuyAdvancement }
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
    // Editar o número de XP é restrito a Trusted Player+ / GM (anti-trapaça): players
    // só mudam XP por ganho automático ou gastando num chip (que loga no chat).
    context.canEditXp = this.isEditable && game.user.role >= CONST.USER_ROLES.TRUSTED;
    const session = this.document.system.xp?.session ?? 0;
    context.xpDots = Array.from({ length: context.xpLimit }, (_, i) => ({ on: i < session }));
    context.tabs = this._visibleTabs([
      { id: "traits", label: "SHIFT.Tabs.Traits", icon: "fa-dice-d20" },
      { id: "techniques", label: "SHIFT.Tabs.Techniques", icon: "fa-wand-sparkles" },
      { id: "biography", label: "SHIFT.Tabs.Notes", icon: "fa-book-open" }
    ]);
    return context;
  }

  /**
   * Clica num chip de advancement: confirma, e GASTA o XP (a mesa aplica o efeito,
   * pois a lista é configurável). Trava de 1 por sessão — o GM contorna a própria
   * trava por confirmação; um player que tenta um 2º pede aprovação ao GM via socket.
   * A compra é sempre anunciada no chat (rastro de auditoria; ver commitAdvancement).
   */
  static async #onBuyAdvancement(event, target) {
    if (!this.isEditable) return;
    const actor = this.document;
    const adv = getAdvancements()[Number(target.dataset.advIndex)];
    if (!adv) return;
    const cost = Math.max(0, Math.floor(adv.cost ?? 0));
    const have = actor.system.xp?.value ?? 0;
    if (have < cost) {
      return void ui.notifications.warn(game.i18n.format("SHIFT.Advancement.NotEnough", { cost, have }));
    }

    const confirmed = await fvtt.DialogV2.confirm({
      window: { title: game.i18n.localize("SHIFT.Advancement.BuyTitle") },
      content: `<p>${game.i18n.format("SHIFT.Advancement.BuyConfirm", {
        label: foundry.utils.escapeHTML(adv.label), cost
      })}</p>`,
      rejectClose: false
    });
    if (!confirmed) return;

    const limited = game.settings.get("shift-vtt", "oneAdvancementPerSession");
    const already = !!actor.getFlag("shift-vtt", "advancedThisSession");

    if (limited && already) {
      if (game.user.isGM) {
        // O GM contorna a própria trava de sessão por uma confirmação.
        const override = await fvtt.DialogV2.confirm({
          window: { title: game.i18n.localize("SHIFT.Advancement.OverrideTitle") },
          content: `<p>${game.i18n.format("SHIFT.Advancement.OverrideConfirm", {
            actor: foundry.utils.escapeHTML(actor.name)
          })}</p>`,
          rejectClose: false
        });
        if (!override) return;
        await actor.commitAdvancement({ label: adv.label, cost });
      } else {
        // Player: não gasta nada localmente; pede aprovação ao GM ativo, que decide e
        // efetiva (ele pode escrever o actor). Sem GM ativo, não há como aprovar.
        if (!game.users.activeGM) {
          return void ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NoGM"));
        }
        emitOrRun({
          action: "requestAdvancement",
          actorUuid: actor.uuid,
          userName: game.user.name,
          label: adv.label,
          cost
        });
        ui.notifications.info(game.i18n.localize("SHIFT.Advancement.Requested"));
      }
      return;
    }

    // 1º advancement da sessão (ou trava desligada): gasta direto.
    await actor.commitAdvancement({ label: adv.label, cost });
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
      removeCrew: ShiftVehicleSheet.#onRemoveCrew,
      setVehicleDomain: ShiftVehicleSheet.#onSetVehicleDomain
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
    const dom = this.document.system.domain;
    context.domainLabel = dom ? game.i18n.localize(CONFIG.SHIFT.vehicleDomains[dom] ?? "") : "";
    context.domainIcon = VEHICLE_DOMAIN_ICON[dom] ?? "fa-car-side";
    context.domainOptions = Object.entries(CONFIG.SHIFT.vehicleDomains).map(([k, v]) => ({
      value: k, label: game.i18n.localize(v),
      icon: VEHICLE_DOMAIN_ICON[k] ?? "fa-car-side",
      color: VEHICLE_DOMAIN_COLOR[k] ?? ROLE_COLORS.vehicle,
      selected: k === dom
    }));
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
    if (!this.isEditable) return;   // ApplicationV2 despacha o clique mesmo sem editable; o template só esconde
    const uuid = target.closest("[data-crew-uuid]")?.dataset.crewUuid;
    if (!uuid) return;
    const crew = (this.document.system.crew ?? []).filter(u => u !== uuid);
    await this.document.update({ "system.crew": crew });
  }

  /** Define/limpa o domínio do veículo (data-action="setVehicleDomain"); clicar no
   *  domínio já ativo limpa o campo. */
  static async #onSetVehicleDomain(event, target) {
    if (!this.isEditable) return;   // só o dono edita; o picker é escondido no template, mas o data-action dispara mesmo assim
    const d = target.dataset.domain;
    const cur = this.document.system.domain;
    await this.document.update({ "system.domain": d === cur ? "" : d });
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
    if (!this.isEditable) return;
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
    if (!this.isEditable) return;
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
  boss: "enemy", elite: "enemy", minion: "enemy",
  ally: "ally", npc: "npc", place: "location", vehicle: "vehicle", trait: "trait", technique: "technique"
};
const ROLE_ICONS = {
  boss: "fa-skull", elite: "fa-fire", minion: "fa-paw",
  ally: "fa-handshake", npc: "fa-user", place: "fa-map-location-dot", vehicle: "fa-car-side",
  trait: "fa-dice-d20", technique: "fa-bolt"
};
const ROLE_COLORS = {
  boss: "#de2b54", elite: "#f07d39", minion: "#ffc511",
  ally: "#45c465", npc: "#2f9fd0", place: "#ffce4a", vehicle: "#5b8def", trait: "#a06bff", technique: "#23bda6"
};
const ROLE_LABEL = {
  boss: "SHIFT.Party.Codex.Role.Boss", elite: "SHIFT.Party.Codex.Role.Elite",
  minion: "SHIFT.Party.Codex.Role.Minion",
  ally: "SHIFT.Party.Codex.Role.Ally", npc: "SHIFT.Party.Codex.Role.NPC",
  place: "SHIFT.Party.Codex.Role.Place", vehicle: "SHIFT.Party.Codex.Role.Vehicle",
  trait: "SHIFT.Party.Codex.Role.Trait", technique: "SHIFT.Party.Codex.Role.Technique"
};
/** Ícone/cor por domínio de Vehicle (campo system.domain). */
const VEHICLE_DOMAIN_ICON = {
  land: "fa-car-side", sea: "fa-anchor", air: "fa-plane",
  space: "fa-rocket", underground: "fa-mountain", mixed: "fa-shuffle"
};
const VEHICLE_DOMAIN_COLOR = {
  land: "#6bbf59", sea: "#2f9fd0", air: "#37c0c0",
  space: "#a06bff", underground: "#c0883f", mixed: "#9aa0a6"
};
/** Cor por Scale (1–4) — a mesma rampa dos pips de Scale; tinge as Locations no Codex. */
const SCALE_COLOR = { 1: "#45c465", 2: "#ffc511", 3: "#f07d39", 4: "#de2b54" };
/** Tier de um NPC pelo Power — mesmos recortes dos hostiles, sem Power 0:
 *  ≤2 Commoner · 3–4 Elite · 5+ Legendary ("Elite" reusa a chave do hostil). */
const NPC_TIER_LABEL = {
  commoner: "SHIFT.Party.Codex.Role.Commoner",
  elite: "SHIFT.Party.Codex.Role.Elite",
  legendary: "SHIFT.Party.Codex.Role.Legendary"
};
const NPC_TIER_COLOR = { commoner: "#2f9fd0", elite: "#ff5fa2", legendary: "#a06bff" };
function npcTier(power) {
  const p = power ?? 0;
  return p >= 5 ? "legendary" : p >= 3 ? "elite" : "commoner";
}
/** id do filtro → os grupos que ele casa (null = todos). Grupos vazios são
 *  ocultados na renderização (ver #codexContext), então só aparecem categorias
 *  com conteúdo. */
const CODEX_FILTERS = {
  all: null, enemy: ["enemy"], ally: ["ally"], npc: ["npc"],
  location: ["location"], landmark: ["landmark"],
  trait: ["trait"], technique: ["technique"], vehicle: ["vehicle"]
};
/** Botões de filtro ordenados (chaves de label). `all` sempre aparece; os demais
 *  só quando o grupo deles tem ao menos uma entrada. */
const CODEX_FILTER_BUTTONS = [
  { id: "all", label: "SHIFT.Party.Codex.All", group: null },
  { id: "enemy", label: "SHIFT.Party.Codex.Enemies", group: "enemy" },
  { id: "ally", label: "SHIFT.Party.Codex.Allies", group: "ally" },
  { id: "npc", label: "SHIFT.Party.Codex.NPCs", group: "npc" },
  { id: "location", label: "SHIFT.Party.Codex.Locations", group: "location" },
  { id: "landmark", label: "SHIFT.Party.Codex.Landmarks", group: "landmark" },
  { id: "vehicle", label: "SHIFT.Party.Codex.Vehicles", group: "vehicle" },
  { id: "trait", label: "SHIFT.Party.Codex.Traits", group: "trait" },
  { id: "technique", label: "SHIFT.Party.Codex.Techniques", group: "technique" }
];
/** As flags de reveal por campo, em ordem de exibição (fonte única de verdade).
 *  "description" revela a Description (system.description) do Actor; a GM Note é
 *  sempre privada do GM, então NÃO tem flag de reveal. */
const REVEAL_FIELDS = ["name", "concept", "stats", "defeat", "traits", "scale", "description"];

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
  if (doc instanceof Item) {
    if (doc.type === "technique") return "technique";
    if (doc.type === "landmark") return "place";   // role cosmético; o GRUPO de filtro do landmark é "landmark" (ver #landmarkCardShape)
    return "trait";
  }
  if (doc?.type === "location") return "place";
  if (doc?.type === "vehicle") return "vehicle";
  const D = CONST.TOKEN_DISPOSITIONS;
  const disp = doc?.prototypeToken?.disposition ?? doc?.token?.disposition ?? null;
  if (disp === D.HOSTILE) {
    const p = doc.system?.power ?? 0;
    return p >= 5 ? "boss" : p >= 3 ? "elite" : "minion";
  }
  if (disp === D.FRIENDLY) return "ally";
  return "npc"; // NEUTRAL / SECRET / não definido
}

/** O "kind" do codex; seleciona o layout de card/detalhe por tipo no template. */
function codexKind(doc) {
  if (doc instanceof Item) {
    if (doc.type === "technique") return "technique";
    if (doc.type === "landmark") return "landmark";
    return "trait";
  }
  if (doc?.type === "location") return "location";
  if (doc?.type === "vehicle") return "vehicle";
  return "actor"; // character / adversary
}

/** Texto do TYPE localizado (TYPES.Actor.x / TYPES.Item.x). */
function typeLabelOf(doc) {
  return game.i18n.localize(`TYPES.${doc instanceof Item ? "Item" : "Actor"}.${doc.type}`);
}

/** Cor de destaque (--role) de um card de Codex: Traits seguem o DADO MÁX; Techniques
 *  a CATEGORIA (narrative/mechanical/scaledUp); os demais, o role. */
const TECH_ACCENT = { narrative: "var(--shift-yellow)", mechanical: "var(--shift-blue)", scaledUp: "var(--shift-pink)" };
function codexAccent(doc, role, kind) {
  if (kind === "landmark") return doc.system.safe ? "var(--shift-safe)" : "var(--shift-unsafe)";
  if (kind === "technique") return TECH_ACCENT[doc.system.techniqueType] ?? ROLE_COLORS.technique;
  if (kind === "trait") return `var(--die-${doc.system.maxDie || "d6"})`;
  if (kind === "vehicle") return VEHICLE_DOMAIN_COLOR[doc.system.domain] ?? ROLE_COLORS.vehicle;
  if (kind === "location") return SCALE_COLOR[doc.system.scale] ?? ROLE_COLORS.place;
  if (role === "npc") return NPC_TIER_COLOR[npcTier(doc.system.power)];
  return ROLE_COLORS[role] ?? "#b5a4b3";
}

/** Subtítulo do card, sempre no formato "<amplo> · <específico>": Adversaries
 *  "Minion · Adversary", Vehicles "Vehicle · Vehicle", Traits "Trait · Focus Trait",
 *  Techniques "Technique · Mechanical". */
function codexRoleLabel(doc, role, kind) {
  if (kind === "landmark") {
    const sub = game.i18n.localize(doc.system.safe ? "SHIFT.Location.Safe" : "SHIFT.Location.Unsafe");
    return `${typeLabelOf(doc)} · ${sub}`;   // "Landmark · Safe" / "Landmark · Unsafe"
  }
  if (kind === "trait") {
    const cat = game.i18n.localize(CONFIG.SHIFT.traitCategories[doc.system.category] ?? "");
    return cat ? `${typeLabelOf(doc)} · ${cat}` : typeLabelOf(doc);
  }
  if (kind === "technique") {
    const tt = game.i18n.localize(CONFIG.SHIFT.techniqueTypes[doc.system.techniqueType] ?? "");
    return tt ? `${typeLabelOf(doc)} · ${tt}` : typeLabelOf(doc);
  }
  if (kind === "location") {
    const sz = game.i18n.localize(CONFIG.SHIFT.locationSizes[doc.system.scale] ?? "");
    return sz ? `${typeLabelOf(doc)} · ${sz}` : typeLabelOf(doc);
  }
  if (kind === "vehicle" && doc.system.domain) {
    const dl = game.i18n.localize(CONFIG.SHIFT.vehicleDomains[doc.system.domain] ?? "");
    if (dl) return `${typeLabelOf(doc)} · ${dl}`;
  }
  if (role === "npc") {
    const tier = game.i18n.localize(NPC_TIER_LABEL[npcTier(doc.system.power)]);
    return `${tier} · ${game.i18n.localize(ROLE_LABEL.npc)}`;
  }
  const rl = game.i18n.localize(ROLE_LABEL[role] ?? "");
  const tl = typeLabelOf(doc);
  return rl ? `${rl} · ${tl}` : tl;
}

function byTraitOrder(a, b) {
  const ai = PARTY_TRAIT_ORDER.indexOf(a.system.category);
  const bi = PARTY_TRAIT_ORDER.indexOf(b.system.category);
  return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
    || (a.sort ?? 0) - (b.sort ?? 0)
    || a.name.localeCompare(b.name);
}

/**
 * Prompt compartilhado de "Grant XP" (party sheet + macro `game.shift.api.grantXp`):
 * escolhe a quantia e quais characters num diálogo e concede XP sem limite (prêmio
 * do GM, vai pro chat). Sem `characters`, mira todos os characters que o usuário
 * possui. Lê o form na mão (sem FormDataExtended). Retorna o nº de alvos premiados.
 * @param {ShiftActor[]} [characters]
 * @returns {Promise<number>}
 */
export async function promptGrantXp(characters) {
  const chars = (characters ?? game.actors.filter(a => a.type === "character" && a.isOwner))
    .filter(m => m?.type === "character");
  if (!chars.length) {
    ui.notifications.info(game.i18n.localize("SHIFT.Party.NoCharacters"));
    return 0;
  }
  const esc = foundry.utils.escapeHTML;
  const rows = chars.map(m => `
      <label class="party-xp-row">
        <input type="checkbox" name="pick" value="${m.id}" checked/>
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
  const res = await foundry.applications.api.DialogV2.prompt({
    window: { title: game.i18n.localize("SHIFT.Party.GrantXp"), icon: "fa-solid fa-arrow-trend-up" },
    position: { width: 380 },
    classes: ["shift-vtt", "shift-dialog"],
    content, rejectClose: false,
    ok: {
      label: game.i18n.localize("SHIFT.Party.GrantXp"),
      callback: (event, button) => ({
        amount: Number(button.form.elements.amount.value) || 0,
        ids: Array.from(button.form.querySelectorAll('input[name="pick"]:checked')).map(i => i.value)
      })
    }
  }).catch(() => null);
  if (!res) return 0;
  const amount = Math.max(1, Math.floor(res.amount));
  if (!amount || !res.ids.length) return 0;
  let n = 0;
  for (const id of res.ids) {
    const m = chars.find(c => c.id === id);
    if (m && await m.addXP(amount, { limited: false, reason: game.i18n.localize("SHIFT.Party.GrantXp"), toChat: true })) n++;
  }
  if (n) ui.notifications.info(game.i18n.format("SHIFT.Party.XpGranted", { amount, count: n }));
  return n;
}

/**
 * Diálogo "Request an Action Roll" do GM (ficha de Party + macro `game.shift.api.requestRoll`):
 * escolhe o character (cards de retrato), os Traits permitidos (nenhum = todos), o roll type e
 * se inclui os Traits do Vehicle tripulado (toggle, OFF por padrão); então o(s) Player(s) dono(s)
 * recebem o prompt de Action Roll restrito. GM-only.
 * @param {Actor} party
 */
export async function promptRequestRoll(party) {
  if (!game.user.isGM) return;
  if (!party || party.type !== "party") return void ui.notifications.warn(game.i18n.localize("SHIFT.Party.NoParties"));
  const chars = party.partyMembers.filter(m => m.type === "character");
  if (!chars.length) return void ui.notifications.info(game.i18n.localize("SHIFT.Party.NoCharacters"));

  // Espelha o diálogo de Action Roll padrão: character por cards de retrato, Traits
  // permitidos como cards de trait-opt, radios de tipo de roll, e o toggle de Vehicle.
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
          return {
            charId, traits,
            rollType: form.elements.rollType?.value || "normal",
            includeVehicles: !!form.elements.includeVehicles?.checked
          };
        }
      }
    });
  } catch (err) { return; }
  if (!data?.charId) return;

  const character = chars.find(m => m.id === data.charId);
  if (!character) return;
  // Mira o(s) Player(s) dono(s) do character online; fallback para o GM.
  const owners = game.users.filter(u => u.active && !u.isGM && character.testUserPermission(u, "OWNER"));
  const targets = owners.length ? owners : [game.user];
  for (const u of targets) {
    requestPlayerRoll({
      userId: u.id, actorUuid: character.uuid,
      allowedTraits: data.traits, rollType: data.rollType, includeVehicles: data.includeVehicles
    });
  }
  if (owners.length) ui.notifications.info(game.i18n.format("SHIFT.Party.RequestRoll.Sent", { count: owners.length, actor: character.name }));
  else ui.notifications.warn(game.i18n.localize("SHIFT.Party.RequestRoll.NoOwner"));
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

  /** Filtro/busca/abertura do Codex + tile de trait aberto são estado de view transitório.
   *  O filtro do Codex é MULTI-SELEÇÃO: um Set de ids de categoria ativos; vazio = "All". */
  _codexFilters = new Set();
  _codexQuery = "";
  _codexOpen = null;
  _openTile = null;
  /** Guarda de reentrância para a criação lazy do journal de codex no lado do GM. */
  #ensuringJournal = false;
  /** Drag-data bruto do drop em curso (capturado em _onDrop antes do core resolver
   *  o documento de forma async); só vale durante o handling de um drop. */
  #dropData = null;
  /** Quests-mãe com as filhas RECOLHIDAS (ids). Estado de view transitório. */
  #questCollapsed = new Set();
  /** Quests com o corpo INVERTIDO do padrão de abertura (clique do usuário). O
   *  default é: topo ou com filhas = expandida; filha-folha = compacta. */
  #questFlipped = new Set();

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["party"],
    position: { width: 910, height: 784 },
    actions: {
      removeMember: ShiftPartySheet.#onRemoveMember,
      openMember: ShiftPartySheet.#onOpenMember,
      toggleTile: ShiftPartySheet.#onToggleTile,
      codexFilter: ShiftPartySheet.#onCodexFilter,
      openCodexEntry: ShiftPartySheet.#onOpenCodexEntry,
      codexBack: ShiftPartySheet.#onCodexBack,
      removeCodexEntry: ShiftPartySheet.#onRemoveCodexEntry,
      revealCodexEntry: ShiftPartySheet.#onRevealCodexEntry,
      revealAllCodex: ShiftPartySheet.#onRevealAllCodex,
      hideAllCodex: ShiftPartySheet.#onHideAllCodex,
      toggleCodexReveal: ShiftPartySheet.#onToggleCodexReveal,
      toggleCodexLandmark: ShiftPartySheet.#onToggleCodexLandmark,
      toggleLandmarkVisible: ShiftPartySheet.#onToggleLandmarkVisible,
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
      openVehicle: ShiftPartySheet.#onOpenVehicle,
      grantPartyXp: ShiftPartySheet.#onGrantPartyXp,
      requestPartyRoll: ShiftPartySheet.#onRequestRoll,
      partySafeRest: ShiftPartySheet.#onPartySafeRest,
      partyUnsafeRest: ShiftPartySheet.#onPartyUnsafeRest,
      travelStart: ShiftPartySheet.#onTravelStart,
      travelAdvance: ShiftPartySheet.#onTravelAdvance,
      travelArrive: ShiftPartySheet.#onTravelArrive,
      travelFinish: ShiftPartySheet.#onTravelFinish,
      travelAbort: ShiftPartySheet.#onTravelAbort
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
    context.codexQuery = this._codexQuery;
    // Só categorias que realmente contêm entradas ganham um botão de filtro; cada um
    // já carrega seu estado `active` (multi-seleção). "All" fica ativo quando nada está.
    // (#codexContext acima já podou filtros de categorias esvaziadas deste Set.)
    const active = this._codexFilters;
    context.codexFilters = CODEX_FILTER_BUTTONS
      .filter(b => b.group === null || (codex.counts[b.group] ?? 0) > 0)
      .map(b => ({ ...b, active: b.id === "all" ? active.size === 0 : active.has(b.id) }));

    context.locationInfo = await this.#locationContext();
    context.activeVehicle = await this.#vehicleContext();
    context.travelEnabled = travelEnabled();
    context.journey = this.#travelContext();

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
    const keywords = this.#descriptors("keyword", sys.keywords, host, canView);
    const drawbacks = this.#descriptors("drawback", sys.drawbacks, host, canView);
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

  /** @override — Players com permissão de OBSERVER no party podem ROLAR os Traits e
   *  Quests compartilhados, mesmo sem possuir o actor (o engine relaya o shift via
   *  socket para o GM). Editar/shiftar/ocultar continua exigindo OWNER. */
  get canRollTraits() {
    return this.document.testUserPermission(game.user, "OBSERVER");
  }

  /** Monta os updates de ocultar/revelar uma Quest E propaga pelas filhas, sempre
   *  incluindo a própria (índice 0). O `seen` guarda contra ciclos em dados ruins.
   *
   *  Ocultar: leva junto SÓ as filhas atualmente visíveis (marcando cascadeHidden),
   *  parando ao topo de uma subárvore já oculta — assim uma filha que o GM já tinha
   *  ocultado por conta própria não vira "oculta pela mãe".
   *
   *  Revelar: restaura SÓ as filhas ocultas PELA cascata (cascadeHidden), preservando
   *  as que o GM ocultou sozinho. A própria Quest sempre zera cascadeHidden (o toggle
   *  do GM nela É uma ação própria). */
  #questRevealCascade(item, revealed) {
    const updates = [{ _id: item.id, "system.revealed": revealed, "system.cascadeHidden": false }];
    const seen = new Set([item.id]);
    const walk = revealed
      ? q => {
          for (const c of q.childQuests ?? []) {
            if (seen.has(c.id) || !c.system.cascadeHidden) continue;   // só desce no que a cascata ocultou
            seen.add(c.id);
            updates.push({ _id: c.id, "system.revealed": true, "system.cascadeHidden": false });
            walk(c);
          }
        }
      : q => {
          for (const c of q.childQuests ?? []) {
            if (seen.has(c.id) || !c.system.revealed) continue;        // já oculta → subárvore consistente, não toca
            seen.add(c.id);
            updates.push({ _id: c.id, "system.revealed": false, "system.cascadeHidden": true });
            walk(c);
          }
        };
    walk(item);
    return updates;
  }

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
      canRoll: q.canRoll && this.canRollTraits,
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
      canResolve, canFail, canReopen
      // (O rodapé é só de links: renderiza quando `expanded && links.length`. O
      //  desfecho Resolve/Fail/Reopen agora mora no cabeçalho — ver ptrait-card.hbs.)
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

    // Landmarks de uma Location catalogada são exibidos como cards próprios (grupo
    // Places), sincronizados com o revealLandmarks da Location. Junta os UUIDs deles
    // para deduplicar uma eventual entrada SOLTA do mesmo landmark embutido.
    const embeddedLm = new Set();
    for (const doc of docs)
      if (doc?.type === "location")
        for (const lm of doc.items?.filter?.(i => i.type === "landmark") ?? []) embeddedLm.add(lm.uuid);

    const all = [];
    const counts = {};
    // Conta categorias com conteúdo para que botões de filtro vazios se ocultem.
    // Rumores travados ("???") TAMBÉM contam: por design eles aparecem na própria
    // categoria mesmo ocultos, então o botão dessa categoria precisa existir.
    const push = card => {
      if (!card) return;                                // referência quebrada / oculto a players
      counts[card.group] = (counts[card.group] ?? 0) + 1;
      all.push(card);
    };
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i], doc = docs[i];
      // Um landmark embutido já é exibido pela sua Location: não o duplica como entrada solta.
      if (doc instanceof Item && doc.type === "landmark" && embeddedLm.has(entry.uuid)) continue;
      push(this.#codexCard(entry, doc, isGM));
      // Location → expande cada landmark embutido num card de Place próprio.
      if (doc?.type === "location")
        for (const lm of doc.items?.filter?.(i => i.type === "landmark") ?? [])
          push(this.#landmarkCard(entry, lm, isGM));
    }

    // Codex sempre exibido em ordem alfabética (a ordem de inserção não importa).
    // Ordena pelo nome EXIBIDO, nunca pelo verdadeiro de uma entrada oculta (senão
    // a posição vazaria a identidade); rumores "???"/"Unknown" vão ao fim, pois não
    // têm nome real pra ordenar. numeric+base => "Guarda 2" antes de "Guarda 10" e
    // acentos ordenam de forma natural. (Array.sort é estável.)
    all.sort((a, b) => {
      const ca = a.locked || a.nameHidden, cb = b.locked || b.nameHidden;
      if (ca !== cb) return ca ? 1 : -1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    });

    // Multi-seleção: descarta filtros cujo grupo esvaziou (última entrada removida),
    // pra grade nunca ficar falsamente vazia sob um botão que sumiu; Set vazio = "All".
    const selected = this._codexFilters;
    for (const id of [...selected]) {
      const groups = CODEX_FILTERS[id];
      if (!groups || !groups.some(g => (counts[g] ?? 0) > 0)) selected.delete(id);
    }
    // União dos grupos de TODOS os filtros ativos; null = nenhum filtro → mostra tudo.
    const filterGroups = selected.size
      ? new Set([...selected].flatMap(id => CODEX_FILTERS[id] ?? [])) : null;

    const cards = all.filter(card => {
      // Uma entrada aparece na sua categoria mesmo travada/oculta ("???") — o filtro
      // só corta pelo grupo da entrada, sem esconder rumores dos Players.
      if (filterGroups && !filterGroups.has(card.group)) return false;
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

  /** Coleta tags de Keyword/Drawback dos Traits de um actor, marcadas por tipo
   *  para colorização (kw = azul, db = vermelho). */
  #codexTags(actor) {
    const traits = actor.items?.filter?.(i => i.type === "trait") ?? [];
    const collect = (key, kind, max) => {
      const out = [], seen = new Set();
      for (const t of traits) for (const v of t.system[key] ?? []) {
        const label = String(v ?? "").trim();
        if (!label || seen.has(label.toLowerCase())) continue;
        seen.add(label.toLowerCase());
        out.push({ label, kind });
        if (out.length >= max) return out;
      }
      return out;
    };
    return [...collect("keywords", "kw", 4), ...collect("drawbacks", "db", 3)];
  }

  /** Card de Place para um landmark, no formato compartilhado por entradas SOLTAS
   *  (Item de landmark catalogado por si) e VIRTUAIS (landmark embutido de uma
   *  Location, exibido como página própria). Tudo all-or-nothing: um landmark é um
   *  lugar conhecido ou um rumor "???". */
  #landmarkCardShape(lm, { uuid, virtual, locked, partlyHidden, landmarkVisible }) {
    const safe = !!lm.system?.safe;
    // Landmark embutido numa Location → chip com o nome dela (pin de local, como nos
    // links de Quest). Um landmark solto (parent nulo) não tem chip; um rumor "???" também não.
    const loc = (lm.parent?.documentName === "Actor" && lm.parent.type === "location") ? lm.parent : null;
    const locationName = locked ? "" : (loc?.name ?? "");
    return {
      uuid, role: "place", kind: "landmark", group: "landmark",
      virtual, locked, nameHidden: false, partlyHidden, landmarkVisible, safe, locationName,
      name: locked ? "???" : lm.name,
      img: locked ? null : (lm.img || null),
      icon: safe ? "fa-shield-heart" : "fa-triangle-exclamation",
      accent: safe ? "var(--shift-safe)" : "var(--shift-unsafe)",
      hasStatRow: false, showScale: false, scale: 1,
      roleLabel: locked ? game.i18n.localize("SHIFT.Party.Codex.Locked") : codexRoleLabel(lm, "place", "landmark"),
      nameLower: locked ? "" : String(lm.name).toLowerCase(),
      tagsLower: ""
    };
  }

  /** Card virtual de um landmark embutido numa Location catalogada. Visível ao player
   *  só quando o GM revelou o landmark (revealLandmarks); ao GM, sempre (com selo de
   *  "parcialmente oculto"). Devolve null quando deve sumir para o player. */
  #landmarkCard(locEntry, lm, isGM) {
    const revealed = !!locEntry.revealLandmarks?.includes(lm.id);
    if (!isGM && !revealed) return null;                // players: oculto até ser revelado
    return this.#landmarkCardShape(lm, {
      uuid: lm.uuid, virtual: true,
      locked: false, partlyHidden: isGM && !revealed, landmarkVisible: revealed
    });
  }

  /** Um card da GRADE do codex, customizado por kind. `doc` já vem resolvido pelo chamador. */
  #codexCard(entry, doc, isGM) {
    if (!doc) return null;
    // Landmark solto (Item catalogado por si): visível ao player só quando o nome foi
    // revelado; senão é um rumor "???" (consistente com as demais entradas catalogadas).
    if (codexKind(doc) === "landmark") {
      const reveal = entry.reveal ?? {};
      const visible = isGM || !!reveal.name;
      return this.#landmarkCardShape(doc, {
        uuid: entry.uuid, virtual: false,
        locked: !visible, partlyHidden: isGM && !reveal.name, landmarkVisible: !!reveal.name
      });
    }
    const r = entry.reveal ?? {};
    const see = k => isGM || !!r[k];
    const anyRevealed = isGM || REVEAL_FIELDS.some(k => r[k]) || (entry.revealLandmarks?.length > 0);
    const locked = !anyRevealed;             // um verdadeiro rumor "???" (nada revelado)
    const nameHidden = !see("name");
    const conceal = locked || nameHidden;    // oculta a identidade (nome + retrato)
    const role = deriveCodexRole(doc);
    const kind = codexKind(doc);
    const lower = s => String(s ?? "").toLowerCase();
    // Scale: actors (character/adversary/location/vehicle) guardam em system.scale
    // (número); traits em system.scale.value; techniques não têm scale real. No FRONT
    // o chip de scale só aparece quando > 1 (regra: só quando a scale é maior que 1).
    const scale = doc instanceof Item ? (doc.system.scale?.value ?? 1) : (doc.system.scale ?? 1);
    const showScale = see("scale") && scale > 1;
    const base = {
      uuid: entry.uuid, role, kind, group: ROLE_GROUP[role] ?? "ally",
      locked, nameHidden,
      partlyHidden: isGM && !this.#fullyRevealed(entry, doc),
      name: locked ? "???" : (nameHidden ? game.i18n.localize("SHIFT.Party.Codex.Unknown") : doc.name),
      img: conceal ? null : doc.img, icon: ROLE_ICONS[role] ?? "fa-question",
      accent: codexAccent(doc, role, kind),
      hasStatRow: kind === "actor" || kind === "location" || showScale,
      showScale, scale,
      roleLabel: locked ? game.i18n.localize("SHIFT.Party.Codex.Locked")
        : codexRoleLabel(doc, role, kind),
      nameLower: conceal ? "" : lower(doc.name)
    };
    if (locked) return base;                  // um card de rumor não precisa de mais nada

    // Technique: categoria + cor já vêm no subtítulo/accent (base); sem stats na grade.
    if (kind === "technique") return base;
    if (kind === "trait") {
      const tags = see("traits")
        ? [
            ...(doc.system.keywords ?? []).map(label => ({ label: String(label), kind: "kw" })),
            ...(doc.system.drawbacks ?? []).map(label => ({ label: String(label), kind: "db" }))
          ].filter(t => t.label).slice(0, 5) : [];
      // O dado vira a cor de destaque (accent = dado máx); sem pill de status na grade.
      return Object.assign(base, { tags, tagsLower: tags.map(t => lower(t.label)).join(" ") });
    }
    if (kind === "location") {
      const lms = doc.items?.filter?.(i => i.type === "landmark") ?? [];
      const shown = lms.filter(l => isGM || entry.revealLandmarks?.includes(l.id));
      const tags = see("traits") ? this.#codexTags(doc) : [];
      return Object.assign(base, {
        showStats: see("stats"),
        landmarkCount: shown.length,
        tags, tagsLower: tags.map(t => lower(t.label)).join(" ")
      });
    }
    if (kind === "vehicle") {
      // Sem stat row: o domínio já aparece no subtítulo (role label); só as tags.
      const tags = see("traits") ? this.#codexTags(doc) : [];
      return Object.assign(base, { tags, tagsLower: tags.map(t => lower(t.label)).join(" ") });
    }
    // actor (character / adversary)
    const defeat = doc.system.defeat ?? { value: 0, max: 0 };
    const tags = see("traits") ? this.#codexTags(doc) : [];
    return Object.assign(base, {
      showStats: see("stats"),
      power: doc.system.power ?? 0, actions: doc.system.actions ?? doc.system.power ?? 0,
      showDefeat: see("defeat") && !!defeat.max, defeat,
      tags, tagsLower: tags.map(t => lower(t.label)).join(" ")
    });
  }

  /** Resolve um UUID aberto do codex no seu alvo: uma entrada SOLTA real, ou um
   *  landmark VIRTUAL (embutido numa Location catalogada — então sem entrada própria,
   *  mas navegável pela entrada da Location). Devolve null quando nada resolve. */
  async #resolveCodexTarget(uuid) {
    const codex = this.document.system.codex ?? [];
    const doc = await fromUuid(uuid).catch(() => null);
    if (!doc) return null;
    const entry = codex.find(e => e.uuid === uuid);
    if (entry) return { entry, doc, virtual: false };
    // Virtual: um landmark embutido cuja Location-mãe está catalogada.
    if (doc instanceof Item && doc.type === "landmark" && doc.parent instanceof Actor) {
      const locEntry = codex.find(e => e.uuid === doc.parent.uuid);
      if (locEntry) return { entry: locEntry, doc, virtual: true, lmId: doc.id };
    }
    return null;
  }

  /** Detalhe de uma página de landmark (solto OU virtual). Visibilidade all-or-nothing;
   *  a do virtual segue o revealLandmarks da Location-mãe (sincronizado com a lista
   *  aninhada). Field Notes só no landmark SOLTO (o virtual é leve, parte da Location).
   *  Description e GM Note saem direto do Item (mesma config das demais entradas):
   *  a Description aparece quando o landmark está visível; a GM Note é só do GM. */
  async #landmarkDetailContext({ entry, doc, virtual, lmId }) {
    const isGM = game.user.isGM;
    const safe = !!doc.system.safe;
    const landmarkVisible = virtual
      ? !!entry.revealLandmarks?.includes(lmId)
      : !!entry.reveal?.name;
    if (!isGM && !landmarkVisible) return null;          // um landmark oculto não abre para o player
    const canViewDesc = isGM || !!doc.testUserPermission?.(game.user, "OBSERVER");
    const loc = (doc.parent?.documentName === "Actor" && doc.parent.type === "location") ? doc.parent : null;
    const hasGmNote = "gmNote" in (doc.system ?? {});
    const showDesc = canViewDesc && !!this.#plain(doc.system.description).trim();
    return {
      uuid: doc.uuid, isGM, kind: "landmark", role: "place",
      roleColor: safe ? "var(--shift-safe)" : "var(--shift-unsafe)",
      name: doc.name, img: doc.img || null,
      icon: safe ? "fa-shield-heart" : "fa-triangle-exclamation",
      roleLabel: codexRoleLabel(doc, "place", "landmark"),
      locationName: loc?.name ?? "",
      safe, canOpenSheet: isGM, canEditReveal: isGM,
      landmarkVisible, landmarkVirtual: virtual,
      showDesc,
      desc: showDesc ? await enrich(doc.system.description, { secrets: isGM, relativeTo: doc }) : "",
      showGmNote: isGM && hasGmNote,
      gmNoteSource: (isGM && hasGmNote) ? (doc.system._source?.gmNote ?? doc.system.gmNote ?? "") : "",
      fieldNotes: virtual ? null : await this.#fieldNotesContext(entry),
      editable: this.isEditable
    };
  }

  async #codexDetailContext() {
    const uuid = this._codexOpen;
    if (!uuid) return null;
    const target = await this.#resolveCodexTarget(uuid);
    if (!target) return null;
    const { entry, doc } = target;
    const isGM = game.user.isGM;
    const kind = codexKind(doc);

    // Landmark: página própria de um landmark solto ou embutido (visibilidade sincronizada).
    if (kind === "landmark") return this.#landmarkDetailContext(target);

    const r = entry.reveal ?? {};
    const see = k => isGM || !!r[k];
    const anyRevealed = isGM || REVEAL_FIELDS.some(k => r[k]) || (entry.revealLandmarks?.length > 0);
    if (!anyRevealed) return null;                  // um verdadeiro rumor não pode ser aberto
    const nameHidden = !see("name");
    const canViewDesc = isGM || !!doc.testUserPermission?.(game.user, "OBSERVER");
    const role = deriveCodexRole(doc);

    // Description (system.description): bloco read-only revelável aos players, igual em
    // TODA entrada que tem descrição própria (actor/location/vehicle + trait/technique).
    // Só os kinds com um campo `concept` SEPARADO (actor/location/vehicle) mostram também
    // o subtítulo curto; trait/technique não têm concept próprio (era um excerto da própria
    // descrição), então deixam só a Description full pra não duplicar.
    const kindHasDesc = ["actor", "location", "vehicle", "trait", "technique"].includes(kind);
    const kindHasConcept = ["actor", "location", "vehicle"].includes(kind);
    const showDesc = kindHasDesc && see("description") && !!this.#plain(doc.system.description).trim();
    // GM Note: o MESMO system.gmNote da ficha do Actor (Adversary/Vehicle/Location),
    // sempre privada do GM, editável aqui e sincronizada com a ficha.
    const hasGmNote = "gmNote" in (doc.system ?? {});

    const base = {
      uuid, isGM, kind, reveal: r, canEditReveal: isGM, nameHidden,
      role, roleColor: codexAccent(doc, role, kind),
      name: nameHidden ? game.i18n.localize("SHIFT.Party.Codex.Unknown") : doc.name,
      img: nameHidden ? null : doc.img, icon: ROLE_ICONS[role] ?? "fa-question",
      roleLabel: codexRoleLabel(doc, role, kind),
      editable: this.isEditable, canOpenSheet: isGM,
      showDesc,
      desc: showDesc
        ? await enrich(doc.system.description, { secrets: isGM, rollData: doc.getRollData?.() ?? {}, relativeTo: doc })
        : "",
      showGmNote: isGM && hasGmNote,
      gmNoteSource: (isGM && hasGmNote) ? (doc.system._source?.gmNote ?? doc.system.gmNote ?? "") : "",
      fieldNotes: await this.#fieldNotesContext(entry),
      revealFields: REVEAL_FIELDS
        .filter(f => (f !== "description" || kindHasDesc) && (f !== "concept" || kindHasConcept))
        .map(f => ({ f, on: !!r[f], label: `SHIFT.Party.Codex.Field.${cap(f)}` }))
    };

    if (kind === "technique") {
      return Object.assign(base, {
        concept: "",   // sem subtítulo derivado: a Description full já mostra o texto
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
        concept: "",   // sem subtítulo derivado: a Description full já mostra o texto
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
        showScale: see("scale"), scale: doc.system.scale ?? 1,
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
        showScale: see("scale"), scale: doc.system.scale ?? 1,
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

  /** Estado da jornada de Travel para o header (null = subsistema off ou sem
   *  viagem ativa). Legs viram bolinhas; o destino é só um rótulo aqui. */
  #travelContext() {
    if (!travelEnabled()) return null;
    const j = this.document.system.journey;
    if (!j?.active) return null;
    const total = Math.max(1, j.legsTotal ?? 1);
    const done = Math.min(total, j.legsDone ?? 0);
    const mode = j.mode || game.settings.get("shift-vtt", "travelMode");
    return {
      destName: j.destName || game.i18n.localize("SHIFT.Travel.Unknown"),
      flavor: j.flavor,
      hasDest: !!j.destUuid,
      legsTotal: total,
      legsDone: done,
      remaining: total - done,
      complete: done >= total,
      onFoot: j.onFoot,
      simple: mode === "simple",
      modeLabel: game.i18n.localize(CONFIG.SHIFT.travelModes[mode] ?? ""),
      dots: Array.from({ length: total }, (_, i) => ({ done: i < done }))
    };
  }

  /** Resolve a Location atual do party + o landmark escolhido (para a faixa do header
   *  e para as regras de Rest sensíveis à localização). */
  async #locationContext() {
    const uuid = this.document.system.location;
    if (!uuid) return null;
    const loc = await fromUuid(uuid);
    if (!loc) return null;
    // O "lugar" pode ser um landmark AVULSO (Item de mundo) solto direto no slot:
    // não tem sub-landmarks nem Wealth die, e carrega o próprio safe/unsafe — que
    // alimenta o bloqueio de Safe Rest num ponto Unsafe, como um landmark normal.
    if (loc instanceof Item && loc.type === "landmark") {
      const safe = !!loc.system.safe;
      return {
        uuid, name: loc.name, img: loc.img, wealthDie: null,
        landmarks: [], hasLandmarks: false,
        landmarkId: "", landmarkName: loc.name, landmarkSafe: safe,
        loose: true, canEdit: this.isEditable
      };
    }
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
    "openLocation", "openVehicle", "toggleTile"];

  /** @override — o DocumentSheetV2 desabilita TODO controle de formulário (inclusive
   *  `<button>`s) quando a ficha não é editável, o que travaria o clique do botão de
   *  voltar do codex, os tiles de expandir trait e os filtros para Players OBSERVER.
   *  Reabilita as view actions somente-leitura + os editores de field-notes; todos os
   *  handlers que mutam fazem self-gate. */
  _toggleDisabled(disabled) {
    super._toggleDisabled(disabled);
    if (!disabled || !this.element) return;
    const sel = ShiftPartySheet.VIEW_ACTIONS.map(a => `[data-action="${a}"]`).join(", ")
      + ", prose-mirror.codex-fieldnotes, textarea.cd-gmnote-edit";
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

      // GM Note do codex → o MESMO system.gmNote do documento referenciado (Actor OU
      // Item: adversary/vehicle/location e trait/technique/landmark), sincronizando com
      // a ficha dele. Nota simples: <textarea> sem `name` (o form do party o ignora);
      // salva no change (= blur), igual à nota de codex original. Só GM.
      if (game.user.isGM) {
        for (const el of this.element.querySelectorAll("textarea.cd-gmnote-edit")) {
          el.addEventListener("change", async ev => {
            ev.stopPropagation();
            const doc = el.dataset.documentUuid ? await fromUuid(el.dataset.documentUuid) : null;
            if (!doc) return;
            // Salva no próprio documento: a ficha dele (se aberta) reflete na hora; o
            // Codex aberto é repintado pelos hooks updateActor/updateItem (que pulam quem digita).
            try { await doc.update({ "system.gmNote": el.value ?? "" }); }
            catch (err) { ui.notifications.error(game.i18n.localize("SHIFT.Party.Codex.NotesFailed")); }
          });
        }
      }

      // GM: cada card do codex vira origem de arraste, exatamente como arrastar o
      // Actor/Item ligado — pode ser solto no slot de Location/Vehicle (vide
      // _onDropActor), no canvas, ou em outra ficha. Só para o GM: cards "locked"
      // (rumores "???") também ficam arrastáveis, então o gate evita vazar a um
      // player o uuid do documento por trás do segredo. (Drag e click coexistem: o
      // data-action="openCodexEntry" segue funcionando no clique.)
      if (game.user.isGM) {
        for (const card of this.element.querySelectorAll(".codex-card[data-codex-uuid]")) {
          card.setAttribute("draggable", "true");
          if (card.dataset.shiftDragBound) continue;
          card.dataset.shiftDragBound = "1";
          card.addEventListener("dragstart", ev => {
            const data = ShiftPartySheet.#codexDragData(card.dataset.codexUuid);
            if (!data) return;
            // Carimba a origem: soltar de volta neste mesmo codex é no-op silencioso
            // (a entrada já está catalogada — foi daqui que ela saiu). Vide _onDrop.
            data.shiftCodexSource = this.document.uuid;
            ev.dataTransfer.setData("text/plain", JSON.stringify(data));
            ev.dataTransfer.effectAllowed = "copy";
          });
        }
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
    //
    // (A GM Note do codex não mora mais aqui: é system.gmNote do próprio documento,
    // editada pelo <textarea class="cd-gmnote-edit"> acima.)
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

  /** @override — guarda o drag-data BRUTO deste drop antes que o core resolva o
   *  documento (a resolução é async; depois dela `dataTransfer.getData` já não é
   *  confiável). Os handlers `_onDropActor/_onDropItem` leem `#dropData` para saber
   *  se a entrada veio do PRÓPRIO codex (campo `shiftCodexSource`) e, nesse caso,
   *  evitar o aviso "já catalogado" ao soltá-la de volta. */
  async _onDrop(event) {
    try { this.#dropData = JSON.parse(event.dataTransfer?.getData("text/plain") || "null"); }
    catch (_) { this.#dropData = null; }
    return super._onDrop(event);
  }

  /** Verdadeiro se o drop atual é uma entrada arrastada do codex DESTE party (e
   *  portanto já catalogada) — usado para silenciar o "já catalogado" no auto-drop. */
  #isOwnCodexDrag() {
    return this.#dropData?.shiftCodexSource === this.document.uuid;
  }

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
    if (this.#isCodexDrop(event)) return this.#isOwnCodexDrag() ? true : this.#addCodexEntry(a.uuid);
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

    // Quest arrastada DENTRO da aba Quests:
    //  • já é uma quest DESTA party (id confere) → reordena/aninha pelo gesto de
    //    posição (metade direita = FILHA; esquerda = irmã antes/depois).
    //  • veio de FORA (mundo/compendium/outra party) → CRIA como quest desta party.
    // Em nenhum caso vira link de outra quest; o evento é sempre consumido aqui.
    // Detecção por id (não por doc.parent), robusto a instâncias diferentes do drag.
    if (doc.type === "quest" && this.#isQuestDrop(event)) {
      if (this.document.quests.some(q => q.id === doc.id)) await this.#sortQuestOnDrop(event, doc);
      else await this.#createQuestFromDrop(doc);
      return true;
    }

    // Reorder de um Trait possuído (mesma categoria).
    if (doc.parent === this.document && doc.type === "trait" && await this.#sortTraitOnDrop(event, doc)) return true;

    // Um Item externo (NÃO-quest) solto sobre um card de Quest vira um link daquela Quest.
    const questId = this.#questDropTarget(event);
    if (questId && doc.uuid && doc.type !== "quest") return this.#addQuestLink(questId, doc.uuid);

    // Um Landmark solto no slot de Location aponta o party para a Location-pai E
    // marca aquele landmark específico de uma vez (atalho de "estamos aqui").
    if (doc.type === "landmark" && this.#isLocationDrop(event)) return this.#setLandmark(doc);

    if (["trait", "technique", "landmark"].includes(doc.type) && this.#isCodexDrop(event))
      return this.#isOwnCodexDrag() ? true : this.#addCodexEntry(doc.uuid);

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

  /** Reordena um Trait por integer sort quando solto sobre um irmão da MESMA
   *  categoria. (Quests usam #sortQuestOnDrop.) Retorna true se tratou o evento. */
  async #sortTraitOnDrop(event, source) {
    const targetId = event.target?.closest?.("[data-item-id]")?.dataset.itemId;
    if (!targetId || targetId === source.id) return false;
    const target = this.document.items.get(targetId);
    if (target?.type !== "trait" || target.system.category !== source.system.category) return false;
    const siblings = this.document.items.filter(i =>
      i.type === "trait" && i.system.category === source.system.category && i.id !== source.id);
    const updates = foundry.utils.performIntegerSort(source, { target, siblings })
      .map(u => ({ _id: u.target.id, sort: u.update.sort }));
    if (updates.length) await this.document.updateEmbeddedDocuments("Item", updates);
    return true;
  }

  /** Conjunto de ids da subárvore de uma Quest (ela + todas as descendentes), para
   *  barrar que ela vire filha de si mesma ou de uma descendente (evita ciclo). */
  #questSubtreeIds(quest) {
    const ids = new Set([quest.id]);
    const walk = id => {
      for (const c of this.document.quests)
        if (c.system.parentId === id && !ids.has(c.id)) { ids.add(c.id); walk(c.id); }
    };
    walk(quest.id);
    return ids;
  }

  /** Gesto de arraste de Quest sobre Quest: a POSIÇÃO no card alvo decide, 50/50.
   *   • metade DIREITA (relX > 0.5) → ANINHA a source como subquest do alvo.
   *   • metade ESQUERDA → vira IRMÃ do alvo: topo = ANTES, base = DEPOIS,
   *     herdando o parentId do alvo (some-se ao mesmo nível dele).
   *  Espelha exatamente o feedback visual de drag-feedback.mjs (mesmos limiares). A
   *  source é resolvida PELO ID dentro desta party (robusto a instâncias diferentes
   *  do drag). O sort é recalculado DENTRO do grupo de destino pra casar com a árvore
   *  de #questGroup. Ciclos (alvo na própria subárvore) viram no-op. Uma escrita só. */
  async #sortQuestOnDrop(event, srcDoc) {
    const source = this.document.quests.find(q => q.id === srcDoc?.id);
    if (!source) return false;                              // quest de outra origem: ignora
    const card = event.target?.closest?.(".party-quests .ptrait[data-item-id]");
    const targetId = card?.dataset.itemId;
    if (!targetId || targetId === source.id) return false;  // fora de um card / sobre si: no-op
    const target = this.document.items.get(targetId);
    if (target?.type !== "quest") return false;

    const banned = this.#questSubtreeIds(source);          // source + descendentes (anti-ciclo)
    const rect = card.getBoundingClientRect();
    const relX = rect.width ? (event.clientX - rect.left) / rect.width : 0;
    const relY = rect.height ? (event.clientY - rect.top) / rect.height : 0.5;
    const nest = relX > 0.5;                                // metade direita = vira filha

    let parentId, sortTarget, sortBefore;
    if (nest) {
      if (banned.has(target.id)) return true;              // aninhar sob descendente = ciclo
      parentId = target.id;
    } else {
      parentId = target.system.parentId ?? "";
      if (banned.has(parentId)) return true;               // herdaria pai descendente = ciclo
    }
    const group = this.document.quests.filter(q => (q.system.parentId ?? "") === parentId && q.id !== source.id);
    if (nest) { sortTarget = group[group.length - 1] ?? null; sortBefore = false; }  // anexa ao fim das filhas
    else { sortTarget = target; sortBefore = relY <= 0.5; }

    // Recalcula o sort dentro do grupo de destino; injeta o parentId no update da
    // source mesmo quando ela só troca de pai (sem mudar de posição).
    const updates = sortTarget
      ? foundry.utils.performIntegerSort(source, { target: sortTarget, siblings: group, sortBefore })
          .map(u => ({ _id: u.target.id, sort: u.update.sort }))
      : [];
    let src = updates.find(u => u._id === source.id);
    if (!src) { src = { _id: source.id, sort: source.sort ?? 0 }; updates.push(src); }
    src["system.parentId"] = parentId;
    await this.document.updateEmbeddedDocuments("Item", updates);
    return true;
  }

  /** Cria uma Quest vinda de FORA (mundo/compendium/outra party) como quest DESTA
   *  party (Item embutido), no topo: zera o parentId (um id herdado apontaria pra uma
   *  quest que não existe aqui) e dá um _id novo. Depois é só arrastar pra reordenar/
   *  aninhar. Os links (system.links são uuids) seguem intactos. */
  async #createQuestFromDrop(doc) {
    const data = doc.toObject();
    delete data._id;
    data.system = foundry.utils.mergeObject(data.system ?? {}, { parentId: "" });
    return this.document.createEmbeddedDocuments("Item", [data]);
  }

  /** Solta uma Folder no party. Na aba Codex cataloga em lote: Actors (exceto outros
   *  parties) e Items do tipo trait/technique — espelhando os drops individuais de
   *  #onDropActor/#onDropItem. Uma Folder de Actors fora do Codex vira membros do
   *  roster; uma Folder de Items só tem sentido no Codex. */
  async _onDropFolder(event, folder) {
    if (!this.isEditable) return false;
    const isCodex = this.#isCodexDrop(event);

    // Folder de Items (Traits/Techniques/Landmarks): só catalogável no Codex, como o
    // drop individual (#onDropItem aceita trait/technique/landmark). Numa única escrita.
    if (folder?.type === "Item") {
      if (!isCodex) return false;
      return this.#addCodexEntries(folder.contents
        .filter(x => x instanceof Item && ["trait", "technique", "landmark"].includes(x.type))
        .map(x => x.uuid));
    }

    if (folder?.type !== "Actor") return false;

    // Aba Codex: cataloga todos numa única escrita (Locations/Vehicles também são
    // entradas válidas do codex; só outros parties não fazem sentido aqui).
    if (isCodex) {
      return this.#addCodexEntries(folder.contents
        .filter(x => x instanceof Actor && x.type !== "party")
        .map(x => x.uuid));
    }

    // Caso contrário, vira roster (Locations/Vehicles/parties têm slots próprios).
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

  /** Núcleo compartilhado: aponta o "lugar" atual do party para `place` (uma Location
   *  actor OU, no caso de um landmark AVULSO, o próprio Item de landmark usado como
   *  lugar), sempre catalogando-o no codex com o nome revelado, e fixa o landmark
   *  atual (`""` = nenhum). Usado por uma Location solta no slot e pelos dois caminhos
   *  de #setLandmark. */
  async #applyLocation(place, landmarkId = "") {
    const update = { "system.location": place.uuid, "system.landmark": landmarkId };
    const codex = foundry.utils.deepClone(this.document.system.codex ?? []);
    if (!codex.some(e => e.uuid === place.uuid)) {
      codex.push(ShiftPartySheet.#newCodexEntry(place.uuid, ["name"]));
      update["system.codex"] = codex;
    }
    await this.document.update(update);
    return true;
  }

  /** Define a Location do party (sempre catalogada no codex) + limpa o landmark. */
  async #setLocation(actor) {
    if (actor?.type !== "location") {
      ui.notifications.warn(game.i18n.localize("SHIFT.Party.NotLocation"));
      return false;
    }
    return this.#applyLocation(actor, "");
  }

  /** Solta um Landmark no slot de Location. Dois casos:
   *   • EMBUTIDO numa Location → fixa a Location-pai E aquele landmark de uma vez
   *     ("a party está NESTE ponto da Location").
   *   • AVULSO (Item de mundo, sem Location-pai) → o próprio landmark vira o lugar
   *     atual do party (system.location aponta para o Item; #locationContext o trata
   *     como um lugar sem sub-landmarks, carregando o próprio safe/unsafe). */
  async #setLandmark(landmark) {
    if (landmark?.type !== "landmark") {
      ui.notifications.warn(game.i18n.localize("SHIFT.Party.NotLocation"));
      return false;
    }
    const loc = landmark.parent;
    return (loc?.type === "location")
      ? this.#applyLocation(loc, landmark.id)
      : this.#applyLocation(landmark, "");
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
    const r = { name: false, concept: false, stats: false, defeat: false, traits: false, scale: false, description: false };
    for (const k of on) r[k] = true;
    return r;
  }

  /** Uma entrada de codex nova com um formato consistente em todo caminho de adição. */
  static #newCodexEntry(uuid, revealOn = []) {
    return { uuid, reveal: ShiftPartySheet.#revealSet(revealOn), revealLandmarks: [] };
  }

  /** Monta o drag-data canônico de uma entrada do codex a partir do seu UUID, para
   *  que arrastar um card do codex equivalha a arrastar o Actor/Item ligado (cai no
   *  slot de Location/Vehicle, no canvas, em outra ficha). Documentos do mundo
   *  resolvem síncrono e já trazem `toDragData()`; uma entrada de compendium (sem
   *  instância carregada) recai em `{type, uuid}` derivado do tipo do documento. */
  static #codexDragData(uuid) {
    if (!uuid) return null;
    try {
      const doc = fromUuidSync(uuid);
      if (doc?.toDragData) return doc.toDragData();
    } catch (_) { /* compendium não carregado / uuid inválido */ }
    try {
      const p = foundry.utils.parseUuid(uuid);
      const t = p?.collection?.documentName ?? p?.type ?? p?.documentType;
      if (t === "Actor" || t === "Item") return { type: t, uuid };
    } catch (_) { /* uuid malformado */ }
    return null;
  }

  /** Adiciona um UUID de Actor/Item ao codex. Entradas novas começam OCULTAS (um
   *  rumor "???"); o GM revela os campos deliberadamente. */
  async #addCodexEntry(uuid) {
    return this.#addCodexEntries([uuid]);
  }

  /** Adiciona vários UUIDs ao codex de uma vez (dedupe contra o que já existe),
   *  numa única escrita. Avisa "já catalogado" só quando nada de novo entrou. */
  async #addCodexEntries(uuids) {
    const codex = foundry.utils.deepClone(this.document.system.codex ?? []);
    const have = new Set(codex.map(e => e.uuid));
    let added = 0;
    for (const uuid of uuids) {
      if (!uuid || have.has(uuid)) continue;
      // Um landmark embutido cuja Location-mãe já está catalogada já aparece como
      // página própria (card virtual): não cria uma entrada solta duplicada para ele.
      const cut = uuid.indexOf(".Item.");
      if (cut > 0 && have.has(uuid.slice(0, cut))) {
        let isLm = false;
        try { isLm = fromUuidSync(uuid)?.type === "landmark"; } catch (_) { /* compendium não carregado */ }
        if (isLm) continue;
      }
      have.add(uuid);
      codex.push(ShiftPartySheet.#newCodexEntry(uuid));
      added++;
    }
    if (!added) {
      // Só avisa "já catalogado" quando havia algo pra catalogar e tudo era dup;
      // uma folder vazia / só de parties não merece toast (espelha o silêncio do roster).
      if (uuids.length) ui.notifications.info(game.i18n.localize("SHIFT.Party.Codex.Already"));
      return false;
    }
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
    const id = target.dataset.filter ?? "all";
    // "All" limpa a seleção (mostra tudo); senão alterna o filtro — eles GRUDAM, dá
    // pra somar várias categorias ao mesmo tempo (sticky/multi-seleção).
    if (id === "all") this._codexFilters.clear();
    else if (this._codexFilters.has(id)) this._codexFilters.delete(id);
    else this._codexFilters.add(id);
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

  /** Alterna a visibilidade de uma PÁGINA de landmark (card/detalhe próprios), só do
   *  GM. Virtual (embutido numa Location) → mexe no revealLandmarks da Location, então
   *  sincroniza com a lista aninhada. Solto (Item catalogado) → revela/oculta tudo de
   *  uma vez (nome + descrição + nota), pois landmark é all-or-nothing. Re-render
   *  direcionado do Codex para a grade refletir o card aparecendo/sumindo. */
  static async #onToggleLandmarkVisible(event, target) {
    if (!game.user.isGM) return;
    const uuid = target.closest("[data-codex-uuid]")?.dataset.codexUuid;
    if (!uuid) return;
    const resolved = await this.#resolveCodexTarget(uuid);
    if (!resolved) return;
    const codex = foundry.utils.deepClone(this.document.system.codex ?? []);
    if (resolved.virtual) {
      const e = codex.find(x => x.uuid === resolved.entry.uuid);
      if (!e) return;
      e.revealLandmarks = e.revealLandmarks ?? [];
      const i = e.revealLandmarks.indexOf(resolved.lmId);
      if (i >= 0) e.revealLandmarks.splice(i, 1); else e.revealLandmarks.push(resolved.lmId);
    } else {
      const e = codex.find(x => x.uuid === uuid);
      if (!e) return;
      // Landmark = nome + descrição aos players; a GM Note segue privada (sem campo a vazar).
      e.reveal = (e.reveal?.name) ? ShiftPartySheet.#revealSet([]) : ShiftPartySheet.#revealSet(["name", "concept"]);
    }
    await this.document.update({ "system.codex": codex }, { render: false });
    this.render({ parts: ["codex"] });   // direcionado → sem flash da ficha inteira
  }

  /** Revela uma entrada do Codex aos Players. Disponível para o GM E o owner do
   *  party (botão na grade). Clique normal abre o prompt pra escolher quais seções;
   *  CTRL/⌘+Click revela a ficha INTEIRA (todos os campos + landmarks), sem perguntar. */
  static async #onRevealCodexEntry(event, target) {
    if (!this.document.isOwner) return;
    const uuid = target.closest("[data-codex-uuid]")?.dataset.codexUuid;
    if (!uuid) return;
    if (event.ctrlKey || event.metaKey) return this.#applyCodexReveal(uuid, REVEAL_FIELDS, { allLandmarks: true });
    return this.#promptRevealSections(uuid);
  }

  /** Revela o Codex INTEIRO aos Players (botão geral, ao lado do Recharge). Clique
   *  normal abre o prompt das seções a aplicar a todas; CTRL/⌘+Click revela tudo de
   *  toda entrada, sem perguntar. GM ou owner do party. */
  static async #onRevealAllCodex(event) {
    if (!this.document.isOwner) return;
    if (event.ctrlKey || event.metaKey) return this.#applyCodexRevealAll(REVEAL_FIELDS, { allLandmarks: true });
    return this.#promptRevealAllSections();
  }

  /** Oculta o Codex INTEIRO dos Players (botão geral, ao lado do Reveal All): zera o
   *  reveal de toda entrada, virando todas rumores "???". Clique normal confirma;
   *  CTRL/⌘+Click oculta sem perguntar. GM ou owner do party. */
  static async #onHideAllCodex(event) {
    if (!this.document.isOwner) return;
    if (!(this.document.system.codex ?? []).length) return;
    if (!(event.ctrlKey || event.metaKey)) {
      const ok = await foundry.applications.api.DialogV2.confirm({
        window: { title: game.i18n.localize("SHIFT.Party.Codex.HideAllTitle"), icon: "fa-solid fa-eye-slash" },
        content: `<p>${game.i18n.localize("SHIFT.Party.Codex.HideAllHint")}</p>`,
        classes: ["shift-vtt", "shift-dialog"], rejectClose: false, modal: true
      }).catch(() => false);
      if (!ok) return;
    }
    return this.#applyCodexRevealAll([], { allLandmarks: false });
  }

  /** Escreve o estado de reveal de uma entrada — `fields` ficam visíveis, o resto
   *  oculto — mais os landmarks, numa única escrita; re-render direcionado do Codex.
   *  GM ou owner do party. */
  async #applyCodexReveal(uuid, fields, { allLandmarks = false, landmarks = null } = {}) {
    if (!this.document.isOwner) return false;
    const codex = foundry.utils.deepClone(this.document.system.codex ?? []);
    const e = codex.find(x => x.uuid === uuid);
    if (!e) return false;
    e.reveal = ShiftPartySheet.#revealSet(fields);
    const doc = await fromUuid(uuid);
    const lmIds = (doc?.items?.filter?.(i => i.type === "landmark") ?? []).map(l => l.id);
    if (allLandmarks) e.revealLandmarks = lmIds;
    else if (landmarks) e.revealLandmarks = lmIds.filter(id => landmarks.includes(id));
    await this.document.update({ "system.codex": codex }, { render: false });
    this.render({ parts: ["codex"] });   // direcionado → sem flash da ficha inteira
    ui.notifications.info(game.i18n.format("SHIFT.Party.Codex.Revealed",
      { name: doc?.name ?? game.i18n.localize("SHIFT.Party.Codex.Unknown") }));
    return true;
  }

  /** Aplica um estado de reveal a TODAS as entradas do Codex de uma vez (`fields`
   *  visíveis, o resto oculto; landmarks conforme `allLandmarks`). Uma escrita só. */
  async #applyCodexRevealAll(fields, { allLandmarks = false } = {}) {
    if (!this.document.isOwner) return false;
    const codex = foundry.utils.deepClone(this.document.system.codex ?? []);
    if (!codex.length) return false;
    const docs = await Promise.all(codex.map(e => fromUuid(e.uuid).catch(() => null)));
    for (let i = 0; i < codex.length; i++) {
      codex[i].reveal = ShiftPartySheet.#revealSet(fields);
      codex[i].revealLandmarks = allLandmarks
        ? (docs[i]?.items?.filter?.(d => d.type === "landmark") ?? []).map(l => l.id) : [];
    }
    await this.document.update({ "system.codex": codex }, { render: false });
    this.render({ parts: ["codex"] });
    const allHidden = !fields.length && !allLandmarks;
    ui.notifications.info(game.i18n.format(
      allHidden ? "SHIFT.Party.Codex.HiddenAll" : "SHIFT.Party.Codex.RevealedAll", { count: codex.length }));
    return true;
  }

  /** Linha de checkbox do diálogo de reveal (label escapado; ícone é literal). */
  static #revealRow(name, label, on, icon = "") {
    return `<label class="codex-reveal-row"><input type="checkbox" name="${name}"${on ? " checked" : ""}/>` +
      `<span>${icon}${foundry.utils.escapeHTML(label)}</span></label>`;
  }

  /** Roda o diálogo de checkboxes de reveal e devolve um mapa {name: checked} (ou
   *  null se cancelado). Reúne o que os dois prompts (entrada e geral) têm em comum. */
  async #revealPrompt(titleKey, contentHtml) {
    try {
      return await foundry.applications.api.DialogV2.prompt({
        window: { title: game.i18n.localize(titleKey), icon: "fa-solid fa-eye" },
        classes: ["shift-vtt", "shift-dialog"],
        content: contentHtml, rejectClose: false,
        ok: {
          label: game.i18n.localize("SHIFT.Common.Confirm"),
          callback: (_e, btn) => {
            const out = {};
            for (const cb of btn.form.querySelectorAll("input[type=checkbox]")) out[cb.name] = cb.checked;
            return out;
          }
        }
      });
    } catch (_err) { return null; }
  }

  /** Diálogo de seleção das seções a revelar (CTRL+Click no botão de revelar de um
   *  card). Vem pré-marcado com o estado atual; Locations listam também seus
   *  landmarks. O que ficar desmarcado é OCULTADO (o prompt define o estado completo). */
  async #promptRevealSections(uuid) {
    if (!this.document.isOwner) return false;
    const entry = (this.document.system.codex ?? []).find(e => e.uuid === uuid);
    if (!entry) return false;
    const doc = await fromUuid(uuid);
    const r = entry.reveal ?? {};
    const row = ShiftPartySheet.#revealRow;
    const fieldRows = REVEAL_FIELDS.map(f =>
      row(f, game.i18n.localize(`SHIFT.Party.Codex.Field.${cap(f)}`), !!r[f])).join("");
    const lms = doc?.items?.filter?.(i => i.type === "landmark") ?? [];
    const lmRows = lms.map(l =>
      row(`lm:${l.id}`, l.name, !!entry.revealLandmarks?.includes(l.id),
        `<i class="fa-solid fa-map-pin"></i> `)).join("");
    const content =
      `<div class="shift-dialog-body codex-reveal-pick">` +
        `<p class="hint">${game.i18n.localize("SHIFT.Party.Codex.RevealSectionsHint")}</p>` +
        `<div class="codex-reveal-grid">${fieldRows}</div>` +
        (lmRows
          ? `<div class="codex-reveal-sub">${game.i18n.localize("SHIFT.Location.Landmarks")}</div>` +
            `<div class="codex-reveal-grid">${lmRows}</div>`
          : "") +
      `</div>`;
    const picked = await this.#revealPrompt("SHIFT.Party.Codex.RevealSectionsTitle", content);
    if (!picked) return false;
    const fields = REVEAL_FIELDS.filter(f => picked[f]);
    const landmarks = lms.map(l => l.id).filter(id => picked[`lm:${id}`]);
    return this.#applyCodexReveal(uuid, fields, { landmarks });
  }

  /** Diálogo de seleção das seções a revelar no Codex INTEIRO (CTRL+Click no botão
   *  geral). Começa tudo marcado (= revelar tudo); o que ficar desmarcado fica
   *  oculto em todas as entradas. Um único checkbox cobre todos os landmarks. */
  async #promptRevealAllSections() {
    if (!this.document.isOwner) return false;
    if (!(this.document.system.codex ?? []).length) return false;
    const row = ShiftPartySheet.#revealRow;
    const fieldRows = REVEAL_FIELDS.map(f =>
      row(f, game.i18n.localize(`SHIFT.Party.Codex.Field.${cap(f)}`), true)).join("");
    const lmRow = row("landmarks", game.i18n.localize("SHIFT.Location.Landmarks"), true,
      `<i class="fa-solid fa-map-pin"></i> `);
    const content =
      `<div class="shift-dialog-body codex-reveal-pick">` +
        `<p class="hint">${game.i18n.localize("SHIFT.Party.Codex.RevealAllHint")}</p>` +
        `<div class="codex-reveal-grid">${fieldRows}${lmRow}</div>` +
      `</div>`;
    const picked = await this.#revealPrompt("SHIFT.Party.Codex.RevealAllTitle", content);
    if (!picked) return false;
    const fields = REVEAL_FIELDS.filter(f => picked[f]);
    return this.#applyCodexRevealAll(fields, { allLandmarks: !!picked.landmarks });
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
    // Uma Quest propaga o olho pelas filhas: ocultar leva a árvore junto (não deixa
    // filhas órfãs visíveis aos Players); revelar restaura SÓ as que a cascata ocultou
    // (cascadeHidden), sem ressuscitar filhas que o GM ocultou por conta própria. Quando
    // a cascata pega alguma filha, re-renderiza a aba pra refletir o olho das descendentes.
    if (item.type === "quest") {
      const updates = this.#questRevealCascade(item, revealed);
      if (updates.length > 1) {
        await this.document.updateEmbeddedDocuments("Item", updates);
        this.render({ parts: ["quests"] });
        return;
      }
    }
    target.classList.toggle("on", !revealed);   // "on" = oculto
    const icon = target.querySelector("i");
    if (icon) { icon.classList.toggle("fa-eye", revealed); icon.classList.toggle("fa-eye-slash", !revealed); }
    target.closest("[data-item-id]")?.classList.toggle("is-gmhidden", !revealed);
    await item.update({ "system.revealed": revealed, "system.cascadeHidden": false }, { render: false });
  }

  /* --- Quests (rolar + desfecho) ---------------------------------- */

  /** Rola o dado de uma Quest direto (single-die action roll na Party; com
   *  autoShiftOnRoll, o clock dá ShiftDown = "o tempo acabando"). Não passa pelo
   *  diálogo de Action Roll (esse monta da lista de Traits do actor, sem Quests). */
  static async #onRollQuest(event, target) {
    if (!this.canRollTraits) return;
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

  /** Concede XP via o prompt compartilhado (o mesmo do macro), mirando os
   *  characters desta party. */
  static async #onGrantPartyXp() {
    if (!this.isEditable) return;
    await promptGrantXp(this.document.partyMembers.filter(m => m.type === "character"));
  }

  /** GM: solicita um Action Roll DE um Player. Escolhe o character, o leque de
   *  Traits permitidos (nenhum = todos) e o tipo de roll; então o(s) Player(s) dono(s)
   *  do character escolhido recebem o prompt de Action Roll (restrito + tipo de roll
   *  predefinido). */
  static async #onRequestRoll() {
    return promptRequestRoll(this.document);
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

    // Numa Safe Rest, o Vehicle ATIVO restoca junto: o Cargo volta ao máximo,
    // sujeito ao mesmo teto de Wealth da Location. Só o ativo — veículos avulsos
    // descansam pela própria ficha.
    if (method === "safeRest" && this.document.system.vehicle) {
      const vehicle = await fromUuid(this.document.system.vehicle);
      if (vehicle?.type === "vehicle" && vehicle.isOwner) await vehicle.safeRest(opts);
    }
  }

  /* --- Travel ---------------------------------------------------- */

  /** Abre o diálogo de partida e inicia a jornada. GM-only: avançar um Leg mexe nos
   *  Traits de membros/veículos (docs que o player pode não possuir), então a
   *  viagem é conduzida pelo GM, como o Rest na prática. Os players veem a faixa de
   *  progresso na ficha. Player-initiated por relay fica para uma fase futura. */
  static async #onTravelStart() {
    if (!game.user.isGM) return;
    const actor = this.document;
    if (actor.system.journey?.active) {
      return void ui.notifications.warn(game.i18n.localize("SHIFT.Travel.AlreadyActive"));
    }

    const L = k => game.i18n.localize(k);
    const esc = foundry.utils.escapeHTML;
    const hasVehicle = !!actor.system.vehicle;

    // Dois dropdowns: Location e, dependente dela, Landmark (primeira opção =
    // "General location" = a Location inteira). O toggle "Custom location" troca o
    // dropdown por um campo de nome livre. O destName é SEMPRE o local; o Flavor é
    // um texto à parte. Mapa uuid->landmarks para repovoar o 2º dropdown ao vivo.
    const locs = game.actors.filter(a => a.type === "location");
    const lmByLoc = {};
    for (const l of locs) {
      lmByLoc[l.uuid] = l.items.filter(i => i.type === "landmark")
        .map(i => ({ id: i.id, name: i.name, safe: !!i.system.safe }));
    }
    // Landmarks AVULSOS (Items de mundo, não embutidos numa Location) entram como
    // destino próprio num optgroup à parte; na chegada viram destino NOMEADO (sem
    // amarrar system.location, que espera um Actor).
    const looseLandmarks = game.items.filter(i => i.type === "landmark");
    const lmGroup = looseLandmarks.length
      ? `<optgroup label="${esc(L("SHIFT.Travel.StandaloneLandmarks"))}">` +
        looseLandmarks.map(i => `<option value="${i.uuid}">${esc(i.name)}${i.system.safe ? "" : " ⚠"}</option>`).join("") +
        `</optgroup>`
      : "";
    const locOpts = `<option value="">${L("SHIFT.Travel.NoLocation")}</option>` +
      locs.map(l => `<option value="${l.uuid}">${esc(l.name)}</option>`).join("") + lmGroup;
    const modeOpts = `<option value="">${L("SHIFT.Travel.ModeInherit")}</option>` +
      Object.entries(CONFIG.SHIFT.travelModes).map(([k, v]) => `<option value="${k}">${L(v)}</option>`).join("");
    const generalLabel = L("SHIFT.Travel.GeneralLocation");

    const content = `<div class="shift-travel-dialog">
      <label class="std-toggle"><input type="checkbox" name="custom"/> <span>${L("SHIFT.Travel.Custom")}</span></label>
      <div class="form-group" data-row="location"><label>${L("SHIFT.Travel.Location")}</label>
        <select name="dest">${locOpts}</select></div>
      <div class="form-group" data-row="landmark" hidden><label>${L("SHIFT.Travel.Landmark")}</label>
        <select name="landmark"><option value="">${esc(generalLabel)}</option></select></div>
      <div class="form-group" data-row="customName" hidden><label>${L("SHIFT.Travel.CustomName")}</label>
        <input type="text" name="customName" placeholder="${L("SHIFT.Travel.CustomPlaceholder")}"/></div>
      <div class="form-group"><label>${L("SHIFT.Travel.Flavor")}</label>
        <input type="text" name="flavor" placeholder="${L("SHIFT.Travel.FlavorPlaceholder")}"/></div>
      <div class="form-group" data-row="legs"><label>${L("SHIFT.Travel.LegsTotal")}</label>
        <input type="number" name="legs" value="3" min="1" step="1"/></div>
      <div class="form-group"><label>${L("SHIFT.Travel.Mode")}</label>
        <select name="mode">${modeOpts}</select></div>
      <div class="form-group"><label>${L("SHIFT.Travel.Transport")}</label>
        <select name="transport"><option value="foot"${hasVehicle ? "" : " selected"}>${L("SHIFT.Travel.OnFoot")}</option><option value="vehicle"${hasVehicle ? " selected" : ""}>${L("SHIFT.Travel.ByVehicle")}</option></select></div>
    </div>`;

    const data = await foundry.applications.api.DialogV2.prompt({
      window: { title: L("SHIFT.Travel.Title") },
      content,
      rejectClose: false,
      render: (event, dialog) => {
        const root = dialog?.element ?? dialog;
        if (!root?.querySelector) return;
        const q = sel => root.querySelector(sel);
        const custom = q('[name="custom"]');
        const locRow = q('[data-row="location"]');
        const lmRow = q('[data-row="landmark"]');
        const nameRow = q('[data-row="customName"]');
        const legsRow = q('[data-row="legs"]');
        const locSel = q('[name="dest"]');
        const lmSel = q('[name="landmark"]');
        const modeSel = q('[name="mode"]');
        const fillLandmarks = () => {
          const lms = lmByLoc[locSel.value] ?? [];
          lmSel.innerHTML = `<option value="">${esc(generalLabel)}</option>` +
            lms.map(l => `<option value="${l.id}">${esc(l.name)}${l.safe ? "" : " ⚠"}</option>`).join("");
          lmRow.hidden = custom.checked || !lms.length;
        };
        const syncCustom = () => {
          const on = custom.checked;
          locRow.hidden = on;
          nameRow.hidden = !on;
          fillLandmarks();
        };
        const syncLegs = () => {
          // Simple não tem Legs (a viagem conclui de uma vez).
          const m = modeSel.value || game.settings.get("shift-vtt", "travelMode");
          legsRow.hidden = m === "simple";
        };
        custom.addEventListener("change", syncCustom);
        locSel.addEventListener("change", fillLandmarks);
        modeSel.addEventListener("change", syncLegs);
        syncCustom();
        syncLegs();
      },
      ok: {
        label: L("SHIFT.Travel.Embark"),
        callback: (ev, btn) => {
          const f = btn.form;
          return {
            custom: f.elements.custom?.checked ?? false,
            dest: f.elements.dest?.value ?? "",
            landmark: f.elements.landmark?.value ?? "",
            customName: (f.elements.customName?.value ?? "").trim(),
            flavor: (f.elements.flavor?.value ?? "").trim(),
            legs: Number(f.elements.legs?.value) || 3,
            mode: f.elements.mode?.value ?? "",
            transport: f.elements.transport?.value ?? "foot"
          };
        }
      }
    });
    if (!data) return;

    // destName é sempre o LOCAL: custom → texto livre; senão "Landmark, em Location"
    // ou o nome da Location. O Flavor é guardado à parte.
    let destUuid = "", destLandmark = "", destName = "";
    if (data.custom) {
      destName = data.customName;
    } else if (data.dest) {
      const doc = await fromUuid(data.dest);
      if (doc?.documentName === "Actor") {
        // Location actor: amarra na chegada (system.location/landmark).
        destUuid = data.dest;
        if (data.landmark) {
          destLandmark = data.landmark;
          const lmName = doc.items.get(data.landmark)?.name ?? "";
          destName = game.i18n.format("SHIFT.Travel.LandmarkAt", { landmark: lmName, location: doc.name });
        } else {
          destName = doc.name;
        }
      } else if (doc) {
        // Landmark avulso (Item): destino só nomeado, sem binding de Location.
        destName = doc.name;
      }
    }

    await actor.startJourney({
      destName, destUuid, destLandmark,
      flavor: data.flavor,
      legsTotal: data.legs,
      mode: data.mode,
      onFoot: data.transport !== "vehicle"
    });
    ui.notifications.info(game.i18n.localize("SHIFT.Travel.Started"));
  }

  /** Avança um Leg. No modo Challenging, pergunta ao GM se a Action Roll de viagem
   *  (feita à parte pelo lead) teve sucesso; uma Failure custa um recurso extra. */
  static async #onTravelAdvance() {
    if (!game.user.isGM) return;
    const actor = this.document;
    if (!actor.system.journey?.active) return;
    let extra = 1;
    if (actor.travelMode === "challenging") {
      const success = await foundry.applications.api.DialogV2.confirm({
        window: { title: game.i18n.localize("SHIFT.Travel.ChallengeTitle") },
        content: `<p>${game.i18n.localize("SHIFT.Travel.ChallengePrompt")}</p>`,
        yes: { label: game.i18n.localize("SHIFT.Travel.ChallengeSuccess") },
        no: { label: game.i18n.localize("SHIFT.Travel.ChallengeFailure") },
        rejectClose: false
      });
      if (success === null) return;
      extra = success ? 1 : 2;
    }
    await actor.advanceJourneyLeg({ extra });
  }

  /** Encerra a jornada (chegada); vincula a Location/Landmark de destino, se houver. */
  static async #onTravelArrive() {
    if (!game.user.isGM) return;
    await this.document.arriveJourney();
  }

  /** Conclui uma viagem Simple de uma vez só (narrada), via prompt de confirmação. */
  static async #onTravelFinish() {
    if (!game.user.isGM) return;
    const actor = this.document;
    const j = actor.system.journey;
    if (!j?.active) return;
    const dest = j.destName || game.i18n.localize("SHIFT.Travel.Unknown");
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("SHIFT.Travel.Finish") },
      content: `<p>${game.i18n.format("SHIFT.Travel.FinishConfirm", { dest: foundry.utils.escapeHTML(dest) })}</p>`,
      rejectClose: false
    });
    if (!ok) return;
    await actor.arriveJourney({ simple: true });
  }

  /** Cancela a jornada. Se algo já foi gasto, oferece devolver (shiftUp) os recursos
   *  ou manter o gasto; sem nada gasto, só confirma. */
  static async #onTravelAbort() {
    if (!game.user.isGM) return;
    const actor = this.document;
    const hasSpent = (actor.system.journey?.spent?.length ?? 0) > 0;

    if (!hasSpent) {
      const ok = await foundry.applications.api.DialogV2.confirm({
        window: { title: game.i18n.localize("SHIFT.Travel.Abort") },
        content: `<p>${game.i18n.localize("SHIFT.Travel.AbortConfirm")}</p>`,
        rejectClose: false
      });
      if (!ok) return;
      return void actor.abortJourney();
    }

    let choice = null;
    try {
      choice = await foundry.applications.api.DialogV2.wait({
        window: { title: game.i18n.localize("SHIFT.Travel.Abort") },
        content: `<p>${game.i18n.localize("SHIFT.Travel.AbortPrompt")}</p>`,
        rejectClose: false,
        buttons: [
          { action: "refund", label: game.i18n.localize("SHIFT.Travel.AbortRefund"), icon: "fa-solid fa-rotate-left", default: true },
          { action: "keep", label: game.i18n.localize("SHIFT.Travel.AbortNoRefund"), icon: "fa-solid fa-ban" },
          { action: "cancel", label: game.i18n.localize("SHIFT.Common.Cancel"), icon: "fa-solid fa-xmark" }
        ]
      });
    } catch (err) { choice = null; }
    if (!choice || choice === "cancel") return;
    await actor.abortJourney({ refund: choice === "refund" });
  }

  /* --- Location / active Vehicle -------------------------------- */

  static async #onClearLocation() {
    if (!this.isEditable) return;
    await this.document.update({ "system.location": "", "system.landmark": "" });
  }

  static async #onOpenLocation() {
    await this.#openInCodex(this.document.system.location);
  }

  static async #onClearVehicle() {
    if (!this.isEditable) return;
    await this.document.setActiveVehicle("");   // também limpa a crew do ex-vehicle
  }

  static async #onOpenVehicle() {
    await this.#openInCodex(this.document.system.vehicle);
  }

  /** Abre uma Location/Vehicle ativa na aba Codex (em vez da ficha): pula para a aba
   *  Codex e expande a entrada catalogada. A Location é sempre catalogada; um Vehicle
   *  ativo pode nunca ter sido catalogado — nesse caso, cai de volta na ficha. */
  async #openInCodex(uuid) {
    if (!uuid) return;
    const cataloged = (this.document.system.codex ?? []).some(e => e.uuid === uuid);
    if (cataloged) {
      this._codexOpen = uuid;
      this.tabGroups.primary = "codex";   // o clique pode vir de outra aba (header é compartilhado)
      this.render();
      return;
    }
    const doc = await fromUuid(uuid).catch(() => null);
    doc?.sheet?.render(true);
  }
}
