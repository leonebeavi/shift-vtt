/**
 * SHIFT Roleplaying Game, ponto de entrada do sistema Foundry VTT.
 */
import { SHIFT } from "./module/config.mjs";
import { registerSettings } from "./module/settings.mjs";
import { fvtt, registerHandlebarsHelpers, preloadTemplates } from "./module/helpers/utils.mjs";
import { ShiftActor } from "./module/documents/actor.mjs";
import { ShiftItem } from "./module/documents/item.mjs";
import { ShiftCombat, ShiftCombatant } from "./module/documents/combat.mjs";
import { registerTrackerDecorations } from "./module/combat/tracker.mjs";
import {
  ShiftCharacterData, ShiftAdversaryData, ShiftVehicleData, ShiftLocationData, ShiftPartyData, ShiftFactionData
} from "./module/data/actor-data.mjs";
import {
  ShiftTraitData, ShiftDescriptorData, ShiftTechniqueData, ShiftQuestData, ShiftConnectionData
} from "./module/data/item-data.mjs";
import { ShiftRoll } from "./module/dice/shift-roll.mjs";
import { registerChatHooks } from "./module/chat/chat.mjs";
import {
  ShiftCharacterSheet, ShiftAdversarySheet, ShiftVehicleSheet, ShiftLocationSheet, ShiftPartySheet, ShiftFactionSheet, promptGrantXp, promptRequestRoll
} from "./module/sheets/actor-sheets.mjs";
import { ShiftActorDirectory } from "./module/apps/party-directory.mjs";
import { registerParty, resolveActiveParty } from "./module/apps/party.mjs";
import { registerClocks, toggleClocksPanel } from "./module/apps/clocks.mjs";
import { registerActionHud } from "./module/apps/action-hud.mjs";
import { registerCombatHud } from "./module/apps/combat-hud.mjs";
import { registerSession, startSession, promptNewSession } from "./module/session.mjs";
import { registerSocket } from "./module/helpers/socket.mjs";
import { AdvancementConfig } from "./module/apps/advancement-config.mjs";
import { StatusEffectsConfig } from "./module/apps/status-effects-config.mjs";
import { ScaleConfig } from "./module/apps/scale-config.mjs";
import { ActionHudConfig } from "./module/apps/action-hud-config.mjs";
import { RangesConfig } from "./module/apps/ranges-config.mjs";
import { RestTravelConfig } from "./module/apps/rest-travel-config.mjs";
import { registerRanges } from "./module/apps/ranges.mjs";
import { registerStatusEffects } from "./module/helpers/status-effects.mjs";
import { registerUserConfig } from "./module/helpers/user-config.mjs";
import { ShiftBrowser } from "./module/apps/browser.mjs";
import {
  ShiftTraitSheet, ShiftTechniqueSheet, ShiftDescriptorSheet, ShiftQuestSheet, ShiftConnectionSheet
} from "./module/sheets/item-sheets.mjs";
import { seedCompendium, seedTechniques, seedMacros, ensureCompendiumFolder, organizeTraitsCompendium, migrateQuestType, migrateAttitudeTransform, migrateTraitFeatures, migrateCodexNote, migrateRemoveLandmarks } from "./module/helpers/migrations.mjs";

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */

