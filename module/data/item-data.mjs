/**
 * SHIFT VTT — modelos de dados de Item (TypeDataModel).
 *
 * O Trait é o coração do sistema: um bloco de montar genérico e configurável.
 * A categoria organiza a apresentação; os toggles e campos abaixo definem as
 * regras de fato que cada Trait segue.
 */
const fields = foundry.data.fields;

const DICE = ["d4", "d6", "d8", "d10", "d12"];
const CATEGORIES = ["core", "focus", "pack", "cargo", "attitude", "adversary", "special", "party", "quest", "custom"];

/* ------------------------------------------------------------------ */
/* Base compartilhada                                                  */
/* ------------------------------------------------------------------ */

class ShiftItemBase extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ required: false, blank: true, initial: "" }),
      /** Procedência em texto livre (livro, suplemento, homebrew). Alimenta o
       *  filtro de source do Browser para ordenar o conteúdo de compendium. */
      source: new fields.StringField({ required: false, blank: true, initial: "" })
    };
  }
}

/* ------------------------------------------------------------------ */
/* Trait                                                               */
/* ------------------------------------------------------------------ */

export class ShiftTraitData extends ShiftItemBase {
  static defineSchema() {
    const schema = super.defineSchema();

    schema.category = new fields.StringField({ required: true, initial: "custom", choices: CATEGORIES });

    schema.maxDie = new fields.StringField({ required: true, initial: "d6", choices: DICE });
    schema.currentDie = new fields.StringField({ required: true, initial: "d6", choices: DICE });
    schema.exhausted = new fields.BooleanField({ initial: false });

    schema.temporary = new fields.BooleanField({ initial: false });
    schema.locked = new fields.BooleanField({ initial: false });
    schema.revealed = new fields.BooleanField({ initial: true });
    schema.rollable = new fields.BooleanField({ initial: true });
    schema.autoShiftOnRoll = new fields.BooleanField({ initial: true });

    schema.features = new fields.SchemaField({
      usesKeywords: new fields.BooleanField({ initial: true }),
      usesDrawbacks: new fields.BooleanField({ initial: true })
    });

    schema.defeat = new fields.SchemaField({
      counts: new fields.BooleanField({ initial: true }),
      extraRequired: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      mustBeExhaustedFirst: new fields.BooleanField({ initial: false })
    });

    schema.adversary = new fields.SchemaField({
      countsTowardTraitLimit: new fields.BooleanField({ initial: true }),
      extraActions: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
    });

    schema.scale = new fields.SchemaField({
      custom: new fields.BooleanField({ initial: false }),
      value: new fields.NumberField({ required: true, integer: true, min: 1, max: 4, initial: 1 })
    });

    schema.loadout = new fields.StringField({ required: false, blank: true, initial: "" });
    schema.keywords = new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] });
    schema.drawbacks = new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] });

    return schema;
  }

  /** Mantém o dado atual dentro do máximo configurado (max = melhor). */
  prepareDerivedData() {
    super.prepareDerivedData();
    const maxIdx = DICE.indexOf(this.maxDie);
    const curIdx = DICE.indexOf(this.currentDie);
    if (maxIdx >= 0 && curIdx >= 0 && curIdx < maxIdx) this.currentDie = this.maxDie;
  }
}

/* ------------------------------------------------------------------ */
/* Keyword / Drawback (descriptor compartilhado)                       */
/* ------------------------------------------------------------------ */

export class ShiftDescriptorData extends ShiftItemBase {}

/* ------------------------------------------------------------------ */
/* Technique                                                           */
/* ------------------------------------------------------------------ */

export class ShiftTechniqueData extends ShiftItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.techniqueType = new fields.StringField({
      required: true,
      initial: "narrative",
      choices: ["narrative", "mechanical", "scaledUp"]
    });
    /** Vínculo do "Scaled Up": o Focus Trait que esta Technique eleva e a Scale
     *  em que ele é tratado. `traitId` é o id embutido estável no actor dono;
     *  `traitName` é o fallback durável entre importações. */
    schema.focus = new fields.SchemaField({
      traitId: new fields.StringField({ required: false, blank: true, initial: "" }),
      traitName: new fields.StringField({ required: false, blank: true, initial: "" }),
      // A Scale tratada vai de 2 a 4: um Scaled Up que resolve em Scale 1 não faz nada.
      scale: new fields.NumberField({ required: true, integer: true, min: 2, max: 4, initial: 2 })
    });
    /** Gatilhos de recharge. Os três gatilhos de rest podem ser combinados;
     *  `atWill` é exclusivo: uma Technique At Will tem usos ilimitados (∞) e
     *  ignora o contador `uses` por completo. Quando NENHUM está marcado, a
     *  Technique é custom (só reset manual). */
    schema.recharges = new fields.SchemaField({
      session: new fields.BooleanField({ initial: true }),
      safeRest: new fields.BooleanField({ initial: true }),
      unsafeRest: new fields.BooleanField({ initial: false }),
      atWill: new fields.BooleanField({ initial: false })
    });
    schema.uses = new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      max: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 })
    });
    return schema;
  }

  /** Mantém os invariantes de recharge consistentes para exibição e regras:
   *   - At Will é exclusivo: limpa os três gatilhos de rest.
   *   - "Em qualquer Rest" engloba "no Safe Rest", então Safe Rest fica sempre
   *     aceso junto (é mostrado, nunca escondido). */
  prepareDerivedData() {
    super.prepareDerivedData();
    const r = this.recharges;
    if (r) {
      if (r.atWill) { r.session = false; r.safeRest = false; r.unsafeRest = false; }
      else if (r.unsafeRest) r.safeRest = true;
    }
    // Scaled Up trata o Focus em Scale 2 a 4; corrige qualquer Scale 1 legado.
    if (this.focus && this.focus.scale < 2) this.focus.scale = 2;
  }

  /** Uso ilimitado: não precisa de recharge, o contador `uses` é ignorado. */
  get isAtWill() { return !!this.recharges?.atWill; }
}

/* ------------------------------------------------------------------ */
/* Landmark (áreas de Location)                                        */
/* ------------------------------------------------------------------ */

export class ShiftLandmarkData extends ShiftItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    /** Landmarks Safe permitem Safe Rests; os Unsafe tornam o descanso arriscado. */
    schema.safe = new fields.BooleanField({ initial: true });
    return schema;
  }
}
