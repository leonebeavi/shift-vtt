/**
 * SHIFT VTT — constantes do sistema.
 * Registradas como CONFIG.SHIFT no init.
 */
export const SHIFT = {};

SHIFT.id = "shift-vtt";

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

/** Progressão do Shift Die, do melhor ao pior. Exhausted é um flag, não um dado. */
SHIFT.dice = ["d4", "d6", "d8", "d10", "d12"];

SHIFT.diceLabels = {
  d4: "D4",
  d6: "D6",
  d8: "D8",
  d10: "D10",
  d12: "D12"
};

SHIFT.diceFaces = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12 };

/** Imagens de ícone dos dados (usadas nos cards de Trait; clique para rolar).
 *  Exhausted não tem ícone: o dado já não existe nesse contexto. */
SHIFT.diceImages = {
  d4: "systems/shift-vtt/assets/dice/d4.webp",
  d6: "systems/shift-vtt/assets/dice/d6.webp",
  d8: "systems/shift-vtt/assets/dice/d8.webp",
  d10: "systems/shift-vtt/assets/dice/d10.webp",
  d12: "systems/shift-vtt/assets/dice/d12.webp",
  exhausted: null
};

/** Cores canônicas dos dados do SHIFT. */
SHIFT.dieColors = { d4: "#12aa5b", d6: "#addd27", d8: "#ffc511", d10: "#f07d39", d12: "#de2b54" };

/** Status de sabor por degrau de dado (chaves de localização). */
SHIFT.diceStatus = {
  d4: "SHIFT.DiceStatus.d4",
  d6: "SHIFT.DiceStatus.d6",
  d8: "SHIFT.DiceStatus.d8",
  d10: "SHIFT.DiceStatus.d10",
  d12: "SHIFT.DiceStatus.d12",
  exhausted: "SHIFT.DiceStatus.exhausted"
};

/** Maior rolagem que conta como sucesso (1, 2 ou 3). */
SHIFT.successMax = 3;

/* ------------------------------------------------------------------ */
/* Traits                                                              */
/* ------------------------------------------------------------------ */

SHIFT.traitCategories = {
  core: "SHIFT.TraitCategory.core",
  focus: "SHIFT.TraitCategory.focus",
  pack: "SHIFT.TraitCategory.pack",
  cargo: "SHIFT.TraitCategory.cargo",
  attitude: "SHIFT.TraitCategory.attitude",
  adversary: "SHIFT.TraitCategory.adversary",
  special: "SHIFT.TraitCategory.special",
  party: "SHIFT.TraitCategory.party",
  custom: "SHIFT.TraitCategory.custom"
};

/* Ícones padrão de item (SVGs do core do Foundry); itens novos os adotam em
   ShiftItem._preCreate. */
SHIFT.defaultIcons = {
  trait: "icons/svg/levels.svg",
  technique: "icons/svg/target.svg",
  keyword: "icons/svg/regen.svg",
  drawback: "icons/svg/degen.svg",
  landmark: "icons/svg/village.svg",
  quest: "icons/svg/book.svg"
};

/* Ícones padrão de ACTOR por tipo (SVGs do core do Foundry). Character mantém o
   mystery-man do próprio Foundry; os outros recebem svgs distintos que não
   colidem com os ícones de item acima. Aplicados em ShiftActor._preCreate quando
   o criador deixou o mystery-man genérico. */
SHIFT.defaultActorIcons = {
  adversary: "icons/svg/walk.svg",
  vehicle: "icons/svg/wing.svg",
  location: "icons/svg/city.svg",
  party: "icons/svg/tower-flag.svg"
};

/* ------------------------------------------------------------------ */
/* Faixas de distância (opcional; faixas abstratas sobre o grid)       */
/* ------------------------------------------------------------------ */

/* As quatro faixas abstratas de distância, medidas nas unidades de grid da cena
   ativa (ft por padrão). `min` é inclusivo e o limite superior é inclusivo na
   fronteira; o max null da última faixa significa "e além". O GM pode
   personalizá-las no submenu Distance Ranges. */
SHIFT.rangeBands = [
  { key: "close",        label: "SHIFT.Ranges.Close",        min: 0,  max: 5 },
  { key: "near",         label: "SHIFT.Ranges.Near",         min: 5,  max: 30 },
  { key: "far",          label: "SHIFT.Ranges.Far",          min: 30, max: 90 },
  { key: "extremelyFar", label: "SHIFT.Ranges.ExtremelyFar", min: 90, max: null }
];

/* ------------------------------------------------------------------ */
/* Rolagens                                                            */
/* ------------------------------------------------------------------ */

SHIFT.rollTypes = {
  normal: "SHIFT.RollTypes.normal",
  risky: "SHIFT.RollTypes.risky",
  inspired: "SHIFT.RollTypes.inspired"
};

SHIFT.rollResults = {
  criticalSuccess: { label: "SHIFT.RollResults.criticalSuccess", css: "critical-success", icon: "fa-star" },
  success: { label: "SHIFT.RollResults.success", css: "success", icon: "fa-check" },
  mitigatedSuccess: { label: "SHIFT.RollResults.mitigatedSuccess", css: "mitigated-success", icon: "fa-check-double" },
  failure: { label: "SHIFT.RollResults.failure", css: "failure", icon: "fa-xmark" },
  criticalFailure: { label: "SHIFT.RollResults.criticalFailure", css: "critical-failure", icon: "fa-skull" }
};

SHIFT.critRules = {
  standard: "SHIFT.Settings.CritRule.standard",
  allOnes: "SHIFT.Settings.CritRule.allOnes",
  everyOne: "SHIFT.Settings.CritRule.everyOne"
};

