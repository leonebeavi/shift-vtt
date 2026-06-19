/**
 * SHIFT VTT, documento de Actor.
 */
import { DIE_PROGRESSION, dieIndex, dieLabel, fvtt, promptChoice, promptText, promptTraitChoice, shiftSpeaker } from "../helpers/utils.mjs";

export class ShiftActor extends Actor {

  /* ---------------------------------------------------------------- */
  /* Padrões de criação                                                */
  /* ---------------------------------------------------------------- */

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

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
    // Traits iniciais são criados como source bruto, então o feature map do
    // _preCreate do Item nunca roda; definimos as features explicitamente aqui.
    // Padrões pelas regras: Core = só Drawbacks; Attitude = só Keywords.
    const core = (name, die) => trait(name, {
      category: "core", maxDie: die, currentDie: die, locked: true,
      features: { usesKeywords: false, usesDrawbacks: true }
    });
    const attitude = (name, die, extra = {}) => trait(name, {
      category: "attitude", maxDie: die, currentDie: die, locked: true,
      features: { usesKeywords: true, usesDrawbacks: false }, ...extra
    });
    const items = [];

    const packLike = (name, category) => trait(name, {
      category, maxDie: "d6", currentDie: "d6", locked: true,
      features: { usesKeywords: false, usesDrawbacks: false }
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
          { ...core(i18n("SHIFT.Trait.Wealth"), "d8"), system: { category: "core", maxDie: "d8", currentDie: "d8", locked: true, autoShiftOnRoll: false, features: { usesKeywords: false, usesDrawbacks: true } } },
          { ...core(i18n("SHIFT.Trait.Security"), "d8"), system: { category: "core", maxDie: "d8", currentDie: "d8", locked: true, autoShiftOnRoll: false, features: { usesKeywords: false, usesDrawbacks: true } } }
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
   * Safe Rest: todo dado de Core, Focus e Pack Trait dá ShiftUp de volta ao seu
   * Max Die e Techniques recuperam todos os usos. Focus Traits temporários
   * expiram. O modo challenging limita a restauração ao dado de Wealth da Location
   * (o Pack Trait sempre retorna ao seu máximo D6).
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
      const maxIdx = dieIndex(t.system.maxDie);
      const isPackLike = ["pack", "cargo"].includes(t.system.category);
      let targetIdx = maxIdx;
      if (wealthCapIdx >= 0 && !isPackLike) targetIdx = Math.max(maxIdx, wealthCapIdx);
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

    await ChatMessage.create({
      speaker: shiftSpeaker(this),
      content: `<div class="shift-vtt chat-card info-card rest safe">
        <h3><i class="fa-solid fa-campground"></i> ${game.i18n.localize("SHIFT.Rest.Safe")}</h3>
        <p>${game.i18n.format("SHIFT.Rest.SafeChat", { actor: foundry.utils.escapeHTML(this.name) })}</p>
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
          name: t.actor === this ? t.name : `${t.actor?.name ?? ""}: ${t.name}`,
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
      const updates = this.traits
        .filter(t => !["pack", "cargo"].includes(t.system.category))
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
    if (this.type === "character") await this.update({ "system.xp.session": 0 });
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
}
