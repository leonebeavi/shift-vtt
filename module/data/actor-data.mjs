/**
 * SHIFT VTT — modelos de dados de Actor (TypeDataModel).
 */
const fields = foundry.data.fields;

/** Nota privada do GM, em rich-text. Vive na ficha do próprio Actor (Adversary,
 *  Vehicle, Location — nunca Character) e é o MESMO campo que o Codex do Party lê
 *  e edita, então as duas visões ficam sincronizadas. Nunca é revelada aos
 *  players; a descrição (system.description) é que pode ser revelada no Codex. */
function gmNoteField() {
  return new fields.HTMLField({ required: false, blank: true, initial: "" });
}

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
    schema.gmNote = gmNoteField();
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
    schema.gmNote = gmNoteField();
    /** UUIDs de Actor dos NPCs ligados a esta Location, mostrados como cards. */
    schema.npcs = new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] });
    /** Safe/Unsafe: TODA Location agora carrega o flag (antes só os Landmark Items).
     *  Gateia o Safe Rest quando a party está neste lugar. */
    schema.safe = new fields.BooleanField({ initial: true });
    /** Locations-FILHAS aninhadas (UUIDs de Actor "location"). Aparecem como os
     *  "Landmarks" desta Location na ficha e no Codex. Profundidade arbitrária; cada
     *  filha tem um único pai (single-parent + guarda de ciclo em addChildLocation).
     *  Espelha o padrão de `npcs`/crew/members (array de UUID resolvido no runtime). */
    schema.children = new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] });
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
    schema.gmNote = gmNoteField();
    /** Domínio do veículo (terrestre, naval, aéreo, espacial, subterrâneo, misto).
     *  Em branco = não definido. Tinge/rotula o card no Codex (ver CONFIG.SHIFT.vehicleDomains). */
    schema.domain = new fields.StringField({ required: false, blank: true, initial: "" });
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
       *  A entrada é um ÍNDICE ({uuid, reveal, revealLandmarks}); todo o resto é
       *  lido AO VIVO do documento referenciado — inclusive a GM Note, que mora em
       *  system.gmNote do próprio Actor (sincronizada com a ficha dele). `reveal` é
       *  o controle do GM, por campo, do que os PLAYERS veem (o GM sempre vê tudo).
       *  Uma entrada só é um rumor travado "???" quando NADA está revelado; esconder
       *  só o nome mantém a entrada navegável sob um placeholder. `revealLandmarks`
       *  lista os ids dos landmark Items (dentro de uma entrada de Location) que os
       *  players podem ver. */
      codex: new fields.ArrayField(new fields.SchemaField({
        uuid: new fields.StringField({ required: true, blank: false }),
        // DEPRECATED: nota por-entrada do Codex. A GM Note agora vive em system.gmNote do
        // Actor/Item REFERENCIADO (sincronizada com a ficha). Mantido só para a migração
        // one-time migrateCodexNote ler o dado legado SEM PERDA; some num release futuro,
        // depois que os mundos migrarem. A UI não lê mais este campo.
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
          description: new fields.BooleanField({ initial: false }) // a Description (system.description) do Actor
        }),
        revealLandmarks: new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] })
      }), { initial: [] }),

      /** (Quests não ficam mais aqui: uma quest É um `trait` Item de categoria
       *  "quest" embutido na party, então reusa toda a maquinaria de Trait: clock
       *  de dado rolável, shift up/down, exhaust, keywords/drawbacks, descrição e
       *  esconder-dos-players pela própria flag `revealed` do Trait.) */

      /** O "lugar" atual da party (um uuid de Location "Actor.xxxx"; pode ser uma
       *  Location-filha aninhada, que carrega o próprio safe/unsafe). Quando definido,
       *  o lugar está sempre no codex e dirige as regras de Rest cientes de local. */
      location: new fields.StringField({ required: false, blank: true, initial: "" }),

      /** Vehicle ativo (um uuid "Actor.xxxx"). Quando definido, os membros character
       *  da party são auto-sincronizados como a crew desse vehicle. */
      vehicle: new fields.StringField({ required: false, blank: true, initial: "" }),

      /** Jornada de Travel em andamento (subsistema OPCIONAL; ver setting
       *  enableTravel/travelMode). Estado leve e efêmero: Legs são uma CONTAGEM
       *  abstrata (sem milhas/velocidade/tempo), o atrito por Leg gasta Pack/Cargo
       *  (e Core no fallback), e o destino é uma Location opcional (inclusive uma
       *  filha aninhada) ou só um rótulo de texto. `active` falso = sem viagem. */
      journey: new fields.SchemaField({
        active: new fields.BooleanField({ initial: false }),
        // Rótulo livre do destino (nome mostrado na faixa/card); preenchido a partir
        // da Location quando uma é escolhida, ou digitado à mão.
        destName: new fields.StringField({ required: false, blank: true, initial: "" }),
        // Destino opcional: uuid de um Actor "location" (qualquer uma, inclusive
        // aninhada). Vazio = destino só de texto. Na chegada vira system.location,
        // e o Safe Rest lê o system.safe da própria Location.
        destUuid: new fields.StringField({ required: false, blank: true, initial: "" }),
        // Flavor LIVRE da jornada (não é o nome do destino: destName é sempre o
        // local escolhido). Aparece como subtítulo na faixa e nos cards.
        flavor: new fields.StringField({ required: false, blank: true, initial: "" }),
        legsTotal: new fields.NumberField({ required: true, integer: true, min: 1, initial: 3 }),
        legsDone: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        // "" = herda o travelMode do mundo; senão simple/standard/challenging.
        mode: new fields.StringField({ required: false, blank: true, initial: "" }),
        // true = a pé (cada character gasta o próprio Pack); false = de veículo (o
        // Cargo do Vehicle ativo cobre o grupo, com fallback no Pack ao Exaurir).
        onFoot: new fields.BooleanField({ initial: true }),
        // Log de refund: uuids de Trait gastos na jornada (uma entrada por passo de
        // shift down). O abort-com-devolução reverte cada um via shiftUp.
        spent: new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] })
      }),

      /** O JournalEntry auto-criado e de posse do jogador que embasa as "Field
       *  Notes" compartilhadas do codex (uma página por entrada). Definido na
       *  criação da party. */
      codexJournal: new fields.StringField({ required: false, blank: true, initial: "" })
    };
  }
}
