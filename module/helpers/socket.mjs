/**
 * SHIFT VTT, retransmissão via socket.
 * Players emitem requisições; o cliente do GM ativo as aplica.
 */
import { shiftSpeaker, dieLabel, DIE_PROGRESSION, dieIndex, fvtt } from "./utils.mjs";

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
      rollType: data.rollType ?? null,
      includeVehicles: !!data.includeVehicles
    });
  }

  // Atacante/GM → o Player dono do character: abre o prompt de Going Down
  // (Drawback / Morte Heroica) SÓ no cliente daquele usuário. A escolha é do Player
  // pelas regras, mas o Core costuma ser exaurido por outro cliente (ataque de
  // Adversary aplicado pelo GM, relay de combate), então a decisão é roteada para
  // quem possui o actor e pode escrever a consequência. Antes do gate de GM ativo
  // porque o alvo normalmente é um Player.
  if (data?.action === "promptCoreDeath") {
    if (game.user.id !== data.userId) return;
    const trait = data.traitUuid ? await fromUuid(data.traitUuid).catch(() => null) : null;
    if (!trait?.isTrait) return;
    return trait.promptCoreExhausted();
  }

  // Tudo abaixo é Player → GM ativo (só o GM ativo aplica). A retransmissão é
  // PROPOSITALMENTE permissiva: pelas regras, um Player precisa poder dar shift down
  // em Traits que NÃO possui (o Trait de um Adversary durante um combate, uma Quest ou
  // Trait da Party, um clock). Quem controla SE e QUANDO o shift acontece são as flags
  // do próprio item (rollable / autoShiftOnRoll / locked) e os toggles do clock
  // (noshift / playersCanRoll), nunca a posse do documento. NÃO gateie estas ações por
  // ownership do alvo — fazê-lo quebra o loop básico de combate.
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
      // Curadoria do painel (add/edit/delete/visibilidade/reordenar) salva o array inteiro.
      await game.settings.set("shift-vtt", "clocks", data.clocks ?? []);
      break;
    }
    case "shiftClock": {
      // Roll de Global Trait DIRECIONADO: aplica o ShiftDown só no clock alvo, lendo o
      // setting autoritativo e regravando-o. Evita o clobber do antigo relay do array
      // inteiro (last-writer-wins em rolls concorrentes). Permissivo de propósito:
      // quem pôde acionar o roll (a UI já gateia por playersCanRoll, e o shift já foi
      // filtrado por noshift) tem o shift aplicado mesmo sem possuir o setting de mundo.
      const clocks = game.settings.get("shift-vtt", "clocks") ?? [];
      const live = clocks.find(c => c.id === data.clockId);
      if (!live || live.mode !== "trait" || live.exhausted) return;
      // Mesma escada/computeShift do painel: cada step desce um dado e, no fundo,
      // marca exhausted.
      const steps = Math.max(1, data.steps ?? 1);
      for (let i = 0; i < steps && !live.exhausted; i++) {
        const idx = dieIndex(live.currentDie);
        if (idx >= DIE_PROGRESSION.length - 1) live.exhausted = true;
        else live.currentDie = DIE_PROGRESSION[idx + 1];
      }
      await game.settings.set("shift-vtt", "clocks", clocks);
      break;
    }
    case "applyShift": {
      // Um Player resolveu um shift em alvo que não conseguia escrever sozinho; o
      // cliente do GM executa a mudança de dado (a interação de Scale já foi
      // decidida do lado do Player) e posta o resultado.
      const trait = data.traitUuid ? await fromUuid(data.traitUuid) : null;
      const source = data.sourceUuid ? await fromUuid(data.sourceUuid) : null;
      if (!trait || !trait.hasClock) return; // Trait OU Quest (ambos têm clock e dão shift)
      const res = data.exhaust
        ? await trait.exhaust({})
        : await trait.shiftDown({ steps: data.steps ?? 1 });
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
      if (!trait || !trait.hasClock) return; // Trait OU Quest (ambos têm clock e dão shift)
      try { await trait.shiftDown({ steps: data.steps ?? 1, force: true }); } catch (err) { /* noop */ }
      if (data.xp > 0 && trait.actor?.type === "character") {
        try { await trait.actor.addXP(data.xp, { limited: true }); } catch (err) { /* noop */ }
      }
      break;
    }
    case "requestAdvancement": {
      // Player pediu para gastar XP num advancement, mas o personagem já avançou nesta
      // sessão (trava de 1/sessão). O GM ativo decide: aprovando, ELE efetiva o gasto
      // (pode escrever o actor) e o card de auditoria sai no chat. Negar = nada acontece.
      const actor = data.actorUuid ? await fromUuid(data.actorUuid) : null;
      if (!actor || actor.type !== "character") return;
      const cost = Math.max(0, Math.floor(data.cost ?? 0));
      if ((actor.system.xp?.value ?? 0) < cost) {
        return void ui.notifications.warn(game.i18n.format("SHIFT.Advancement.DenyNoXp", { actor: actor.name }));
      }
      const esc = foundry.utils.escapeHTML;
      const ok = await fvtt.DialogV2.confirm({
        window: { title: game.i18n.localize("SHIFT.Advancement.ApprovalTitle") },
        content: `<p>${game.i18n.format("SHIFT.Advancement.ApprovalConfirm", {
          user: esc(data.userName ?? ""), actor: esc(actor.name), label: esc(data.label ?? ""), cost
        })}</p>`,
        rejectClose: false
      });
      if (!ok) return;
      await actor.commitAdvancement({ label: data.label ?? "", cost, approvedBy: game.user.name });
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
export function requestPlayerRoll({ userId, actorUuid, allowedTraits = null, rollType = null, includeVehicles = false } = {}) {
  const data = { action: "requestRoll", userId, actorUuid, allowedTraits, rollType, includeVehicles };
  if (game.user.id === userId) return handle({ ...data });
  game.socket.emit(CHANNEL, data);
}

/**
 * Atacante/GM → Player: pede que `userId` abra o prompt de Going Down (exaustão de
 * Core Trait) para o Trait `traitUuid`. Emite para os outros clientes; roda local
 * se o alvo for o próprio usuário. Espelha requestPlayerRoll.
 */
export function requestCoreDeathPrompt({ userId, traitUuid } = {}) {
  const data = { action: "promptCoreDeath", userId, traitUuid };
  if (game.user.id === userId) return handle({ ...data });
  game.socket.emit(CHANNEL, data);
}