Hooks.once("init", async () => {
  console.log("shift-vtt | Initializing the SHIFT Roleplaying Game system");

  CONFIG.SHIFT = SHIFT;

  // API pública para macros e módulos.
  game.shift = {
    SHIFT,
    ShiftRoll,
    api: {
      /** Abre o diálogo de Action Roll para um Actor. */
      actionRoll: (actor, opts = {}) => ShiftRoll.promptActionRoll(actor ?? _firstControlledActor(), opts),
      /** Safe Rest para um Actor. */
      safeRest: actor => (actor ?? _firstControlledActor())?.safeRest(),
      /** Unsafe Rest para um Actor. */
      unsafeRest: actor => (actor ?? _firstControlledActor())?.unsafeRest(),
      /** Inicia uma nova sessão: zera o XP de sessão de todos os Player characters
       *  do mundo (ou de uma lista específica de Actors), atualiza as Techniques. */
      newSession: async actors => {
        if (actors) {
          // Por-actor try/catch, como startSession (session.mjs): um Actor sobre o qual o
          // GM não tem permissão (ou um update inválido) não pode abortar o resto da lista.
          let reset = 0;
          for (const a of actors) {
            try { await a.newSession(); reset += 1; }
            catch (err) { console.warn(`SHIFT | newSession falhou para o Actor "${a?.name}":`, err); }
          }
          if (reset) ui.notifications.info(game.i18n.localize("SHIFT.Session.Started"));
          else ui.notifications.warn(game.i18n.format("SHIFT.Session.NoneReset", { failed: actors.length }));
          return;
        }
        await startSession();
      },
      /** Abre o prompt de confirmação "New Session?" do GM. */
      promptNewSession: () => promptNewSession(),
      /** XP bônus do GM (sem limite por padrão). */
      awardXP: async (actor, amount = 1, { limited = false, reason = "" } = {}) => {
        const a = actor ?? _firstControlledActor();
        if (a) await a.addXP(amount, { limited, reason, toChat: true });
      },
      /** Abre o prompt "Grant XP" (o mesmo da ficha de Party): escolhe quantia +
       *  alvos num diálogo. Sem `characters`, mira os characters que você possui. */
      grantXp: characters => promptGrantXp(characters),
      /** Abre o diálogo "Request a Roll" do GM (o mesmo do botão da ficha de Party).
       *  Sem `party`, usa a party ativa. GM-only. */
      requestRoll: party => promptRequestRoll(party ?? resolveActiveParty()),
      /** Alterna o painel fixado de Clocks. */
      clocks: () => toggleClocksPanel(),
      /** Abre o Item Browser. */
      browser: opts => ShiftBrowser.pick(opts),
      /** Abre a ficha da Party na aba Codex, já na entrada do documento `uuid`. Acha
       *  a Party cujo codex contém essa entrada (ou a `partyUuid` dada, ou a ativa).
       *  Chamável de macro (ex.: Monk's Active Tile Triggers) ou do chip de chat. */
      openCodex: (uuid, partyUuid) => {
        let party = partyUuid ? fromUuidSync(partyUuid) : null;
        if (party?.type !== "party") {
          party = (uuid ? game.actors.find(a => a.type === "party" && (a.system.codex ?? []).some(e => e.uuid === uuid)) : null)
            ?? resolveActiveParty();
        }
        if (!party) return void ui.notifications.warn(game.i18n.localize("SHIFT.Party.Codex.NoParty"));
        const sheet = party.sheet;
        sheet.tabGroups.primary = "codex";
        sheet._codexOpen = uuid || null;
        sheet.render(true);
      },
      /** Posta no chat um chip clicável que linka uma entrada do Codex (clicar abre o
       *  Codex naquela entrada via openCodex). */
      codexChip: async (uuid, partyUuid) => {
        const doc = uuid ? await fromUuid(uuid) : null;
        if (!doc) return void ui.notifications.warn(game.i18n.localize("SHIFT.Party.Codex.NoEntry"));
        const esc = foundry.utils.escapeHTML;
        const pAttr = partyUuid ? ` data-party-uuid="${esc(partyUuid)}"` : "";
        // O conteúdo (retrato/nome/cor) é preenchido por CLIENTE no hook do chat,
        // respeitando o reveal de cada usuário (ver codexChipData + chat.mjs).
        await ChatMessage.create({
          content: `<div class="shift-vtt codex-chip" data-shift-codexlink data-codex-uuid="${esc(uuid)}"${pAttr} data-tooltip="${esc(game.i18n.localize("SHIFT.Party.Codex.OpenChip"))}"></div>`
        });
      }
    }
  };

  // Documents
  CONFIG.Actor.documentClass = ShiftActor;
  CONFIG.Item.documentClass = ShiftItem;
  CONFIG.Combat.documentClass = ShiftCombat;
  CONFIG.Combatant.documentClass = ShiftCombatant;
  CONFIG.Combat.initiative = { formula: null, decimals: 0 };

  // Modelos de dados
  Object.assign(CONFIG.Actor.dataModels, {
    character: ShiftCharacterData,
    adversary: ShiftAdversaryData,
    vehicle: ShiftVehicleData,
    location: ShiftLocationData,
    party: ShiftPartyData,
    faction: ShiftFactionData
  });
  Object.assign(CONFIG.Item.dataModels, {
    trait: ShiftTraitData,
    keyword: ShiftDescriptorData,
    drawback: ShiftDescriptorData,
    technique: ShiftTechniqueData,
    quest: ShiftQuestData,
    connection: ShiftConnectionData
  });

  // Barras de recurso do Token
  CONFIG.Actor.trackableAttributes = {
    character: { bar: [], value: ["xp.value", "scale"] },
    adversary: { bar: ["defeat"], value: ["power", "scale"] },
    vehicle: { bar: [], value: ["scale"] },
    location: { bar: [], value: ["scale"] },
    faction: { bar: [], value: ["scale"] }
  };

  // Sheets
  const ActorsC = fvtt.ActorsCollection;
  const ItemsC = fvtt.ItemsCollection;
  try {
    const V1ActorSheet = foundry.appv1?.sheets?.ActorSheet;
    const V1ItemSheet = foundry.appv1?.sheets?.ItemSheet;
    if (V1ActorSheet) ActorsC.unregisterSheet("core", V1ActorSheet);
    if (V1ItemSheet) ItemsC.unregisterSheet("core", V1ItemSheet);
  } catch (err) { /* nada a desregistrar */ }

  ActorsC.registerSheet("shift-vtt", ShiftCharacterSheet, {
    types: ["character"], makeDefault: true, label: "SHIFT.SheetLabels.Character"
  });
  ActorsC.registerSheet("shift-vtt", ShiftAdversarySheet, {
    types: ["adversary"], makeDefault: true, label: "SHIFT.SheetLabels.Adversary"
  });
  ActorsC.registerSheet("shift-vtt", ShiftVehicleSheet, {
    types: ["vehicle"], makeDefault: true, label: "SHIFT.SheetLabels.Vehicle"
  });
  ActorsC.registerSheet("shift-vtt", ShiftLocationSheet, {
    types: ["location"], makeDefault: true, label: "SHIFT.SheetLabels.Location"
  });
  ActorsC.registerSheet("shift-vtt", ShiftFactionSheet, {
    types: ["faction"], makeDefault: true, label: "SHIFT.SheetLabels.Faction"
  });
  ActorsC.registerSheet("shift-vtt", ShiftPartySheet, {
    types: ["party"], makeDefault: true, label: "SHIFT.SheetLabels.Party"
  });

  // Substitui a sidebar de Actors por uma directory que renderiza os Party Actors
  // como grupos parecidos com folders fixados no topo (fiel ao PF2e). Seguro em
  // `init`: CONFIG.ui é consumido depois, em setupGame()/initializeUI().
  CONFIG.ui.actors = ShiftActorDirectory;
  ItemsC.registerSheet("shift-vtt", ShiftTraitSheet, {
    types: ["trait"], makeDefault: true, label: "SHIFT.SheetLabels.Trait"
  });
  ItemsC.registerSheet("shift-vtt", ShiftTechniqueSheet, {
    types: ["technique"], makeDefault: true, label: "SHIFT.SheetLabels.Technique"
  });
  ItemsC.registerSheet("shift-vtt", ShiftDescriptorSheet, {
    types: ["keyword", "drawback"], makeDefault: true, label: "SHIFT.SheetLabels.Descriptor"
  });
  ItemsC.registerSheet("shift-vtt", ShiftQuestSheet, {
    types: ["quest"], makeDefault: true, label: "SHIFT.SheetLabels.Quest"
  });
  ItemsC.registerSheet("shift-vtt", ShiftConnectionSheet, {
    types: ["connection"], makeDefault: true, label: "SHIFT.SheetLabels.Connection"
  });

  registerSettings();

  // Submenu de Rest & Travel (Building Blocks de descanso e viagem, agrupados).
  game.settings.registerMenu("shift-vtt", "restTravelMenu", {
    name: "SHIFT.Settings.RestTravelMenu.Name",
    label: "SHIFT.Settings.RestTravelMenu.Name",
    hint: "SHIFT.Settings.RestTravelMenu.Hint",
    icon: "fa-solid fa-route",
    type: RestTravelConfig,
    restricted: true
  });

  // Submenu de Advancement (o que o XP pode comprar).
  game.settings.registerMenu("shift-vtt", "advancementMenu", {
    name: "SHIFT.Settings.Advancements.Name",
    label: "SHIFT.Settings.Advancements.Name",
    hint: "SHIFT.Settings.Advancements.Hint",
    icon: "fa-solid fa-arrow-trend-up",
    type: AdvancementConfig,
    restricted: true
  });

  // Submenu de Status Effects (os color-markers do Token).
  game.settings.registerMenu("shift-vtt", "statusEffectsMenu", {
    name: "SHIFT.Settings.StatusEffects.Name",
    label: "SHIFT.Settings.StatusEffects.Name",
    hint: "SHIFT.Settings.StatusEffects.Hint",
    icon: "fa-solid fa-circle-half-stroke",
    type: StatusEffectsConfig,
    restricted: true
  });

  // Submenu de Scale (regras opcionais de Scale, agrupadas).
  game.settings.registerMenu("shift-vtt", "scaleMenu", {
    name: "SHIFT.Settings.ScaleMenu.Name",
    label: "SHIFT.Settings.ScaleMenu.Name",
    hint: "SHIFT.Settings.ScaleMenu.Hint",
    icon: "fa-solid fa-up-right-and-down-left-from-center",
    type: ScaleConfig,
    restricted: true
  });

  // Submenu de Distance Ranges (faixas abstratas + modo de leitura ao passar o mouse).
  game.settings.registerMenu("shift-vtt", "rangesMenu", {
    name: "SHIFT.Settings.RangesMenu.Name",
    label: "SHIFT.Settings.RangesMenu.Name",
    hint: "SHIFT.Settings.RangesMenu.Hint",
    icon: "fa-solid fa-ruler-horizontal",
    type: RangesConfig,
    restricted: true
  });

  // Submenu do Action HUD (por Player; não é restrito ao GM, para que todo Player possa abri-lo).
  game.settings.registerMenu("shift-vtt", "actionHudMenu", {
    name: "SHIFT.Settings.ActionHudMenu.Name",
    label: "SHIFT.Settings.ActionHudMenu.Name",
    hint: "SHIFT.Settings.ActionHudMenu.Hint",
    icon: "fa-solid fa-bars-staggered",
    type: ActionHudConfig,
    restricted: false
  });

  registerHandlebarsHelpers();
  await preloadTemplates();
  registerChatHooks();
  registerTrackerDecorations();
  registerClocks();
  registerActionHud();
  registerCombatHud();
  registerSession();
  registerStatusEffects();
  registerRanges();
  registerParty();
  registerUserConfig();
});