/* ------------------------------------------------------------------ */
/* Techniques                                                          */
/* ------------------------------------------------------------------ */

SHIFT.techniqueTypes = {
  narrative: "SHIFT.TechniqueTypes.narrative",
  mechanical: "SHIFT.TechniqueTypes.mechanical",
  scaledUp: "SHIFT.TechniqueTypes.scaledUp"
};

/* ------------------------------------------------------------------ */
/* Vehicle domain & Location size (subcategorias do Codex)             */
/* ------------------------------------------------------------------ */

/** Domínio de um Vehicle — campo explícito escolhido pelo GM. */
SHIFT.vehicleDomains = {
  land: "SHIFT.Vehicle.Domain.land",
  sea: "SHIFT.Vehicle.Domain.sea",
  air: "SHIFT.Vehicle.Domain.air",
  space: "SHIFT.Vehicle.Domain.space",
  underground: "SHIFT.Vehicle.Domain.underground",
  mixed: "SHIFT.Vehicle.Domain.mixed"
};

/** Tamanho de uma Location — derivado da Scale (1–4), não é campo separado. */
SHIFT.locationSizes = {
  1: "SHIFT.Location.Size.site",
  2: "SHIFT.Location.Size.locale",
  3: "SHIFT.Location.Size.region",
  4: "SHIFT.Location.Size.realm"
};

/* ------------------------------------------------------------------ */
/* Modos de Rest                                                       */
/* ------------------------------------------------------------------ */

SHIFT.restModes = {
  standard: "SHIFT.Settings.RestMode.standard",
  simple: "SHIFT.Settings.RestMode.simple",
  challenging: "SHIFT.Settings.RestMode.challenging"
};

/* ------------------------------------------------------------------ */
/* Modos de Travel (subsistema OPCIONAL, irmão tonal do Rest)          */
/* ------------------------------------------------------------------ */

/* Os três Building Blocks de viagem. simple = só narração; standard = atrito de
   Pack/Cargo por Leg; challenging = standard + uma Action Roll por Leg cuja
   Failure custa um recurso extra. Espelha SHIFT.restModes, mas é independente
   (ver setting travelMode + a chave-mestra enableTravel). */
SHIFT.travelModes = {
  simple: "SHIFT.Settings.TravelMode.simple",
  standard: "SHIFT.Settings.TravelMode.standard",
  challenging: "SHIFT.Settings.TravelMode.challenging"
};

/* ------------------------------------------------------------------ */
/* Fases de Encounter (valores de iniciativa)                          */
/* ------------------------------------------------------------------ */

SHIFT.phases = {
  advantage: 4, // Encounter Advantage (só na primeira rodada)
  first: 3,     // Jogadores que tiveram sucesso na rolagem de turn order
  adversary: 2, // Todos os Adversaries / combatentes não-character
  second: 1     // Jogadores que falharam a rolagem de turn order
};

SHIFT.phaseLabels = {
  4: "SHIFT.Combat.AdvantagePhase",
  3: "SHIFT.Combat.FirstPhase",
  2: "SHIFT.Combat.AdversaryPhase",
  1: "SHIFT.Combat.SecondPhase"
};

/* ------------------------------------------------------------------ */
/* Predefinições de Special Trait de Adversary                         */
/* ------------------------------------------------------------------ */

SHIFT.specialTraitPresets = {
  armored: {
    name: "SHIFT.Special.Armored",
    description: "SHIFT.Special.ArmoredDesc",
    system: {
      category: "special",
      rollable: true,
      maxDie: "d6",
      currentDie: "d6",
      defeat: { counts: true, extraRequired: 1, mustBeExhaustedFirst: false },
      adversary: { countsTowardTraitLimit: false, extraActions: 0 }
    }
  },
  heavilyArmored: {
    name: "SHIFT.Special.HeavilyArmored",
    description: "SHIFT.Special.HeavilyArmoredDesc",
    system: {
      category: "special",
      rollable: true,
      maxDie: "d6",
      currentDie: "d6",
      defeat: { counts: true, extraRequired: 2, mustBeExhaustedFirst: true },
      adversary: { countsTowardTraitLimit: false, extraActions: 0 }
    }
  },
  smallGroup: {
    name: "SHIFT.Special.SmallGroup",
    description: "SHIFT.Special.SmallGroupDesc",
    system: {
      category: "special",
      rollable: true,
      maxDie: "d6",
      currentDie: "d6",
      defeat: { counts: true, extraRequired: 1, mustBeExhaustedFirst: false },
      adversary: { countsTowardTraitLimit: false, extraActions: 1 }
    }
  },
  largeGroup: {
    name: "SHIFT.Special.LargeGroup",
    description: "SHIFT.Special.LargeGroupDesc",
    system: {
      category: "special",
      rollable: true,
      maxDie: "d6",
      currentDie: "d6",
      defeat: { counts: true, extraRequired: 2, mustBeExhaustedFirst: false },
      adversary: { countsTowardTraitLimit: false, extraActions: 2 }
    }
  }
};

/* ------------------------------------------------------------------ */
/* Advancement de Character (custos de XP)                             */
/* ------------------------------------------------------------------ */

// Cada advancement é só {label, cost}: clicar o chip GASTA o XP e ANUNCIA no chat; a
// mesa aplica o efeito (a lista é configurável pelo GM, então o sistema não presume o
// que cada um faz). Custos padrão pelas regras (Keyword 2 / Technique 4 / Trait 6 / Core 8).
SHIFT.advancements = [
  { label: "SHIFT.Advancement.Keyword", cost: 2 },
  { label: "SHIFT.Advancement.Technique", cost: 4 },
  { label: "SHIFT.Advancement.Trait", cost: 6 },
  { label: "SHIFT.Advancement.CoreDie", cost: 8 }
];
