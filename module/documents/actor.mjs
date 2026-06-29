/**
 * SHIFT VTT, documento de Actor.
 */
import { DIE_PROGRESSION, dieIndex, dieLabel, fvtt, promptChoice, promptText, promptTraitChoice, shiftSpeaker } from "../helpers/utils.mjs";

export class ShiftActor extends Actor {

  /* ---------------------------------------------------------------- */
  /* Padrões de criação                                                */
  /* ---------------------------------------------------------------- */

  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    // Padrões de Token por tipo
    const token = {};
    const D = CONST.TOKEN_DISPOSITIONS;
    switch (this.type) {
      case "character":
        Object.assign(token, { actorLink: true, disposition: D.FRIENDLY });
        break;
      case "adversary":
        Object.assign(token, { disposition: D.HOSTILE, bar1: { attribute: "defeat" } });
        break;
      case "location":
        Object.assign(token, { actorLink: true, disposition: D.NEUTRAL });
        break;
      case "vehicle":
        // Vehicle é um recurso COMPARTILHADO (crew/cargo, gasto/restaurado em rest e
        // sincronizado por syncActiveVehicleCrew), sempre referenciado pelo Actor de
        // MUNDO via UUID. Linkado para que um token nunca vire uma cópia sintética que
        // dessincronize o Cargo do veículo que a party realmente usa.
        Object.assign(token, { actorLink: true, disposition: D.NEUTRAL });
        break;
      case "faction":
        // Faction vive no Codex/Connections, referenciada por UUID de mundo; linkar
        // mantém a paridade com Location/Vehicle e evita cópias sintéticas.
        Object.assign(token, { actorLink: true, disposition: D.NEUTRAL });
        break;
      case "party":
        // Uma party é um Roster, não um Combatant; seu próprio Token raramente é
        // colocado, mas mantemos linkado e friendly para o caso raro em que for.
        Object.assign(token, { actorLink: true, disposition: D.FRIENDLY });
        // Players consultam a party por padrão → OBSERVER, a menos que o criador
        // já tenha definido a ownership.
        if (!data.ownership || data.ownership.default === undefined) {
          this.updateSource({ "ownership.default": CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER });
        }
        break;
      default:
        Object.assign(token, { disposition: D.NEUTRAL });
    }
    this.updateSource({ prototypeToken: foundry.utils.mergeObject(token, data.prototypeToken ?? {}, { inplace: false }) });

    // Ícone padrão por tipo (Character mantém o mystery-man do Foundry). Só é
    // aplicado quando o criador deixou o padrão genérico; uma imagem escolhida é
    // preservada.
    const icon = CONFIG.SHIFT.defaultActorIcons?.[this.type];
    const genericImg = !data.img || data.img === "icons/svg/mystery-man.svg";
    if (icon && genericImg) this.updateSource({ img: icon });

    // Traits iniciais (pulado se os dados de origem já fornecem items, ex. duplicação/importação)
    if (data.items?.length) return;
    const i18n = k => game.i18n.localize(k);
    const trait = (name, sys) => ({ name, type: "trait", img: CONFIG.SHIFT.defaultIcons.trait, system: sys });
    const core = (name, die) => trait(name, {
      category: "core", maxDie: die, currentDie: die, locked: true
    });
    // Attitude name-based: o NOME do Trait carrega o humor, e já nasce com Transform
    // habilitado (reset ao próprio die com nova identidade quando exausta).
    const attitude = (name, die, extra = {}) => trait(name, {
      category: "attitude", maxDie: die, currentDie: die, locked: true,
      transform: { enabled: true, resetDie: die },
      ...extra
    });
    const items = [];

