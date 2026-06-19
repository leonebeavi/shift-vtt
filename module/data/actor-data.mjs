/**
 * SHIFT VTT — modelos de dados de Actor (TypeDataModel).
 */
const fields = foundry.data.fields;

/* ------------------------------------------------------------------ */
/* Base                                                                */
/* ------------------------------------------------------------------ */

class ShiftActorBase extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ required: false, blank: true, initial: "" }),
      /** Procedência em texto livre; espelha o campo do Item para ordenar compendium. */
      source: new fields.StringField({ required: false, blank: true, initial: "" }),
      scale: new fields.NumberField({ required: true, integer: true, min: 1, max: 4, initial: 1 })
    };
  }
}

/* ------------------------------------------------------------------ */
/* Character                                                           */
/* ------------------------------------------------------------------ */

export class ShiftCharacterData extends ShiftActorBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.concept = new fields.StringField({ required: false, blank: true, initial: "" });
    schema.pronouns = new fields.StringField({ required: false, blank: true, initial: "" });
    schema.xp = new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      session: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
    });
    return schema;
  }
}

/* ------------------------------------------------------------------ */
/* Adversary                                                           */
/* ------------------------------------------------------------------ */

export class ShiftAdversaryData extends ShiftActorBase {
  static defineSchema() {
    const schema = super.defineSchema();
    // Power é um inteiro positivo livre (pelas regras o teto é 5 para foes
    // publicados, mas homebrew e ameaças Scaled podem passar disso, então sem máximo fixo).
    schema.power = new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 });
    schema.concept = new fields.StringField({ required: false, blank: true, initial: "" });
    return schema;
  }

  /**
   * Estatísticas de encounter derivadas, calculadas a partir dos Trait items:
   *  - defeat {value,max}: Traits que contam e estão Exhausted vs. Power + extras de Special
   *  - actions: Action Rolls por rodada (Power + extras de Special)
   *  - traitLimit / traitCount: orçamento de Traits recomendado (Power + 2)
   *  - blockedBy: Traits estilo Heavily Armored que devem ser Exhausted primeiro
   */
  prepareDerivedData() {
    super.prepareDerivedData();
    const actor = this.parent;
    const traits = actor?.items?.filter(i => i.type === "trait") ?? [];

    const counting = traits.filter(t => t.system.defeat?.counts);
    const extraRequired = traits.reduce((n, t) => n + (t.system.defeat?.extraRequired || 0), 0);
    const extraActions = traits.reduce((n, t) => n + (t.system.adversary?.extraActions || 0), 0);

    this.defeat = {
      value: counting.filter(t => t.system.exhausted).length,
      max: (this.power || 1) + extraRequired
    };
    this.actions = (this.power || 1) + extraActions;
    this.traitLimit = (this.power || 1) + 2;
    this.traitCount = traits.filter(t => t.system.adversary?.countsTowardTraitLimit).length;
    this.overcome = this.defeat.value >= this.defeat.max;
    this.blockedBy = traits
      .filter(t => t.system.defeat?.mustBeExhaustedFirst && !t.system.exhausted)
      .map(t => t.name);
  }
}

/* ------------------------------------------------------------------ */
/* Location                                                            */
/* ------------------------------------------------------------------ */

export class ShiftLocationData extends ShiftActorBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.concept = new fields.StringField({ required: false, blank: true, initial: "" });
    /** UUIDs de Actor dos NPCs ligados a esta Location, mostrados como cards. */
    schema.npcs = new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] });
    return schema;
  }
}

/* ------------------------------------------------------------------ */
/* Vehicle                                                             */
/* ------------------------------------------------------------------ */

export class ShiftVehicleData extends ShiftActorBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.concept = new fields.StringField({ required: false, blank: true, initial: "" });
    /** UUIDs de Actor da tripulação. Membros da tripulação podem gastar o Cargo
     *  Trait em Unsafe Rests e rolar os Traits do Vehicle junto com os seus. */
    schema.crew = new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] });
    return schema;
  }
}

