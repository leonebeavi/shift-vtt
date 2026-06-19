/**
 * SHIFT VTT, motor de Action Roll.
 *
 * Resultados canônicos:
 *  - Um dado tem sucesso em 1, 2 ou 3.
 *  - Critical Success: qualquer dado mostra 1 (variantes configuráveis).
 *  - Success: ao menos um sucesso e nenhum dado mostra seu valor mais alto.
 *  - Mitigated Success: um sucesso, mas outro dado mostra seu valor mais alto.
 *  - Failure: nenhum sucesso e nenhum dado mostra seu valor mais alto.
 *  - Critical Failure: nenhum sucesso e um ou mais dados mostram seu valor mais alto.
 *  - Qualquer dado que mostre seu valor mais alto sofre ShiftDown, independente do resultado.
 *  - Risky: qualquer dado que NÃO mostre um sucesso sofre ShiftDown.
 *  - Inspired: qualquer resultado de sucesso conta como Critical Success.
 *  - Working Together: dois Players contribuem cada um com um Trait (sem Core
 *    obrigatório); a regra de Critical Success segue a configuração escolhida,
 *    exatamente como num Action Roll normal.
 *  - Locations rolando como Adversaries improvisados: crits contam como
 *    sucessos/falhas comuns e os dados da Location nunca sofrem ShiftDown.
 */
import { dieLabel, fvtt, shiftSpeaker } from "../helpers/utils.mjs";
import { pickTrait, matchScaledUp } from "../chat/chat.mjs";
import { resolveOutcome, rollScaleOf, computeShift } from "./resolution.mjs";
import { scaleEnabled } from "../settings.mjs";

export class ShiftRoll {

  /* ---------------------------------------------------------------- */
  /* Dialog                                                            */
  /* ---------------------------------------------------------------- */

