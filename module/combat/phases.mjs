/**
 * SHIFT VTT — fases de Encounter (helper compartilhado).
 *
 * Fonte de verdade única do agrupamento por fase usado tanto pela decoração do
 * Combat Tracker (tracker.mjs) quanto pela Combat HUD flutuante (combat-hud.mjs).
 *
 * As keys de fase (advantage/p1/adv/p2/unrolled) mapeiam para CONFIG.SHIFT.phases
 * (advantage/first/adversary/second), que carregam os números de iniciativa
 * canônicos — compartilhados com o combat document e o roll engine. Um Combatant
 * sem iniciativa (character que ainda não rolou a ordem de turno) cai em "unrolled".
 */

export const PHASE_META = [
  { key: "advantage", phase: "advantage", icon: "fa-bolt", label: "SHIFT.Combat.AdvantagePhase" },
  { key: "p1", phase: "first", icon: "fa-angles-up", label: "SHIFT.Combat.Phase1" },
  { key: "adv", phase: "adversary", icon: "fa-shield-halved", label: "SHIFT.Combat.PhaseAdversary" },
  { key: "p2", phase: "second", icon: "fa-angles-down", label: "SHIFT.Combat.Phase2" },
  { key: "unrolled", phase: null, icon: "fa-dice", label: "SHIFT.Combat.PhaseUnrolled" }
];

// Construído lazy: CONFIG.SHIFT.phases só é populado no init, depois deste módulo carregar.
export function phases() {
  const cfg = CONFIG.SHIFT?.phases ?? {};
  return PHASE_META.map(p => ({ ...p, init: p.phase ? (cfg[p.phase] ?? null) : null }));
}

/** A fase (entrada do PHASE_META, com `init` resolvido) de um Combatant pela sua
 *  iniciativa; sem match (iniciativa null/undefined) → última fase, "unrolled". */
export function phaseFor(combatant) {
  const init = combatant?.initiative;
  const all = phases();
  return all.find(p => p.init === init) ?? all[all.length - 1];
}