/* ------------------------------------------------------------------ */
/* Party                                                               */
/* ------------------------------------------------------------------ */

/**
 * Um Actor de "grupo" leve: não é rolado nem escalado, só reúne Actors membros
 * (por UUID de mundo) para a mesa ver a party inteira de relance, deployar/recall
 * seus tokens juntos e navegá-los como uma folder na sidebar de Actors. Espelha o
 * padrão de array-de-UUID-plano já usado por crew de Vehicle / NPCs de Location
 * (veja {@link ShiftVehicleData}/{@link ShiftLocationData}).
 */
export class ShiftPartyData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ required: false, blank: true, initial: "" }),
      /** Procedência em texto livre; embasa a citação "Source" reusada na aba Traits. */
      source: new fields.StringField({ required: false, blank: true, initial: "" }),

      /** Roster: UUIDs de Actor de mundo ("Actor.xxxx") dos membros da party, em
       *  ordem de exibição. Resolvido por ShiftActor#partyMembers. */
      members: new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] }),

      /** Codex: o bestiário/diretório de Actors E Items que a party encontrou
       *  (um inimigo, um aliado, um lugar, um vehicle, um Trait ou uma Technique).
       *  A entrada é um ÍNDICE ({uuid, note, reveal, revealLandmarks}); todo o
       *  resto é lido AO VIVO do documento referenciado. `reveal` é o controle do
       *  GM, por campo, do que os PLAYERS veem (o GM sempre vê tudo). Uma entrada
       *  só é um rumor travado "???" quando NADA está revelado; esconder só o nome
       *  mantém a entrada navegável sob um placeholder. `revealLandmarks` lista os
       *  ids dos landmark Items (dentro de uma entrada de Location) que os players
       *  podem ver. */
      codex: new fields.ArrayField(new fields.SchemaField({
        uuid: new fields.StringField({ required: true, blank: false }),
        note: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        reveal: new fields.SchemaField({
          // Falha FECHADO: uma entrada malformada/legada sem `reveal` continua
          // escondida em vez de vazar tudo. Todo caminho de adição define isto explicitamente.
          name: new fields.BooleanField({ initial: false }),
          concept: new fields.BooleanField({ initial: false }),
          stats: new fields.BooleanField({ initial: false }),   // Power / Actions
          defeat: new fields.BooleanField({ initial: false }),
          traits: new fields.BooleanField({ initial: false }),
          scale: new fields.BooleanField({ initial: false }),
          note: new fields.BooleanField({ initial: false })      // a nota de codex do GM
        }),
        revealLandmarks: new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] })
      }), { initial: [] }),

      /** (Quests não ficam mais aqui: uma quest É um `trait` Item de categoria
       *  "quest" embutido na party, então reusa toda a maquinaria de Trait: clock
       *  de dado rolável, shift up/down, exhaust, keywords/drawbacks, descrição e
       *  esconder-dos-players pela própria flag `revealed` do Trait.) */

      /** A Location atual da party (um uuid "Actor.xxxx") e o landmark específico
       *  dentro dela (um id de `landmark` Item). Quando definida, a Location está
       *  sempre presente no codex e dirige as regras de Rest cientes de local. */
      location: new fields.StringField({ required: false, blank: true, initial: "" }),
      landmark: new fields.StringField({ required: false, blank: true, initial: "" }),

      /** Vehicle ativo (um uuid "Actor.xxxx"). Quando definido, os membros character
       *  da party são auto-sincronizados como a crew desse vehicle. */
      vehicle: new fields.StringField({ required: false, blank: true, initial: "" }),

      /** O JournalEntry auto-criado e de posse do jogador que embasa as "Field
       *  Notes" compartilhadas do codex (uma página por entrada). Definido na
       *  criação da party. */
      codexJournal: new fields.StringField({ required: false, blank: true, initial: "" })
    };
  }
}