    const packLike = (name, category) => trait(name, {
      category, maxDie: "d6", currentDie: "d6", locked: true
    });
    switch (this.type) {
      case "character":
        // Sem Pack Trait por padrão; o Player adiciona um quando quiser.
        items.push(
          core(i18n("SHIFT.Trait.Body"), "d6"),
          core(i18n("SHIFT.Trait.Mind"), "d8"),
          core(i18n("SHIFT.Trait.Soul"), "d10")
        );
        break;
      case "adversary":
        items.push(attitude(i18n("SHIFT.Trait.Attitude"), "d4"));
        break;
      case "vehicle":
        items.push(
          core(i18n("SHIFT.Trait.Structure"), "d8"),
          core(i18n("SHIFT.Trait.Maneuverability"), "d8"),
          packLike(i18n("SHIFT.Trait.Cargo"), "cargo")
        );
        break;
      case "location":
        // Locations: Attitude, Wealth e Security (pelas regras). Seus dados
        // nunca dão ShiftDown a partir das próprias Action Rolls.
        items.push(
          attitude(i18n("SHIFT.Trait.Attitude"), "d6", { autoShiftOnRoll: false }),
          { ...core(i18n("SHIFT.Trait.Wealth"), "d8"), system: { category: "core", maxDie: "d8", currentDie: "d8", locked: true, autoShiftOnRoll: false } },
          { ...core(i18n("SHIFT.Trait.Security"), "d8"), system: { category: "core", maxDie: "d8", currentDie: "d8", locked: true, autoShiftOnRoll: false } }
        );
        break;
      case "faction":
        // Factions: Attitude + Influência + Efetivo (espelha a Location). Seus dados
        // nunca dão ShiftDown a partir das próprias Action Rolls.
        items.push(
          attitude(i18n("SHIFT.Trait.Attitude"), "d6", { autoShiftOnRoll: false }),
          { ...core(i18n("SHIFT.Trait.Influence"), "d8"), system: { category: "core", maxDie: "d8", currentDie: "d8", locked: true, autoShiftOnRoll: false } },
          { ...core(i18n("SHIFT.Trait.Numbers"), "d8"), system: { category: "core", maxDie: "d8", currentDie: "d8", locked: true, autoShiftOnRoll: false } }
        );
        break;
    }
    if (items.length) this.updateSource({ items });
  }

  /* ---------------------------------------------------------------- */
  /* Helpers de acesso a Traits                                        */
  /* ---------------------------------------------------------------- */

  get traits() {
    return this.items.filter(i => i.type === "trait");
  }

  get techniques() {
    return this.items.filter(i => i.type === "technique");
  }

  /** Quests deste Actor (tipo próprio; a Party é quem normalmente as carrega). */
  get quests() {
    return this.items.filter(i => i.type === "quest");
  }

  /** Connections deste Actor (relações com NPC/Local/Facção; a Party é quem
   *  normalmente as carrega, espelhando quests). */
  get connections() {
    return this.items.filter(i => i.type === "connection");
  }

  getTraits(category) {
    return this.traits.filter(t => t.system.category === category);
  }

  /** Traits que um Unsafe Rest pode restaurar (veja ShiftItem#needsRestore). */
  get restorableTraits() {
    return this.traits.filter(t => t.needsRestore);
  }

  /** O Trait gasto em Unsafe Rests: Pack (ou Cargo para vehicles). */
  get packTrait() {
    return this.getTraits("pack")[0] ?? this.getTraits("cargo")[0] ?? null;
  }

  /** Vehicles em que este Actor é tripulação ("contido em"). */
  get crewedVehicles() {
    return game.actors.filter(a => a.type === "vehicle" && (a.system.crew ?? []).includes(this.uuid));
  }

  /** Todo dado que pode ser gasto no Unsafe Rest deste Actor:
   *  o próprio Pack mais o Cargo de qualquer Vehicle tripulado. */
  get restResources() {
    const out = [];
    const own = this.packTrait;
    if (own) out.push(own);
    for (const v of this.crewedVehicles) {
      const cargo = v.getTraits?.("cargo")[0] ?? v.items.find(i => i.type === "trait" && i.system.category === "cargo");
      if (cargo) out.push(cargo);
    }
    return out;
  }

  /* ---------------------------------------------------------------- */
  /* Aninhamento de Locations (filhas = "Landmarks")                  */
  /* ---------------------------------------------------------------- */

  /** Locations-filhas DIRETAS desta Location (resolvidas de system.children).
   *  Pula refs mortas, não-Location e auto-referência. Espelha partyMembers. */
  get childLocations() {
    if (this.type !== "location") return [];
    const out = [];
    for (const uuid of this.system.children ?? []) {
      const a = fromUuidSync(uuid);
      if (a instanceof Actor && a.type === "location" && a.uuid !== this.uuid) out.push(a);
    }
    return out;
  }

  /** A Location-mãe desta (lookup reverso; single-parent por design). null no topo.
   *  Espelha crewedVehicles. */
  get parentLocation() {
    if (this.type !== "location") return null;
    return game.actors.find(a => a.type === "location" && (a.system.children ?? []).includes(this.uuid)) ?? null;
  }

  /** Cadeia de ancestrais (mãe, avó, ...) do mais próximo ao mais distante, com cap
   *  de profundidade contra ciclos. Base do breadcrumb e da guarda de ciclo. */
  get locationAncestors() {
    const chain = [];
    let cur = this.parentLocation;
    let guard = 0;
    while (cur && guard++ < 50 && !chain.some(a => a.uuid === cur.uuid)) { chain.push(cur); cur = cur.parentLocation; }
    return chain;
  }

  /** Aninha uma Location-filha aqui: single-parent (tira da mãe anterior), sem
   *  ciclo (a filha não pode ser ancestral desta), sem duplicar. */
  async addChildLocation(uuid) {
    if (this.type !== "location" || !uuid || uuid === this.uuid) return;
    const child = await fromUuid(uuid);
    if (child?.type !== "location") return;
    if (this.locationAncestors.some(a => a.uuid === uuid)) {
      return void ui.notifications.warn(game.i18n.localize("SHIFT.Location.CycleBlock"));
    }
    const prev = child.parentLocation;
    if (prev && prev.uuid !== this.uuid) {
      // Single-parent: PRECISA desvincular da mãe anterior antes de aninhar aqui. Se
      // não dá pra editar a mãe anterior (sem permissão), aborta o movimento INTEIRO —
      // senão a filha ficaria listada sob duas mães (breadcrumb/parent/reveal inconsistentes).
      if (!prev.isOwner) return void ui.notifications.warn(game.i18n.localize("SHIFT.Location.ReparentNoPerm"));
      await prev.update({ "system.children": (prev.system.children ?? []).filter(u => u !== uuid) });
    }
    const cur = this.system.children ?? [];
    if (!cur.includes(uuid)) await this.update({ "system.children": [...cur, uuid] });
  }

  /** Remove uma Location-filha desta (não deleta o Actor). */
  async removeChildLocation(uuid) {
    if (this.type !== "location") return;
    await this.update({ "system.children": (this.system.children ?? []).filter(u => u !== uuid) });
  }

  /* ---------------------------------------------------------------- */
  /* Membros da party (group Actor)                                    */
  /* ---------------------------------------------------------------- */

  /**
   * Actors membros vivos de uma party, resolvidos a partir dos UUIDs de mundo
   * armazenados em `system.members`, preservando a ordem. UUIDs órfãos (actors
   * deletados) e qualquer party aninhada são pulados, para que quem chamar sempre
   * receba docs usáveis e não recursivos.
   * @returns {ShiftActor[]}
   */
  get partyMembers() {
    if (this.type !== "party") return [];
    const out = [];
    for (const uuid of this.system.members ?? []) {
      const a = fromUuidSync(uuid);
      if (a instanceof Actor && a.type !== "party") out.push(a);
    }
    return out;
  }

  /**
   * Adiciona um ou mais Actors a esta party. Rejeita actors não persistidos
   * (compendium / sintéticos), parties aninhadas, a si mesma e duplicatas; faz um
   * único update. Espelha o contrato `addMembers` do PF2e.
   * @param {...ShiftActor} actors
   */
  async addPartyMembers(...actors) {
    if (this.type !== "party") return;
    const current = [...(this.system.members ?? [])];
    let changed = false;
    for (const a of actors) {
      if (!(a instanceof Actor)) continue;
      if (!a.uuid?.startsWith("Actor.")) continue; // apenas actors de mundo persistidos
      if (a.type === "party" || a.uuid === this.uuid) continue;
      if (current.includes(a.uuid)) continue;
      current.push(a.uuid);
      changed = true;
    }
    if (changed) {
      await this.update({ "system.members": current });
      await this.syncActiveVehicleCrew();
    }
  }

  /**
   * Remove membros por UUID ou referência de Actor. Faz um único update.
   * @param {...(string|ShiftActor)} refs
   */
  async removePartyMembers(...refs) {
    if (this.type !== "party") return;
    const remove = new Set(refs.map(r => (typeof r === "string" ? r : r?.uuid)).filter(Boolean));
    const members = this.system.members ?? [];
    const next = members.filter(u => !remove.has(u));
    if (next.length !== members.length) {
      await this.update({ "system.members": next });
      await this.syncActiveVehicleCrew();
    }
  }

  /**
   * Define (ou limpa) o Vehicle ativo da party. Limpa a tripulação do Vehicle
   * ANTERIOR (ele não espelha mais este Roster) e sincroniza o novo. Passe "" para
   * limpar.
   * @param {string} uuid
   */
  async setActiveVehicle(uuid) {
    if (this.type !== "party") return;
    const prev = this.system.vehicle;
    if (prev && prev !== uuid) {
      const pv = await fromUuid(prev);
      if (pv?.type === "vehicle" && pv.isOwner && (pv.system.crew ?? []).length) {
        await pv.update({ "system.crew": [] });
      }
    }
    await this.update({ "system.vehicle": uuid || "" });
    if (uuid) await this.syncActiveVehicleCrew();
  }

  /**
   * Quando esta party tem um Vehicle ativo, espelha sua tripulação nos membros
   * CHARACTER da party. Autoritativo (tripulação = characters atuais do Roster).
   * Só um owner do Vehicle escreve; seguro chamar de qualquer client.
   */
  async syncActiveVehicleCrew() {
    if (this.type !== "party") return;
    const uuid = this.system.vehicle;
    if (!uuid) return;
    const v = await fromUuid(uuid);
    if (v?.type !== "vehicle" || !v.isOwner) return;
    const crew = this.partyMembers.filter(m => m.type === "character").map(m => m.uuid);
    const cur = v.system.crew ?? [];
    if (crew.length === cur.length && crew.every(u => cur.includes(u))) return;
    await v.update({ "system.crew": crew });
  }

  /* ---------------------------------------------------------------- */
  /* Economia de XP                                                    */
  /* ---------------------------------------------------------------- */

  /**
   * Concede XP a um character.
   * @param {number} amount
   * @param {object} [opts]
   * @param {boolean} [opts.limited=true] Aplica o teto por sessão (XP de roll/Exert).
   * @param {string}  [opts.reason]
   * @param {boolean} [opts.toChat=false]
   * @returns {Promise<number>} XP de fato concedido
   */
  async addXP(amount, { limited = true, reason = "", toChat = false } = {}) {
    if (this.type !== "character" || !Number.isFinite(amount) || amount <= 0) return 0;
    let granted = Math.floor(amount);
    if (limited) {
      const cap = game.settings.get("shift-vtt", "xpPerSessionLimit") ?? 5;
      const room = Math.max(0, cap - (this.system.xp.session ?? 0));
      granted = Math.min(granted, room);
    }
    if (granted <= 0) return 0;
    const update = { "system.xp.value": (this.system.xp.value ?? 0) + granted };
    if (limited) update["system.xp.session"] = (this.system.xp.session ?? 0) + granted;
    await this.update(update);
    if (toChat) {
      await ChatMessage.create({
        speaker: shiftSpeaker(this),
        content: `<div class="shift-vtt chat-card info-card xp"><p>${game.i18n.format("SHIFT.Xp.Gained", {
          actor: foundry.utils.escapeHTML(this.name), amount: granted
        })}${reason ? ` <em>(${foundry.utils.escapeHTML(reason)})</em>` : ""}</p></div>`
      });
    }
    return granted;
  }

  /**
   * Gasta XP guardado (o inverso de {@link addXP}). Usado pela regra opcional
   * "gastar XP para Scale Up de uma Action Roll". Mexe APENAS em `system.xp.value`
   * (o pool guardado), nunca em `system.xp.session`, e nunca no teto por sessão,
   * porque gastar XP é, por design, sem teto.
   * @param {number} amount XP a gastar (precisa estar disponível)
   * @returns {Promise<number>} quantia de fato gasta (0 se insuficiente)
   */
  async spendXP(amount) {
    if (this.type !== "character" || !Number.isFinite(amount) || amount <= 0) return 0;
    const cost = Math.floor(amount);
    const have = this.system.xp.value ?? 0;
    if (have < cost) return 0;
    await this.update({ "system.xp.value": have - cost });
    return cost;
  }

  /**
   * Efetiva a compra de um advancement: gasta o XP, marca a flag "já avançou nesta
   * sessão" e ANUNCIA no chat (o rastro de auditoria que torna o gasto transparente).
   * O EFEITO em si (nova Keyword, Trait, Technique, melhorar um Core…) é aplicado pela
   * mesa: a lista de advancements é configurável pelo GM, então o sistema não presume
   * o que cada um faz; ele só cobra o XP e registra.
   * @param {object} opts
   * @param {string} [opts.label] rótulo já localizado do advancement comprado
   * @param {number} [opts.cost] XP a gastar
   * @param {string|null} [opts.approvedBy] nome do GM que aprovou um gasto extra (se houver)
   * @returns {Promise<boolean>} true se o gasto foi efetivado
   */
  async commitAdvancement({ label = "", cost = 0, approvedBy = null } = {}) {
    if (this.type !== "character") return false;
    const c = Math.max(0, Math.floor(cost ?? 0));
    if (c > 0) {
      const spent = await this.spendXP(c);
      if (spent < c) {
        ui.notifications.warn(game.i18n.format("SHIFT.Advancement.NotEnough", {
          cost: c, have: this.system.xp?.value ?? 0
        }));
        return false;
      }
    }
    await this.setFlag("shift-vtt", "advancedThisSession", true);
    const esc = foundry.utils.escapeHTML;
    const approvedLine = approvedBy
      ? `<p class="xp-note muted"><i class="fa-solid fa-user-shield"></i> ${game.i18n.format("SHIFT.Advancement.ApprovedBy", { gm: esc(approvedBy) })}</p>`
      : "";
    await ChatMessage.create({
      speaker: shiftSpeaker(this),
      content: `<div class="shift-vtt chat-card info-card advancement">
        <h3><i class="fa-solid fa-star"></i> ${game.i18n.localize("SHIFT.Advancement.Title")}</h3>
        <p>${game.i18n.format("SHIFT.Advancement.Chat", { actor: esc(this.name), cost: c, label: esc(label) })}</p>${approvedLine}
      </div>`
    });
    return true;
  }

  /* ---------------------------------------------------------------- */
  /* Exert: ShiftDown voluntário por um sucesso automático             */
  /* ---------------------------------------------------------------- */

  async exert(trait) {
    if (!trait?.isTrait || trait.system.exhausted) {
      ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.TraitExhausted"));
      return;
    }
    const confirmed = await fvtt.DialogV2.confirm({
      window: { title: game.i18n.localize("SHIFT.Exert.Title") },
      content: `<p>${game.i18n.format("SHIFT.Exert.Confirm", {
        trait: foundry.utils.escapeHTML(trait.name),
        die: dieLabel(trait.system.currentDie)
      })}</p>`,
      rejectClose: false
    });
    if (!confirmed) return;

    const from = trait.statusKey;
    await trait.shiftDown({ force: true });
    const to = trait.statusKey;

    let xpNote = "";
    if (game.settings.get("shift-vtt", "autoXp")) {
      const granted = await this.addXP(1, { limited: true });
      xpNote = granted > 0
        ? `<p class="xp-note"><i class="fa-solid fa-arrow-trend-up"></i> ${game.i18n.format("SHIFT.Xp.PlusN", { n: granted })}</p>`
        : `<p class="xp-note muted">${game.i18n.localize("SHIFT.Xp.CapReached")}</p>`;
    }

    await ChatMessage.create({
      speaker: shiftSpeaker(this),
      content: `<div class="shift-vtt chat-card info-card exert">
        <h3><i class="fa-solid fa-hand-fist"></i> ${game.i18n.localize("SHIFT.Exert.Title")}</h3>
        <p>${game.i18n.format("SHIFT.Exert.Chat", {
          actor: foundry.utils.escapeHTML(this.name),
          trait: foundry.utils.escapeHTML(trait.name),
          from: dieLabel(from), to: dieLabel(to)
        })}</p>${xpNote}</div>`
    });
  }

  /* ---------------------------------------------------------------- */
  /* Focus Trait temporário (a partir do Pack/Cargo Trait)             */
  /* ---------------------------------------------------------------- */

  async createTemporaryFocus(packTrait) {
    packTrait ??= this.packTrait;
    if (!packTrait || packTrait.system.exhausted) {
      ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.PackExhausted"));
      return;
    }
    const name = await promptText({
      title: game.i18n.localize("SHIFT.Temporary.Title"),
      label: game.i18n.localize("SHIFT.Temporary.NameLabel"),
      initial: ""
    });
    if (!name) return;

    const startDie = packTrait.system.currentDie; // dado antes do shift
    await packTrait.shiftDown({ force: true });
    await this.createEmbeddedDocuments("Item", [{
      name,
      type: "trait",
      img: "icons/svg/chest.svg",
      system: {
        category: "focus",
        temporary: true,
        maxDie: startDie,
        currentDie: startDie,
        locked: true,
        source: game.i18n.localize("SHIFT.Temporary.Source")
      }
    }]);
    await ChatMessage.create({
      speaker: shiftSpeaker(this),
      content: `<div class="shift-vtt chat-card info-card"><p>${game.i18n.format("SHIFT.Temporary.Chat", {
        actor: foundry.utils.escapeHTML(this.name),
        name: foundry.utils.escapeHTML(name),
        die: dieLabel(startDie)
      })}</p></div>`
    });
  }

  /* ---------------------------------------------------------------- */
  /* Rest & Recovery                                                   */
  /* ---------------------------------------------------------------- */

  /**
   * Safe Rest: todo dado de Core, Focus, Pack e Cargo Trait dá ShiftUp de volta ao
   * seu Max Die e Techniques recuperam todos os usos. Focus Traits temporários
   * expiram. Special Traits NÃO restauram em rest (mesmo carve-out de
   * ShiftItem#needsRestore) — exigem restauração específica. O modo challenging limita
   * a restauração ao dado de Wealth da Location; só o Pack Trait é isento (sempre volta
   * ao seu máximo D6). O Cargo de um Vehicle, como Core/Focus, respeita o teto de Wealth.
   */
  async safeRest({ wealthDie = null } = {}) {
    const mode = game.settings.get("shift-vtt", "restMode");
    let wealthCapIdx = -1;

    if (mode === "challenging") {
      if (wealthDie) {
        // Teto fornecido pela Location da party (Challenging Rest); sem prompt.
        wealthCapIdx = dieIndex(wealthDie);
      } else {
        const choice = await promptChoice({
          title: game.i18n.localize("SHIFT.Rest.Safe"),
          hint: game.i18n.localize("SHIFT.Rest.WealthHint"),
          options: [
            { value: "none", label: game.i18n.localize("SHIFT.Rest.NoLimit") },
            ...DIE_PROGRESSION.map(d => ({ value: d, label: dieLabel(d) }))
          ]
        });
        if (choice === null) return;
        if (choice !== "none") wealthCapIdx = dieIndex(choice);
      }
    }

    const temporary = this.traits.filter(t => t.system.temporary);
    if (temporary.length) await this.deleteEmbeddedDocuments("Item", temporary.map(t => t.id));

    const updates = [];
    for (const t of this.traits) {
      // Special Traits não restauram em rest (mesmo carve-out de needsRestore);
      // os Temporary já foram removidos acima.
      if (t.system.category === "special") continue;
      const maxIdx = dieIndex(t.system.maxDie);
      // Só o Pack é isento do teto de Wealth; o Cargo (como Core/Focus) o respeita.
      const isPack = t.system.category === "pack";
      let targetIdx = maxIdx;
      if (wealthCapIdx >= 0 && !isPack) targetIdx = Math.max(maxIdx, wealthCapIdx);
      // O teto limita a recuperação; nunca piora um dado que já esteja acima dele.
      if (!t.system.exhausted) targetIdx = Math.min(targetIdx, dieIndex(t.system.currentDie));
      updates.push({ _id: t.id, "system.currentDie": DIE_PROGRESSION[targetIdx], "system.exhausted": false });
    }
    for (const tech of this.techniques) {
      const r = tech.system.recharges ?? {};
      if (r.session || r.safeRest || r.unsafeRest) {
        updates.push({ _id: tech.id, "system.uses.value": tech.system.uses.max });
      }
    }
    if (updates.length) await this.updateEmbeddedDocuments("Item", updates);

    // O card aponta o teto: se Wealth limitou a recuperação, nomeia o dado e
    // ressalva o Pack (única isenção); senão, a mensagem de restauração total.
    let safeBody;
    if (wealthCapIdx >= 0) {
      const die = dieLabel(DIE_PROGRESSION[wealthCapIdx]);
      safeBody = game.i18n.format("SHIFT.Rest.SafeChatCapped", { actor: foundry.utils.escapeHTML(this.name), die });
      if (this.traits.some(t => t.system.category === "pack")) {
        safeBody += " " + game.i18n.localize("SHIFT.Rest.SafePackException");
      }
    } else {
      safeBody = game.i18n.format("SHIFT.Rest.SafeChat", { actor: foundry.utils.escapeHTML(this.name) });
    }
    // Só menciona Techniques se o Actor tiver alguma (Vehicles não têm).
    if (this.techniques.length) safeBody += " " + game.i18n.localize("SHIFT.Rest.SafeTechniques");
    await ChatMessage.create({
      speaker: shiftSpeaker(this),
      content: `<div class="shift-vtt chat-card info-card rest safe">
        <h3><i class="fa-solid fa-campground"></i> ${game.i18n.localize("SHIFT.Rest.Safe")}</h3>
        <p>${safeBody}</p>
      </div>`
    });
  }

  /**
   * Unsafe Rest: dá ShiftDown de um no Pack Trait para restaurar dados de Trait.
   *  - standard: um Core ou Focus Trait de volta ao seu máximo
   *  - simple: todos os Traits de volta aos seus máximos
   *  - challenging: um Trait sobe dois passos, ou dois Traits sobem um passo cada
   */
  async unsafeRest() {
    const mode = game.settings.get("shift-vtt", "restMode");
    const resources = this.restResources.filter(t => !t.system.exhausted);
    if (!resources.length) {
      ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.PackExhausted"));
      return;
    }
    let pack = resources[0];
    if (resources.length > 1) {
      const id = await promptTraitChoice({
        title: game.i18n.localize("SHIFT.Rest.Unsafe"),
        hint: game.i18n.localize("SHIFT.Rest.ResourceHint"),
        options: resources.map(t => ({
          value: t.uuid,
          name: (t.actor === this || t.actor?.type === "vehicle") ? t.name : `${t.actor?.name ?? ""}: ${t.name}`,
          img: CONFIG.SHIFT.diceImages[t.statusKey],
          sub: dieLabel(t.system.currentDie)
        }))
      });
      if (!id) return;
      pack = resources.find(t => t.uuid === id) ?? pack;
    }

    const restorable = this.restorableTraits;

    const summarize = [];

    if (mode === "simple") {
      await pack.shiftDown({ force: true });
      // Restaura todos os Traits restauráveis: exclui o que é gasto (Pack/Cargo) e os
      // Special (carve-out de needsRestore), consistente com o Safe Rest.
      const updates = this.traits
        .filter(t => !["pack", "cargo", "special"].includes(t.system.category))
        .map(t => ({ _id: t.id, "system.currentDie": t.system.maxDie, "system.exhausted": false }));
      if (updates.length) await this.updateEmbeddedDocuments("Item", updates);
      summarize.push(game.i18n.localize("SHIFT.Rest.AllRestored"));
    }
    else if (mode === "challenging") {
      const plan = await promptChoice({
        title: game.i18n.localize("SHIFT.Rest.Unsafe"),
        hint: game.i18n.localize("SHIFT.Rest.ChallengingHint"),
        options: [
          { value: "one", label: game.i18n.localize("SHIFT.Rest.OneTwice") },
          { value: "two", label: game.i18n.localize("SHIFT.Rest.TwoOnce") }
        ]
      });
      if (!plan) return;
      const pickOne = async exclude => promptTraitChoice({
        title: game.i18n.localize("SHIFT.Rest.PickTrait"),
        options: restorable
          .filter(t => t.id !== exclude)
          .map(t => ({
            value: t.id,
            name: t.name,
            img: CONFIG.SHIFT.diceImages[t.statusKey],
            sub: `${dieLabel(t.statusKey)} → ${dieLabel(t.system.maxDie)}`
          }))
      });
      if (!restorable.length) return void ui.notifications.info(game.i18n.localize("SHIFT.Rest.NothingToRestore"));

      const firstId = await pickOne();
      if (!firstId) return;
      await pack.shiftDown({ force: true });
      const first = this.items.get(firstId);
      if (plan === "one") {
        await first.shiftUp({ steps: 2 });
        summarize.push(game.i18n.format("SHIFT.Rest.RaisedTwo", { trait: first.name }));
      } else {
        await first.shiftUp({ steps: 1 });
        summarize.push(game.i18n.format("SHIFT.Rest.RaisedOne", { trait: first.name }));
        const secondId = await pickOne(firstId);
        if (secondId) {
          const second = this.items.get(secondId);
          await second.shiftUp({ steps: 1 });
          summarize.push(game.i18n.format("SHIFT.Rest.RaisedOne", { trait: second.name }));
        }
      }
    }
    else { // standard
      if (!restorable.length) return void ui.notifications.info(game.i18n.localize("SHIFT.Rest.NothingToRestore"));
      const id = await promptTraitChoice({
        title: game.i18n.localize("SHIFT.Rest.Unsafe"),
        hint: game.i18n.format("SHIFT.Rest.UnsafeHint", { pack: pack.name }),
        options: restorable.map(t => ({
          value: t.id,
          name: t.name,
          img: CONFIG.SHIFT.diceImages[t.statusKey],
          sub: `${dieLabel(t.statusKey)} → ${dieLabel(t.system.maxDie)}`
        }))
      });
      if (!id) return;
      await pack.shiftDown({ force: true });
      const target = this.items.get(id);
      await target.restore();
      summarize.push(game.i18n.format("SHIFT.Rest.Restored", { trait: target.name }));
    }

    const techUpdates = this.techniques
      .filter(t => t.system.recharges?.unsafeRest)
      .map(t => ({ _id: t.id, "system.uses.value": t.system.uses.max }));
    if (techUpdates.length) await this.updateEmbeddedDocuments("Item", techUpdates);

    // Gastar o Cargo de um Vehicle abastece todos a bordo: convida o resto da
    // tripulação a restaurar um Trait cada a partir do mesmo shift.
    if (pack.system.category === "cargo" && pack.actor?.type === "vehicle") {
      const vehicle = pack.actor;
      const others = (vehicle.system.crew ?? []).filter(u => u !== this.uuid);
      if (others.length) {
        await ChatMessage.create({
          speaker: shiftSpeaker(this),
          content: `<div class="shift-vtt chat-card info-card rest unsafe">
            <h3><i class="fa-solid fa-boxes-stacked"></i> ${game.i18n.format("SHIFT.Rest.CargoShared", {
              vehicle: foundry.utils.escapeHTML(vehicle.name)
            })}</h3>
            <p>${game.i18n.localize("SHIFT.Rest.CargoSharedHint")}</p>
            <div class="action-row">
              <button type="button" class="card-action" data-shift-crewrestore>
                <i class="fa-solid fa-rotate-left"></i> ${game.i18n.localize("SHIFT.Rest.CrewRestore")}
              </button>
            </div>
          </div>`,
          flags: { "shift-vtt": { kind: "crewRestore", vehicleUuid: vehicle.uuid, crew: others } }
        });
      }
    }

    await ChatMessage.create({
      speaker: shiftSpeaker(this),
      content: `<div class="shift-vtt chat-card info-card rest unsafe">
        <h3><i class="fa-solid fa-fire"></i> ${game.i18n.localize("SHIFT.Rest.Unsafe")}</h3>
        <p>${game.i18n.format("SHIFT.Rest.UnsafeChat", {
          actor: foundry.utils.escapeHTML(this.name),
          pack: foundry.utils.escapeHTML(pack.name),
          die: dieLabel(pack.statusKey)
        })}</p>
        <p>${summarize.map(s => foundry.utils.escapeHTML(s)).join("<br>")}</p>
      </div>`
    });
  }

  /**
   * Contabilidade de início de sessão: Techniques são renovadas e o contador de
   * XP por sessão zera. No modo de rest Simple, todos os dados também restauram.
   */
  async newSession() {
    const updates = this.techniques
      .filter(t => t.system.recharges?.session)
      .map(t => ({ _id: t.id, "system.uses.value": t.system.uses.max }));
    if (game.settings.get("shift-vtt", "restMode") === "simple") {
      for (const t of this.traits) {
        updates.push({ _id: t.id, "system.currentDie": t.system.maxDie, "system.exhausted": false });
      }
    }
    if (updates.length) await this.updateEmbeddedDocuments("Item", updates);
    // Início de sessão zera o XP de sessão e LIBERA o advancement do período (a trava
    // de "1 por sessão" volta a permitir um novo).
    if (this.type === "character") {
      await this.update({ "system.xp.session": 0, "flags.shift-vtt.advancedThisSession": false });
    }
  }

  /**
   * Restaura todo Trait ao seu Max Die e limpa Exhausted. Uma recuperação
   * silenciosa: sem custo de Pack, sem expiração de Trait temporário, sem prompts
   * de rest nem chat; usada pelo botão de recarga da sheet e pelo macro "Recharge
   * Traits". Funciona para todos os tipos de Actor (todo tipo guarda Traits como
   * Items embutidos).
   * @returns {Promise<number>} o número de Traits restaurados
   */
  async rechargeAllTraits() {
    const updates = this.traits
      .filter(t => t.system.exhausted || t.system.currentDie !== t.system.maxDie)
      .map(t => ({ _id: t.id, "system.currentDie": t.system.maxDie, "system.exhausted": false }));
    if (updates.length) await this.updateEmbeddedDocuments("Item", updates);
    return updates.length;
  }

  /* ---------------------------------------------------------------- */
  /* Travel (subsistema opcional; só Party)                            */
  /* ---------------------------------------------------------------- */

  /** O travelMode efetivo de uma jornada: o override da própria jornada, senão o
   *  do mundo. */
  get travelMode() {
    if (this.type !== "party") return null;
    return this.system.journey?.mode || game.settings.get("shift-vtt", "travelMode");
  }

  /**
   * Inicia uma jornada nesta Party. Legs é uma contagem abstrata escolhida pelo
   * GM (sem milhas/tempo). O destino é opcional: uma Location (inclusive uma filha
   * aninhada) ou só um rótulo de texto.
   */
  async startJourney({ destName = "", destUuid = "", flavor = "", legsTotal = 3, mode = "", onFoot = true } = {}) {
    if (this.type !== "party") return;
    await this.update({ "system.journey": {
      active: true, destName, destUuid, flavor,
      legsTotal: Math.max(1, Math.floor(Number(legsTotal)) || 1),
      legsDone: 0, mode, onFoot: !!onFoot, spent: []
    } });
  }

  /** Cancela a jornada ativa. Com `refund`, devolve (shiftUp) cada recurso gasto na
   *  jornada — exato, porque shiftDown/shiftUp são simétricos passo a passo. */
  async abortJourney({ refund = false } = {}) {
    if (this.type !== "party") return;
    if (refund) await this.#refundJourney();
    await this.update({ "system.journey.active": false, "system.journey.legsDone": 0, "system.journey.spent": [] });
  }

  /** Reverte os shift downs registrados em system.journey.spent (lista de uuids de
   *  Trait, uma entrada por passo gasto). Agrega por Trait e dá shiftUp pelo total. */
  async #refundJourney() {
    const spent = this.system.journey?.spent ?? [];
    if (!spent.length) return;
    const steps = {};
    for (const u of spent) steps[u] = (steps[u] ?? 0) + 1;
    for (const [uuid, n] of Object.entries(steps)) {
      const trait = await fromUuid(uuid);
      if (trait?.shiftUp) await trait.shiftUp({ steps: n });
    }
  }

  /**
   * Avança um Leg: gasta o recurso por Leg e incrementa a contagem.
   * - simple: não gasta nada (puro narrativo).
   * - standard/challenging: a pé, cada character baixa o próprio Pack; de veículo,
   *   o Cargo do Vehicle ativo baixa um (cobre o grupo) e, se Exausto, cada
   *   character cai no próprio Pack. Pack/Cargo Exausto (ou ausente) → baixa um
   *   Core do personagem (a mordida das regras).
   * @param {object} [opts]
   * @param {number} [opts.extra=1] Recursos a gastar neste Leg (2 numa Failure de Challenging Travel).
   */
  async advanceJourneyLeg({ extra = 1 } = {}) {
    if (this.type !== "party") return null;
    const j = this.system.journey;
    if (!j?.active) return null;

    const mode = this.travelMode;
    const lines = [];
    const spent = [];   // uuids de Trait gastos neste Leg (1 entrada = 1 passo), para refund
    if (mode !== "simple") {
      const times = Math.max(1, Math.floor(Number(extra)) || 1);
      const chars = this.partyMembers.filter(m => m.type === "character");

      if (!j.onFoot && this.system.vehicle) {
        const v = await fromUuid(this.system.vehicle);
        const cargo = v?.getTraits?.("cargo")?.[0] ?? null;
        for (let n = 0; n < times; n++) {
          if (cargo && !cargo.system.exhausted) {
            const r = await cargo.shiftDown({ force: true, transform: false });
            lines.push(game.i18n.format("SHIFT.Travel.SpentCargo", {
              vehicle: v?.name ?? "", die: this.#travelDie(r) }));
            spent.push(cargo.uuid);
          } else {
            // Cargo Exausto: cada character cobre o Leg com o próprio Pack/Core.
            for (const m of chars) { const s = await this.#spendTravelChar(m); lines.push(s.line); if (s.uuid) spent.push(s.uuid); }
          }
        }
      } else {
        for (const m of chars) {
          for (let n = 0; n < times; n++) { const s = await this.#spendTravelChar(m); lines.push(s.line); if (s.uuid) spent.push(s.uuid); }
        }
      }
    }

    const total = Math.max(1, j.legsTotal ?? 1);
    const done = Math.min(total, (j.legsDone ?? 0) + 1);
    await this.update({ "system.journey.legsDone": done, "system.journey.spent": [...(j.spent ?? []), ...spent] });
    await this.#postTravelCard({ kind: "leg", done, total, mode, lines: lines.filter(Boolean) });
    return { done, total, complete: done >= total };
  }

  /**
   * Encerra a jornada (chegada). Se havia um destino vinculado, passa a Location
   * atual da Party para ele — daí o Safe Rest na ficha já lê o system.safe do
   * lugar, como sempre.
   */
  async arriveJourney({ simple = false } = {}) {
    if (this.type !== "party") return;
    const j = this.system.journey;
    if (!j?.active) return;
    const updates = { "system.journey.active": false };
    let dest = j.destName;
    if (j.destUuid) {
      // Destino é uma Location (possivelmente aninhada): a party passa a ESTAR nela;
      // o Safe Rest lê o system.safe da própria Location (não há mais landmark Item).
      updates["system.location"] = j.destUuid;
      if (!dest) dest = (await fromUuid(j.destUuid))?.name ?? "";
    }
    await this.update(updates);
    await this.#postTravelCard({ kind: "arrive", dest: dest || game.i18n.localize("SHIFT.Travel.Unknown"), simple });
  }

  /** Gasta o recurso de viagem de um character: o próprio Pack, ou — se Exausto/
   *  ausente — um Core (escolhido pelo player ou sorteado). Devolve {uuid, line}:
   *  o Trait gasto (para o log de refund) e a linha de resumo do card. */
  async #spendTravelChar(m) {
    const pack = m.getTraits("pack")[0] ?? null;
    if (pack && !pack.system.exhausted) {
      const r = await pack.shiftDown({ force: true, transform: false });
      return { uuid: pack.uuid, line: game.i18n.format("SHIFT.Travel.SpentPack", { name: m.name, die: this.#travelDie(r) }) };
    }
    const cores = m.getTraits("core").filter(t => !t.system.exhausted);
    if (!cores.length) return { uuid: null, line: game.i18n.format("SHIFT.Travel.NothingToSpend", { name: m.name }) };
    const core = await this.#pickFallbackCore(m, cores);
    // Atrito de viagem não dispara o prompt de morte de Core nem Transform-on-Exhaust:
    // é gasto de suprimento (e o refund do abort precisa de um shift down reversível).
    const r = await core.shiftDown({ force: true, promptDeath: false, transform: false });
    return { uuid: core.uuid, line: game.i18n.format("SHIFT.Travel.SpentCore", { name: m.name, trait: core.name, die: this.#travelDie(r) }) };
  }

  /** Escolhe o Core a baixar quando o recurso esgota. Pelas regras CRUAS, o player
   *  escolhe; o setting travelRandomCore troca para sorteio. Um único Core não
   *  pergunta; um prompt cancelado cai no de melhor dado. */
  async #pickFallbackCore(m, cores) {
    if (cores.length === 1) return cores[0];
    if (game.settings.get("shift-vtt", "travelRandomCore")) {
      return cores[Math.floor(Math.random() * cores.length)];
    }
    const id = await promptTraitChoice({
      title: game.i18n.localize("SHIFT.Travel.CoreChoiceTitle"),
      hint: game.i18n.format("SHIFT.Travel.CoreChoiceHint", { name: m.name }),
      options: cores.map(c => ({
        value: c.uuid, name: c.name,
        img: CONFIG.SHIFT.diceImages[c.statusKey],
        sub: dieLabel(c.system.currentDie)
      }))
    });
    return cores.find(c => c.uuid === id)
      ?? [...cores].sort((a, b) => dieIndex(a.system.currentDie) - dieIndex(b.system.currentDie))[0];
  }

  /** Rótulo do dado após um shiftDown (Exhausted quando caiu fora da escada). */
  #travelDie(r) {
    return r?.becameExhausted ? game.i18n.localize("SHIFT.DiceStatus.exhausted") : dieLabel(r?.to);
  }

  /** Posta o card informativo de um Leg avançado ou da chegada. */
  async #postTravelCard({ kind, done = 0, total = 0, mode = "", lines = [], dest = "", simple = false } = {}) {
    const esc = foundry.utils.escapeHTML;
    const flavorText = this.system.journey?.flavor;
    const flavor = flavorText ? `<p class="travel-flavor"><em>${esc(flavorText)}</em></p>` : "";
    let body;
    if (kind === "arrive") {
      const narr = simple ? `<p>${game.i18n.localize("SHIFT.Travel.CardSimple")}</p>` : "";
      body = `<h3><i class="fa-solid fa-flag-checkered"></i> ${game.i18n.localize("SHIFT.Travel.Title")}</h3>${flavor}${narr}
        <p>${game.i18n.format("SHIFT.Travel.CardArrive", { party: esc(this.name), dest: esc(dest) })}</p>`;
    } else {
      const prog = game.i18n.format("SHIFT.Travel.LegProgress", { done, total });
      const narr = mode === "simple" ? `<p>${game.i18n.localize("SHIFT.Travel.CardSimple")}</p>` : "";
      const list = lines.length
        ? `<ul class="travel-spent">${lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul>` : "";
      body = `<h3><i class="fa-solid fa-route"></i> ${game.i18n.localize("SHIFT.Travel.Title")} &middot; ${prog}</h3>${flavor}${narr}${list}`;
    }
    await ChatMessage.create({
      speaker: shiftSpeaker(this),
      content: `<div class="shift-vtt chat-card info-card travel ${kind}">${body}</div>`
    });
  }
}
