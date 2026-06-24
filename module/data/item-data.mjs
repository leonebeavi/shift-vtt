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
      /** Nota privada do GM, em rich-text — espelha system.gmNote dos Actors. Vive na
       *  ficha do próprio Item e é o MESMO campo que o Codex do Party lê e edita, então
       *  as duas visões ficam sincronizadas. Nunca é revelada aos players; a description
       *  é que pode ser revelada no Codex. */
      gmNote: new fields.HTMLField({ required: false, blank: true, initial: "" }),
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

    // Tag de SUBDIVISÃO na ficha de Actor: a `key` do grupo da aba Traits onde o
    // Trait foi colocado (criado ou arrastado). Independente da `category`, que
    // carrega as REGRAS (Pack/Cargo, Core na morte, etc.). Em branco = sem tag: o
    // Trait cai na subdivisão pela categoria (comportamento legado), então Traits
    // antigos seguem funcionando sem migração. Ver BaseShiftActorSheet#traitLayout.
    schema.group = new fields.StringField({ required: false, blank: true, initial: "" });

    schema.maxDie = new fields.StringField({ required: true, initial: "d6", choices: DICE });
    schema.currentDie = new fields.StringField({ required: true, initial: "d6", choices: DICE });
    schema.exhausted = new fields.BooleanField({ initial: false });

    schema.temporary = new fields.BooleanField({ initial: false });
    schema.locked = new fields.BooleanField({ initial: false });
    schema.revealed = new fields.BooleanField({ initial: true });
    schema.rollable = new fields.BooleanField({ initial: true });
    schema.autoShiftOnRoll = new fields.BooleanField({ initial: true });

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

    // Transform on Exhaust: o Trait pode "resetar/transformar" IN PLACE (mesmo item, sem
    // mexer em UUID/contagem/targeting). É a generalização do reset da Attitude (pelas
    // regras, a Attitude exausta reseta a D4 com nova identidade) e serve pra formas
    // dramáticas ("this is not even my final form"). Como o reset limpa `exhausted`, o
    // Trait deixa de contar pro overcome e nunca vira um Trait a mais.
    schema.transform = new fields.SchemaField({
      enabled: new fields.BooleanField({ initial: false }),
      // Dispara sozinho ao exaurir (formas dramáticas). Off (padrão) = prompt do GM ao
      // exaurir; o correto pra Attitude (exaurir no combate conta pro overcome; o GM
      // decide depois se reseta).
      auto: new fields.BooleanField({ initial: false }),
      // Quando ligado, um player OWNER do Trait VÊ a aba Transform (só leitura — quem
      // edita/transforma é sempre o GM). Padrão off; útil pra revelar um item mágico.
      playerVisible: new fields.BooleanField({ initial: false }),
      // Die de reset do caso ABERTO (fila vazia, ex.: Attitude): reseta a este die e renomeia.
      resetDie: new fields.StringField({ required: true, initial: "d4", choices: DICE }),
      // Fila ORDENADA de formas: UUIDs de Trait items LINKADOS (arrastados na aba Transform).
      // Cada forma é um Trait normal (editado pela própria ficha). Vazia = caso aberto.
      forms: new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] }),
      // Posição atual na fila: -1 = base (identidade própria do Trait), 0..n = forms[stage].
      stage: new fields.NumberField({ required: true, integer: true, initial: -1 }),
      // Snapshot da identidade base, capturado ao SAIR dela pela 1ª vez, pra poder voltar.
      // O GM pode re-capturar (se editar a base depois) pelo botão na aba Transform.
      base: new fields.SchemaField({
        captured: new fields.BooleanField({ initial: false }),
        name: new fields.StringField({ required: false, blank: true, initial: "" }),
        maxDie: new fields.StringField({ required: false, blank: true, initial: "" }),
        currentDie: new fields.StringField({ required: false, blank: true, initial: "" }),
        keywords: new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] }),
        drawbacks: new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] }),
        description: new fields.HTMLField({ required: false, blank: true, initial: "" })
      })
    });

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
/* Quest                                                               */
/* ------------------------------------------------------------------ */