Hooks.once("ready", async () => {
  registerSocket();
  cleanStoredColorValues();
  if (game.user.isGM) {
    await migrateQuestType();
    await migrateAttitudeTransform();
    await migrateTraitFeatures();
    await migrateCodexNote();
    await migrateRemoveLandmarks();
    await seedCompendium();
    await seedTechniques();
    await seedMacros();
    await ensureCompendiumFolder();
    await organizeTraitsCompendium();
  }
});

/**
 * Reparo único: builds anteriores do sistema entregavam uma cor de dado com um
 * tab extra no fim ("#f07d39\t"). O Dice So Nice persistiu isso nos flags de
 * aparência do usuário, e agora cada render registra avisos do navegador sobre
 * formato de cor inválido. Remove o espaço em branco de qualquer string de cor
 * hex armazenada nesses flags.
 */
async function cleanStoredColorValues() {
  const appearance = game.user.getFlag("dice-so-nice", "appearance");
  if (!appearance) return;
  let dirty = false;
  const clean = value => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== value && /^#[0-9a-fA-F]{3,8}$/.test(trimmed)) {
        dirty = true;
        return trimmed;
      }
      return value;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = clean(v);
      return out;
    }
    if (Array.isArray(value)) return value.map(clean);
    return value;
  };
  const repaired = clean(foundry.utils.deepClone(appearance));
  if (dirty) {
    await game.user.setFlag("dice-so-nice", "appearance", repaired);
    console.log("shift-vtt | Repaired stored Dice So Nice colors (removed stray whitespace)");
  }
}

