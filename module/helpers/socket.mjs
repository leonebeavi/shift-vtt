/**
 * SHIFT VTT, retransmissão via socket.
 * Players emitem requisições; o cliente do GM ativo as aplica.
 */
import { shiftSpeaker, dieLabel } from "./utils.mjs";

const CHANNEL = "system.shift-vtt";

function isActiveGM() {
  const gm = game.users.activeGM;
  return !!gm && gm.id === game.user.id;
}

async function handle(data) {
  // GM → um Player específico: abre um prompt de Action Roll só no cliente daquele usuário
  // (restrito aos Traits permitidos, com o tipo de rolagem que o GM escolheu).
  if (data?.action === "requestRoll") {
    if (game.user.id !== data.userId) return;
    const actor = data.actorUuid ? await fromUuid(data.actorUuid) : null;
    if (!actor) return;
    return game.shift?.ShiftRoll?.promptActionRoll(actor, {
      allowedTraits: data.allowedTraits ?? null,
      rollType: data.rollType ?? null
    });
  }

  // Tudo abaixo é Player → GM ativo (só o GM ativo aplica).
  if (!isActiveGM()) return;
  switch (data?.action) {
    case "spotlight": {
      const combat = game.combats.get(data.combatId);
      if (!combat) return;
      const index = combat.turns.findIndex(t => t.id === data.combatantId);
      if (index >= 0) await combat.update({ turn: index });
      break;
    }
    case "clocks": {
      await game.settings.set("shift-vtt", "clocks", data.clocks ?? []);
      break;
    }
    case "applyShift": {
      // Um Player resolveu um shift em alvo que não conseguia escrever sozinho; o
      // cliente do GM executa a mudança de dado (a interação de Scale já foi
      // decidida do lado do Player) e posta o resultado.
      const trait = data.traitUuid ? await fromUuid(data.traitUuid) : null;
      const source = data.sourceUuid ? await fromUuid(data.sourceUuid) : null;
      if (!trait || trait.type !== "trait") return;
      const res = data.exhaust
        ? await trait.exhaust({ promptDeath: false })
        : await trait.shiftDown({ steps: data.steps ?? 1, promptDeath: false });
      if (!res.changed && !res.becameExhausted) return; // bloqueado / no-op
      const to = res.becameExhausted
        ? game.i18n.localize("SHIFT.DiceStatus.exhausted")
        : dieLabel(res.to);
      const esc = foundry.utils.escapeHTML;
      await ChatMessage.create({
        speaker: shiftSpeaker(source ?? trait.actor),
        content: `<div class="shift-vtt chat-card info-card warn"><p><i class="fa-solid fa-star"></i> ${game.i18n.format("SHIFT.Target.ApplyChat", {
          actor: esc(source?.name ?? ""),
          target: esc(trait.actor?.name ?? ""),
          trait: esc(trait.name),
          from: dieLabel(res.from),
          to
        })}</p></div>`
      });
      break;
    }
    case "commitShift": {
      // Auto-shift de um contribuinte de group roll cujo Trait o roller não podia
      // escrever: o GM efetiva o ShiftDown forçado (a decisão de shift já veio do roll
      // engine) e concede o XP ao dono. Sem chat card: o auto-shift faz parte do roll e
      // já foi anunciado no card da rolagem.
      const trait = data.traitUuid ? await fromUuid(data.traitUuid) : null;
      if (!trait || trait.type !== "trait") return;
      try { await trait.shiftDown({ steps: data.steps ?? 1, force: true, promptDeath: false }); } catch (err) { /* noop */ }
      if (data.xp > 0 && trait.actor?.type === "character") {
        try { await trait.actor.addXP(data.xp, { limited: true }); } catch (err) { /* noop */ }
      }
      break;
    }
  }
}

export function registerSocket() {
  game.socket.on(CHANNEL, handle);
}

/** Aplica direto no cliente do GM ativo; todos os outros (Players E
 *  GMs secundários, não ativos) retransmitem para o GM ativo, de modo que a
 *  escrita nunca seja descartada silenciosamente. */
export async function emitOrRun(data) {
  if (isActiveGM()) return handle({ ...data });
  if (!game.users.activeGM) {
    return void ui.notifications.warn(game.i18n.localize("SHIFT.Warnings.NoGM"));
  }
  game.socket.emit(CHANNEL, data);
}

/**
 * GM → Player: pede que `userId` abra um prompt de Action Roll para `actorUuid`,
 * restrito a `allowedTraits` (uuids; vazio = todos) com um `rollType` forçado.
 * Emite para os outros clientes; roda localmente se o GM mirou no próprio usuário.
 */
export function requestPlayerRoll({ userId, actorUuid, allowedTraits = null, rollType = null } = {}) {
  const data = { action: "requestRoll", userId, actorUuid, allowedTraits, rollType };
  if (game.user.id === userId) return handle({ ...data });
  game.socket.emit(CHANNEL, data);
}