  /**
   * Abre o dialog de Action Roll para um Actor e então rola.
   * @param {Actor} actor
   * @param {object} [opts]
   * @param {string} [opts.preselect] Id ou uuid do Item a pré-selecionar.
   * @param {boolean} [opts.turnOrder=false] Roll de turn order do Encounter (dado único).
   * @param {string[]} [opts.allowedTraits] Restringe o conjunto a estes uuids de Trait
   *   (a gama "permitida" de um roll pedido pelo GM); vazio/null = todo Trait rolável.
   * @param {string} [opts.rollType] Força o roll type (pedido pelo GM); o Player
   *   não pode mudar. null = o Player escolhe normalmente.
   */
  static async promptActionRoll(actor, { preselect = null, turnOrder = false, allowedTraits = null, rollType = null } = {}) {
    if (!actor) return null;
    let rollable = actor.traits?.filter(t => t.canRoll) ?? [];
    // Um roll pedido pelo GM pode restringir quais Traits são válidos para rolar.
    const allow = Array.isArray(allowedTraits) && allowedTraits.length ? new Set(allowedTraits) : null;
    if (allow) rollable = rollable.filter(t => allow.has(t.uuid));

    const isCharacter = actor.type === "character";
    const cores = rollable.filter(t => ["core", "attitude"].includes(t.system.category));

    // Traits de Vehicle tripulado ("contidos em"): um Character que tripula também
    // pode rolar os Traits do Vehicle. Eles formam sua própria coluna.
    const vehicleTraits = [];
    if (isCharacter) {
      for (const v of (actor.crewedVehicles ?? [])) {
        for (const t of v.items.filter(i => i.type === "trait" && i.canRoll && (!allow || allow.has(i.uuid)))) vehicleTraits.push(t);
      }
    }

    // Nada sobrou para rolar (ex.: uma allow-list do GM que não casou com nenhum Trait atual).
    if (!rollable.length && !vehicleTraits.length) {
      ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NoRollableTraits"));
      return null;
    }

    const opt = t => ({
      uuid: t.uuid,
      name: t.actor === actor ? t.name : `${t.actor?.name}: ${t.name}`,
      die: t.system.currentDie,
      dieLabel: dieLabel(t.system.currentDie),
      img: CONFIG.SHIFT.diceImages[t.system.currentDie],
      // Mostra um override de Scale (ou Scale herdada do Vehicle) já no seletor,
      // mesmo em Scale 1, para que a Scale do roll nunca seja uma surpresa (Req 4).
      scale: t.effectiveScale,
      isScaled: scaleEnabled() && t.scaleIsOverride,
      selected: preselect != null && (t.id === preselect || t.uuid === preselect)
    });

    // Turn order é um único dado de Core (radio, só para Characters).
    if (turnOrder) {
      const primaryOptions = cores.map(opt);
      if (!primaryOptions.some(o => o.selected) && primaryOptions[0]) primaryOptions[0].selected = true;
      return this.#runDialog(actor, {
        turnOrder: true,
        primaryLabel: game.i18n.localize("SHIFT.Roll.PrimaryTrait"),
        primaryOptions
      });
    }

    // Todos os demais: um conjunto agrupado por categoria em colunas, escolha até 2.
    const GROUP_FOR = c =>
      c === "attitude" ? "attitude"
      : c === "core" ? "core"
      : (c === "focus" || c === "adversary") ? "focus"
      : (c === "pack" || c === "cargo") ? "pack"
      : "other";
    const GROUP_LABEL = {
      attitude: "SHIFT.Groups.Attitude",
      core: "SHIFT.Groups.Core",
      focus: "SHIFT.Groups.Focus",
      pack: "SHIFT.Groups.Pack",
      other: "SHIFT.Groups.Other",
      vehicle: "SHIFT.Groups.Vehicle"
    };
    const GROUP_ORDER = ["attitude", "core", "focus", "pack", "other", "vehicle"];

    const buckets = new Map();
    const push = (key, o) => {
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(o);
    };
    for (const t of rollable) push(GROUP_FOR(t.system.category), opt(t));
    for (const t of vehicleTraits) push("vehicle", opt(t));

    const flat = [...buckets.values()].flat();
    if (!flat.some(o => o.selected) && flat[0]) flat[0].selected = true;

    const multiGroups = GROUP_ORDER
      .filter(k => buckets.has(k))
      .map(k => ({ key: k, label: game.i18n.localize(GROUP_LABEL[k]), options: buckets.get(k) }));

    const ctx = {
      turnOrder: false,
      multiMode: true,
      multiGroups,
      forcedRollType: rollType || null,
      forcedRollTypeLabel: rollType ? game.i18n.localize(CONFIG.SHIFT.rollTypes[rollType] ?? "") : "",
      rollTypes: Object.entries(CONFIG.SHIFT.rollTypes).map(([k, v]) => ({
        key: k, label: game.i18n.localize(v)
      }))
    };
    return this.#runDialog(actor, ctx);
  }

  /** Renderiza o dialog de Action Roll e resolve o(s) Trait(s) escolhido(s). */
  static async #runDialog(actor, ctx) {
    const turnOrder = !!ctx.turnOrder;
    const multiMode = !!ctx.multiMode;

    const content = await fvtt.renderTemplate("systems/shift-vtt/templates/apps/action-roll-dialog.hbs", ctx);

    let result = null;
    try {
      result = await fvtt.DialogV2.wait({
        window: {
          title: turnOrder
            ? game.i18n.localize("SHIFT.Combat.TurnOrderRoll")
            : game.i18n.format("SHIFT.Roll.DialogTitle", { actor: actor.name })
        },
        position: { width: 480 },
        classes: ["shift-vtt", "shift-dialog", "action-roll-window"],
        content,
        rejectClose: false,
        render: (event, dialog) => {
          if (!multiMode) return;
          // Faz valer o "escolha até dois": depois de dois marcados, trava o resto.
          const root = dialog?.element ?? dialog;
          const boxes = Array.from(root?.querySelectorAll?.("input[name='traits']") ?? []);
          const update = () => {
            const count = boxes.filter(b => b.checked).length;
            for (const b of boxes) {
              b.disabled = !b.checked && count >= 2;
              b.closest(".trait-opt")?.classList.toggle("maxed", b.disabled);
            }
          };
          for (const b of boxes) b.addEventListener("change", update);
          update();
        },
        buttons: [
          {
            action: "roll",
            label: game.i18n.localize("SHIFT.Roll.RollButton"),
            icon: "fa-solid fa-dice",
            default: true,
            callback: (event, button) => {
              const form = button.form;
              if (multiMode) {
                const picked = Array.from(form.querySelectorAll("input[name='traits']:checked"))
                  .map(i => i.value)
                  .slice(0, 2);
                return { traits: picked, rollType: ctx.forcedRollType || form.elements.rollType?.value || "normal" };
              }
              return {
                primary: form.elements.primary?.value || null,
                secondary: form.elements.secondary?.value || null,
                rollType: ctx.forcedRollType || form.elements.rollType?.value || "normal"
              };
            }
          },
          { action: "cancel", label: game.i18n.localize("SHIFT.Common.Cancel"), icon: "fa-solid fa-xmark" }
        ]
      });
    } catch (err) { result = null; }

    if (!result || result === "cancel") return null;

    const resolve = async ref => {
      if (!ref) return null;
      const own = actor.items.get(ref);
      if (own) return own;
      try { return await fromUuid(ref); } catch (err) { return null; }
    };

    if (multiMode) {
      const traits = [];
      for (const ref of result.traits ?? []) {
        const t = await resolve(ref);
        if (t && !traits.includes(t)) traits.push(t);
      }
      if (!traits.length) return null;
      return this.actionRoll({ actor, traits: traits.slice(0, 2), rollType: result.rollType, turnOrder });
    }

    if (!result.primary) return null;
    const primary = await resolve(result.primary);
    if (!primary) return null;

    const traits = [primary];
    if (!turnOrder && result.secondary && result.secondary !== result.primary) {
      const second = await resolve(result.secondary);
      if (second && second !== primary) traits.push(second);
    }
    return this.actionRoll({ actor, traits, rollType: result.rollType, turnOrder });
  }

  /* ---------------------------------------------------------------- */
  /* Working Together                                                  */
  /* ---------------------------------------------------------------- */

  /** Ponto de entrada do Working Together: o iniciador escolhe exatamente um Trait
   *  (Core ou Focus, sem restrição) e publica o convite de adesão. */
  static async promptGroupStart(actor) {
    if (!actor) return null;
    const trait = await pickTrait(actor, {
      title: game.i18n.format("SHIFT.Group.PickTrait", { actor: actor.name }),
      hint: game.i18n.localize("SHIFT.Group.Hint"),
      filter: t => t.canRoll
    });
    if (!trait) return null;
    return this.postGroupInvite({ actor, trait, rollType: "normal" });
  }

  /** Publica o card de convite de adesão para uma ação em grupo. */
  static async postGroupInvite({ actor, trait, rollType = "normal" } = {}) {
    const content = `
      <div class="shift-vtt chat-card info-card combat group-invite">
        <h3><i class="fa-solid fa-people-arrows"></i> ${game.i18n.localize("SHIFT.Group.Title")}</h3>
        <p>${game.i18n.format("SHIFT.Group.Invite", {
          actor: foundry.utils.escapeHTML(actor.name),
          trait: foundry.utils.escapeHTML(trait.name),
          die: dieLabel(trait.system.currentDie)
        })}</p>
        <div class="action-row">
          <button type="button" class="card-action" data-shift-join>
            <i class="fa-solid fa-handshake"></i> ${game.i18n.localize("SHIFT.Group.Join")}
          </button>
        </div>
      </div>`;
    return ChatMessage.create({
      speaker: shiftSpeaker(actor),
      content,
      flags: {
        "shift-vtt": {
          kind: "groupInvite",
          actorUuid: actor.uuid,
          traitUuid: trait.uuid,
          rollType
        }
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Action Roll                                                       */
  /* ---------------------------------------------------------------- */

  /**
   * Executa um Action Roll.
   * @param {object} opts
   * @param {Actor}  opts.actor Actor líder (speaker, targets, gasto de ação).
   * @param {Item[]} opts.traits 1 a 2 itens de Trait (próprio, de aliado ou de Vehicle).
   * @param {"normal"|"risky"|"inspired"} [opts.rollType]
   * @param {boolean} [opts.turnOrder=false]
   * @param {boolean} [opts.groupRoll=false] Flag de Working Together; controla apenas
   *   a tag "group" do card; a regra de Critical continua seguindo a configuração.
   */
  static async actionRoll({ actor, traits = [], rollType = "normal", turnOrder = false, groupRoll = false } = {}) {
    // Traits E Quests podem ser rolados (ambos carregam um Shift Die / clock); uma
    // Quest já resolvida (success/failure) não rola mais.
    traits = traits.filter(t => t?.hasClock && !t.isResolved);
    if (!actor || !traits.length) return null;

    for (const t of traits) {
      if (t.system.exhausted) {
        ui.notifications.warn(game.i18n.format("SHIFT.Warnings.TraitExhaustedNamed", { trait: t.name }));
        return null;
      }
      if (!t.system.rollable) {
        ui.notifications.warn(game.i18n.format("SHIFT.Warnings.TraitNotRollable", { trait: t.name }));
        return null;
      }
    }

    const isLocation = actor.type === "location";
    const targets = Array.from(game.user.targets ?? [])
      .map(t => t.actor)
      .filter(a => a && a.uuid !== actor.uuid);

    // O Action Roll inteiro assume a Scale de seu Trait de maior Scale
    // (pelas regras). A Scale efetiva de um Trait segue seu dono, a menos
    // que o Trait defina a sua própria. A interação de Scale propriamente
    // dita é resolvida por *Trait alvo* no momento de aplicar (ver
    // applyShiftDownToTarget), porque um alvo pode ter um único aspecto em
    // Scale mais alta que o resto dele.
    const rollerScale = rollScaleOf(traits.map(t => t.effectiveScale));

    // Um único Roll combinado mantém o Dice So Nice feliz.
    const formula = traits.map(t => `1${t.system.currentDie}`).join(" + ");
    const roll = new Roll(formula);
    await roll.evaluate();

    const entries = roll.dice.map((die, i) => {
      const item = traits[i];
      const value = die.results[0].result;
      return {
        item,
        name: item.actor === actor ? item.name : `${item.actor?.name}: ${item.name}`,
        die: item.system.currentDie,
        dieLabel: dieLabel(item.system.currentDie),
        value,
        faces: die.faces,
        isOne: value === 1,
        isSuccess: value <= CONFIG.SHIFT.successMax,
        isMax: value === die.faces
      };
    });

    // A regra de Critical Success sempre segue a configuração escolhida, no
    // Working Together também, exatamente como num Action Roll normal. (groupRoll
    // só marca o card; não força mais a regra de todos-1s.)
    const critRule = game.settings.get("shift-vtt", "critRule");
    const outcome = this.determineOutcome(entries, rollType, critRule);

    // Locations rolando como Adversaries improvisados: rebaixa crits, sem shifts.
    if (isLocation) {
      if (outcome.type === "criticalSuccess") outcome.type = "success";
      if (outcome.type === "criticalFailure") outcome.type = "failure";
      outcome.critCount = 0;
      for (const e of entries) e.willShift = false;
    }

    // ----- Planeja os ShiftDowns (efetivados depois que os dados assentam) -----------
    // O conjunto de shifts é fixado pelo resultado puro, mas as mudanças de dado do
    // Trait são adiadas até a animação do Dice So Nice terminar (abaixo), para que as
    // imagens de dado na ficha nunca revelem o resultado antes dos dados 3D pousarem. O
    // card mostra o resultado previsto (um shift forçado é determinístico); ele é então
    // efetivado tal e qual. predictShift e o commit de shiftDown agora derivam o passo
    // do dado do mesmo computeShift(), então não podem divergir na escalada; a única
    // suposição que resta é que o Trait de um dado contribuinte não está nem já
    // Exhausted nem bloqueado, o que o fluxo de roll garante (ele se recusa a rolar
    // Traits Exhausted).
    const predictShift = die => {
      const { die: next, exhausted } = computeShift(die);
      return exhausted ? { to: null, exhausted: true } : { to: dieLabel(next), exhausted: false };
    };
    const shifts = [];
    const shiftCommit = [];
    for (const entry of entries) {
      if (!entry.willShift) continue;
      const canWrite = entry.item.isOwned && entry.item.actor.canUserModify(game.user, "update");
      if (entry.item.system.autoShiftOnRoll && canWrite) {
        const { to, exhausted } = predictShift(entry.die);
        shifts.push({ name: entry.name, from: dieLabel(entry.die), to, exhausted, applied: true });
        entry.shiftApplied = true;
        entry.becameExhausted = exhausted;
        shiftCommit.push(entry.item);
      } else {
        shifts.push({ name: entry.name, from: dieLabel(entry.die), to: null, exhausted: false, applied: false });
        entry.shiftPending = true;
      }
    }

    // ----- Planeja XP: +1 por shift forçado, concedido ao próprio character de cada dado -
    let xp = { granted: 0, capped: false };
    const xpCommit = [];
    if (game.settings.get("shift-vtt", "autoXp")) {
      const cap = game.settings.get("shift-vtt", "xpPerSessionLimit") ?? 5;
      const byOwner = new Map();
      for (const entry of entries) {
        if (!entry.willShift) continue;
        const owner = entry.item.actor;
        if (owner?.type !== "character") continue;
        byOwner.set(owner, (byOwner.get(owner) ?? 0) + 1);
      }
      for (const [owner, count] of byOwner) {
        if (!owner.canUserModify(game.user, "update")) continue;
        // Prévia da concessão limitada para o card; owner.addXP recalcula no commit.
        const granted = Math.min(count, Math.max(0, cap - (owner.system.xp.session ?? 0)));
        if (owner === actor) xp = { granted, capped: granted < count };
        else if (granted > 0) xp.allies = (xp.allies ?? 0) + granted;
        xpCommit.push({ owner, count });
      }
    }

    // ----- Fase de turn order --------------------------------------------------
    const succeeded = ["criticalSuccess", "success", "mitigatedSuccess"].includes(outcome.type);
    const phase = turnOrder ? (succeeded ? CONFIG.SHIFT.phases.first : CONFIG.SHIFT.phases.second) : null;

    // ----- Chat card ----------------------------------------------------------
    const meta = CONFIG.SHIFT.rollResults[outcome.type];
    const critRollOk = outcome.type === "criticalSuccess";
    // Botões de bônus de crit nunca aparecem num card de turn-order (sem interação com alvo).
    // O botão base "Apply to Target" aparece em TODO sucesso, incluindo crit; os
    // bônus de Critical Success são *somados* ao ataque normal, não uma
    // substituição dele, então o Player precisa tanto do shift base quanto do bônus.
    // Botões de bônus de Critical Success sempre aparecem num crit (nunca em cards
    // de turn-order, que não têm interação com alvo). Eles não podem ser desabilitados.
    const showCrit = critRollOk && !turnOrder;
    const showApply = succeeded && !turnOrder;

    // Technique Scaled Up: oferece o botão "Scale Up" quando o Focus Trait vinculado
    // foi de fato rolado, uma Technique vinculada disponível é possuída e um Core
    // Trait pode pagar o custo (um ShiftDown); as condições definidas pelo usuário.
    const rolledUuids = entries.map(e => e.item.uuid);
    const scaledUpMatch = (!turnOrder && !isLocation && scaleEnabled()
      && game.settings.get("shift-vtt", "enableScaledUp"))
      ? matchScaledUp(actor, rolledUuids) : null;
    const canPayScaledUp = actor.traits.some(t => t.system.category === "core" && t.canShiftDown);
    const showScaleUp = !!scaledUpMatch && canPayScaledUp;

    // Quando mais de um character contribui (Working Together, assistência de
    // aliado, um Trait de Vehicle tripulado), mostra o nome de cada dono ACIMA do
    // seu card de dado para que o rótulo longo "Dono: Trait" nunca seja truncado
    // dentro do card.
    const multiOwner = new Set(entries.map(e => e.item.actor).filter(Boolean)).size > 1;

    // Alvos pré-selecionados são registrados para que o card possa nomeá-los e o
    // botão Apply já fique mirado neles (o roll NÃO é aplicado automaticamente; é
    // uma escolha pelas regras).
    const targetUuids = targets.map(a => a.uuid);
    const anyOverride = entries.some(e => e.item.scaleIsOverride);

    const cardData = {
      actor: { name: actor.name, img: actor.img, uuid: actor.uuid },
      rollType,
      rollTypeLabel: game.i18n.localize(CONFIG.SHIFT.rollTypes[rollType]),
      isSpecialType: rollType !== "normal",
      turnOrder,
      groupRoll,
      scale: rollerScale,
      // A tag do roll inteiro aparece sempre que a Scale resolvida não for o padrão
      // OU qualquer Trait contribuinte carregar um override (assim, um override de
      // Scale 1 num Actor de Scale 2 ainda marca o card). Cards de turn-order nunca a mostram.
      showScaleTag: scaleEnabled() && !turnOrder && (rollerScale !== 1 || anyOverride),
      entries: entries.map(e => ({
        name: e.name,
        traitName: e.item.name,
        owner: e.item.actor?.name ?? "",
        showOwner: !!e.item.actor && (multiOwner || e.item.actor !== actor),
        dieLabel: e.dieLabel,
        die: e.die,
        value: e.value,
        isOne: e.isOne,
        isSuccess: e.isSuccess,
        isMax: e.isMax,
        willShift: e.willShift,
        shiftApplied: e.shiftApplied,
        shiftPending: e.shiftPending,
        becameExhausted: e.becameExhausted,
        scale: e.item.effectiveScale,
        isScaled: scaleEnabled() && e.item.scaleIsOverride
      })),
      outcome: {
        type: outcome.type,
        css: meta.css,
        icon: meta.icon,
        label: game.i18n.localize(meta.label)
      },
      shifts,
      xp,
      crit: { show: showCrit, count: outcome.critCount },
      apply: { show: showApply, targetUuids: targetUuids.join(",") },
      scaleUp: { show: showScaleUp },
      phase: phase !== null ? {
        value: phase,
        label: game.i18n.localize(CONFIG.SHIFT.phaseLabels[phase])
      } : null
    };

    const content = await fvtt.renderTemplate("systems/shift-vtt/templates/chat/roll-card.hbs", cardData);
    const rollMode = game.settings.get("core", "rollMode");

    let message = null;
    try {
      message = await ChatMessage.create({
        speaker: shiftSpeaker(actor),
        content,
        rolls: [roll],
        sound: CONFIG.sounds.dice,
        flags: {
          "shift-vtt": {
            kind: "actionRoll",
            actorUuid: actor.uuid,
            outcome: outcome.type,
            critCount: outcome.critCount,
            rollerScale,
            turnOrder,
            // Manifesto de Traits rolados: permite que mudanças de Scale pós-roll
            // (gasto de XP, Scaled Up) recalculem a Scale do roll sem rolar de novo, e
            // permite que o botão "Apply to Target" mire de novo no(s) alvo(s) pré-selecionado(s).
            traits: entries.map(e => ({
              uuid: e.item.uuid,
              id: e.item.id,
              actorUuid: e.item.actor?.uuid ?? null,
              name: e.item.name,
              scale: e.item.effectiveScale,
              category: e.item.system.category ?? null   // Quests não têm category
            })),
            scaleBumps: 0,
            targetUuids
          }
        }
      }, { rollMode });
    } catch (err) { console.warn("shift-vtt | Roll card failed", err); }

    // Segura toda revelação de resultado até os dados 3D do Dice So Nice terminarem:
    // o DSN esconde o próprio card até lá, e adiamos para cá as mudanças de dado do
    // Trait (imagens da ficha), o ganho de XP e o shift no alvo. waitFor3DAnimationByMessageID
    // resolve de imediato quando o DSN está ausente, desabilitado ou configurado para
    // exibir na hora, então o jogo sem dados 3D não é afetado.
    if (game.dice3d && message?.id) {
      try { await game.dice3d.waitFor3DAnimationByMessageID(message.id); } catch (err) { /* noop */ }
    }

    // ----- Efetiva as mutações adiadas (as fichas atualizam agora) -------------
    for (const item of shiftCommit) {
      try { await item.shiftDown({ force: true }); } catch (err) { /* noop */ }
    }
    for (const { owner, count } of xpCommit) {
      try { await owner.addXP(count, { limited: true }); } catch (err) { /* noop */ }
    }

    // ----- Gasta uma ação no Encounter ativo --------------------------
    if (!turnOrder && game.combat?.started) {
      const combatant = game.combat.combatants.find(c => c.actor === actor);
      if (combatant) {
        const left = combatant.actionsLeft;
        if (left > 0) {
          try { await combatant.setFlag("shift-vtt", "actionsLeft", left - 1); } catch (err) { /* noop */ }
        }
      }
    }

    // Sem aplicação automática silenciosa: um Success contra um alvo é resolvido pelo
    // botão explícito "Apply to Target" no card (que faz valer a interação de Scale
    // pelas regras por Trait escolhido e não pode aplicar shift em dobro). Quando o
    // roll tinha alvo(s) pré-selecionado(s), o card os nomeia e já mira o botão.
    return { roll, entries, outcome, shifts, phase };
  }

  /* ---------------------------------------------------------------- */
  /* Matriz de resultados                                              */
  /* ---------------------------------------------------------------- */

  static determineOutcome(entries, rollType = "normal", critRule = "standard") {
    return resolveOutcome(entries, { rollType, critRule });
  }
}