function _firstControlledActor() {
  return canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
}

/* ------------------------------------------------------------------ */
/* Dice So Nice                                                        */
/* ------------------------------------------------------------------ */

Hooks.once("diceSoNiceReady", dice3d => {
  try {
    const base = {
      foreground: "#FFFFFF",
      // Todo Shift Die (e o default global abaixo) rotula em Signika.
      font: "Signika",
      outline: "none",
      texture: "none",
      material: "plastic",
      visibility: "visible"
    };
    // Remove espaços defensivamente: um espaço/tab extra aqui corrompe as cores armazenadas do DSN.
    const colors = Object.fromEntries(
      Object.entries(CONFIG.SHIFT.dieColors).map(([die, c]) => [die, String(c).trim()])
    );

    dice3d.addSystem({ id: "shift-vtt", name: "SHIFT VTT" }, "preferred");

    // Faz com que TODO dado (não só os Shift Dice) use por padrão um rótulo branco
    // em Signika. Registrado como o colorset "default" para que qualquer dado sem um
    // preset do sistema o herde; usuários que escolheram a própria aparência mantêm a escolha.
    dice3d.addColorset({
      ...base,
      name: "shift-default",
      description: "SHIFT VTT",
      category: "SHIFT",
      background: "#1f1d24",
      edge: "#15131a"
    }, "default");

    // Colorsets por dado dão suporte aos presets, para que cada tipo de dado mantenha
    // sua cor canônica quando o sistema SHIFT está selecionado. Não há um colorset de
    // "tema" SHIFT visível separado; ele era redundante com estes presets.
    for (const [die, color] of Object.entries(colors)) {
      dice3d.addColorset({
        ...base,
        visibility: "hidden",
        name: `shift-${die}`,
        description: `SHIFT ${die.toUpperCase()}`,
        category: "SHIFT",
        background: color,
        edge: color
      });
      dice3d.addDicePreset({
        type: die,
        labels: Array.fromRange(CONFIG.SHIFT.diceFaces[die]).map(n => String(n + 1)),
        colorset: `shift-${die}`,
        system: "shift-vtt"
      });
    }
  } catch (err) {
    console.warn("shift-vtt | Dice So Nice registration failed", err);
  }
}
);