/**
 * Uma Quest é um item de PRIMEIRA CLASSE (tipo próprio), não um Trait. Ela
 * carrega o MESMO Shift Die como clock (compartilha o motor de shift/exhaust do
 * ShiftItem via `hasClock`), mas com seus próprios campos: o desfecho narrativo
 * decidido pelo GM (`outcome`, independente do Exhausted) e os `links` (UUIDs de
 * Actors/Items relacionados, espelhando o Codex da party). Modelo enxuto e
 * pensado para CRESCER (sub-objetivos, recompensas, etapas… entram aqui depois).
 */
export class ShiftQuestData extends ShiftItemBase {
  static defineSchema() {
    const schema = super.defineSchema();   // description, source

    // Clock (mesmo Shift Die dos Traits; o motor vive no ShiftItem, gated por hasClock).
    schema.maxDie = new fields.StringField({ required: true, initial: "d6", choices: DICE });
    schema.currentDie = new fields.StringField({ required: true, initial: "d6", choices: DICE });
    schema.exhausted = new fields.BooleanField({ initial: false });

    // Rolável é configurável: rolar uma quest pode dar ShiftDown (autoShiftOnRoll),
    // representando "o tempo acabando" — uma camada opcional de imprevisibilidade.
    schema.rollable = new fields.BooleanField({ initial: true });
    schema.autoShiftOnRoll = new fields.BooleanField({ initial: true });

    // Toggle do GM "ocultar dos players" (espelha `revealed` do Trait).
    schema.revealed = new fields.BooleanField({ initial: true });

    // Bookkeeping da cascata de ocultar: marca que esta Quest está oculta SÓ por
    // causa da mãe (não por um ocultar próprio do GM). Revelar a mãe restaura só
    // estas; uma filha que o GM ocultou sozinho fica oculta. NÃO afeta os players.
    schema.cascadeHidden = new fields.BooleanField({ initial: false });

    // Desfecho decidido pelo GM, INDEPENDENTE do clock/Exhausted.
    schema.outcome = new fields.StringField({
      required: true, initial: "none", choices: ["none", "success", "failure"]
    });

    // Links: UUIDs de Actors/Items relacionados (espelha system.codex da party).
    schema.links = new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] });

    // Pré-requisitos: ids de outras Quests (irmãs, na mesma Party) que precisam
    // CONCLUIR antes desta abrir. Enquanto pendentes, a Quest fica bloqueada.
    schema.requires = new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] });

    // Hierarquia: id da Quest-mãe (vazio = topo). As filhas aninham sob a mãe na
    // aba, e a mãe mostra o progresso (filhas resolvidas / total). NÃO usar o nome
    // "parent": é reservado pelo DataModel (aponta pro documento dono) — daí parentId.
    schema.parentId = new fields.StringField({ required: true, blank: true, initial: "" });

    return schema;
  }

  /** Mantém o dado atual dentro do máximo configurado (max = melhor), igual ao Trait. */
  prepareDerivedData() {
    super.prepareDerivedData();
    const maxIdx = DICE.indexOf(this.maxDie);
    const curIdx = DICE.indexOf(this.currentDie);
    if (maxIdx >= 0 && curIdx >= 0 && curIdx < maxIdx) this.currentDie = this.maxDie;
  }
}

/* ------------------------------------------------------------------ */
/* Connection                                                          */
/* ------------------------------------------------------------------ */

/**
 * Uma Connection é a relação do GRUPO com um alvo: um NPC, uma Location ou uma
 * Faction. Item de PRIMEIRA CLASSE que vive na Party (como a Quest e os Traits de
 * categoria party), carregando o MESMO Shift Die como clock — o motor de
 * shift/exhaust vive no ShiftItem, gated por `hasClock`. A escala segue a direção
 * do engine (melhor → pior): D4 = relação mais forte, D12 = quase rompida,
 * Exhausted = hostil "on sight" (a relação exausta não rola — não dá pra sacar
 * nada dela). O `target` é sempre uma entrada do Codex da Party (a tie é
 * mandatória e bidirecional); a escada de keywords por `kind` mora em
 * CONFIG.SHIFT.connectionKeywords. Pensado para CRESCER (os overrides por-membro
 * entram aqui depois, em `memberOverrides`).
 */
export class ShiftConnectionData extends ShiftItemBase {
  static defineSchema() {
    const schema = super.defineSchema();   // description, gmNote, source

    // Clock (mesmo Shift Die de Traits/Quests). maxDie é o TETO (melhor relação
    // possível): o default d4 deixa a relação chegar a Íntimo, mas o GM pode
    // baixá-lo pra capar quão próximo um alvo pode ficar. currentDie começa neutro.
    schema.maxDie = new fields.StringField({ required: true, initial: "d4", choices: DICE });
    schema.currentDie = new fields.StringField({ required: true, initial: "d8", choices: DICE });
    schema.exhausted = new fields.BooleanField({ initial: false });

    // Rolável e auto-shift configuráveis (igual Quest). Diferente da Quest, o padrão
    // de autoShiftOnRoll é OFF: sacar uma relação (pedir um favor) não a corrói
    // sozinha — quem move a escala é o jogo/GM. O actionRoll aceita qualquer hasClock.
    schema.rollable = new fields.BooleanField({ initial: true });
    schema.autoShiftOnRoll = new fields.BooleanField({ initial: false });

    // Toggle do GM "ocultar dos players" (espelha `revealed` do Trait/Quest). O
    // fail-closed real fica a cargo da camada de reveal do Codex que ancora a Connection.
    schema.revealed = new fields.BooleanField({ initial: true });

    // Tipo do alvo: governa o filtro (NPCs/Locais/Facções), a escada de keywords e o
    // ícone. NPC engloba qualquer Actor-personagem (inclusive um monstro amigável).
    schema.kind = new fields.StringField({ required: true, initial: "npc", choices: ["npc", "location", "faction"] });

    // UUID do alvo no mundo (Actor NPC/Location/Faction). É a MESMA chave da entrada
    // codex[] da Party: criar uma Connection sempre atrela (e cria, se faltar) o Codex.
    schema.target = new fields.StringField({ required: false, blank: true, initial: "" });

    // Keyword de disposição atual (ex.: "Íntimo", "Hostil"). Vazio = derivada na
    // apresentação de CONFIG.SHIFT.connectionKeywords[kind][statusKey]; preenchida só
    // quando o GM quer travar uma palavra específica fora da escada.
    schema.keyword = new fields.StringField({ required: false, blank: true, initial: "" });

    // Links: UUIDs de Actors/Items relacionados (espelha system.codex/links da Quest);
    // ex.: o Focus Trait de filiação cunhado a partir de uma Connection de Faction.
    schema.links = new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] });

    // Overrides por-membro: Characters da party que FOGEM da escala de grupo. Cada
    // player vê o override do SEU personagem (se houver); o GM vê o de grupo + um
    // breakdown de todos. O die de GRUPO acima continua a verdade rolável — o override
    // é narrativo/de exibição (não muda a rolagem na v1). `member` = UUID do Character;
    // `die` vazio = usa o de grupo (ou `exhausted` true pra hostil só com aquele membro).
    schema.memberOverrides = new fields.ArrayField(new fields.SchemaField({
      member: new fields.StringField({ required: true, blank: false }),
      die: new fields.StringField({ required: false, blank: true, initial: "", choices: ["", ...DICE] }),
      exhausted: new fields.BooleanField({ initial: false }),
      keyword: new fields.StringField({ required: false, blank: true, initial: "" }),
      note: new fields.StringField({ required: false, blank: true, initial: "" })
      // initial como FUNÇÃO (não o literal []): garante um array NOVO por documento, sem
      // o footgun do Foundry de compartilhar a mesma referência [] entre conexões.
    }), { initial: () => [] });

    return schema;
  }

  /** Mantém o dado atual dentro do máximo configurado (max = melhor), igual Trait/Quest. */
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
    // Tag de SUBDIVISÃO na aba Techniques (a `key` do grupo onde a Technique foi posta,
    // criada ou arrastada). Espelha system.group do Trait: em branco = sem tag, cai na
    // subdivisão pelo techniqueType (fallback legado, sem migração). Ver
    // BaseShiftActorSheet#layoutFor("technique").
    schema.group = new fields.StringField({ required: false, blank: true, initial: "" });
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

