/**
 * SHIFT VTT — resolução pura do Action Roll.
 *
 * Sem dependência do Foundry de propósito (nenhum global do Foundry): o coração
 * do sistema mora aqui para poder ser testado isoladamente. Veja tools/roll-spec.mjs.
 *
 * Regras de resultado:
 *  - Um dado tem sucesso em 1, 2 ou 3 (independente do tamanho do dado).
 *  - Critical Success: um dado mostra 1 (variantes: allOnes / everyOne).
 *  - Um dado que cai na face mais alta faz seu Trait dar ShiftDown, em toda
 *    rolagem, qualquer que seja o resultado.
 *  - Critical Failure: nenhum sucesso E um ou mais dados na face máxima (NÃO todos no máximo).
 *  - Risky: o resultado é decidido normalmente; além disso, todo dado que não
 *    teve sucesso dá ShiftDown. Risky só amplia o conjunto de shift; não promove
 *    um Success a Mitigated nem uma Failure a Critical Failure.
 *  - Inspired: qualquer resultado de sucesso conta como Critical Success.
 *
 * Cada entrada é `{ isOne, isSuccess, isMax }`; resolveOutcome marca `willShift`
 * em cada entrada (true = aquele dado faz seu Trait dar ShiftDown).
 */

/* ------------------------------------------------------------------ */
/* Progressão do Shift Die                                             */
/* ------------------------------------------------------------------ */

/** A escada do Shift Die, do melhor ao pior. Exhausted é o estado após o fim. */
export const DIE_PROGRESSION = ["d4", "d6", "d8", "d10", "d12"];

/**
 * Desce o Shift Die `steps` degraus na escada, informando onde ele para e se
 * caiu para fora do fim, em Exhausted. Fonte única de verdade tanto para o shift
 * previsto no card de rolagem quanto para o shiftDown efetivado, então os dois
 * nunca divergem. Puro (sem Foundry); coberto por tools/roll-spec.mjs.
 * @param {string} die chave do dado atual (ex.: "d6")
 * @param {object} [opts]
 * @param {number} [opts.steps=1] quantos degraus piorar o dado
 * @returns {{die:string, exhausted:boolean}} a chave do dado resultante (o último
 *   dado quando Exhausted) e se chegou a Exhausted
 */
export function computeShift(die, { steps = 1 } = {}) {
  let idx = DIE_PROGRESSION.indexOf(die);
  let exhausted = false;
  for (let s = 0; s < steps; s++) {
    if (exhausted) break;
    if (idx >= DIE_PROGRESSION.length - 1) exhausted = true;
    else idx += 1;
  }
  return { die: DIE_PROGRESSION[idx], exhausted };
}

/**
 * @param {Array<{isOne:boolean,isSuccess:boolean,isMax:boolean,willShift?:boolean}>} entries
 * @param {object} [opts]
 * @param {"normal"|"risky"|"inspired"} [opts.rollType]
 * @param {"standard"|"allOnes"|"everyOne"} [opts.critRule]
 * @returns {{type:string, critCount:number}}
 */
export function resolveOutcome(entries, { rollType = "normal", critRule = "standard" } = {}) {
  const ones = entries.filter(e => e.isOne).length;
  const hasSuccess = entries.some(e => e.isSuccess);
  // A categoria do resultado vem das faces máximas pelas regras normais; Risky
  // não a altera, apenas amplia o conjunto de shift.
  const anyMax = entries.some(e => e.isMax);

  // Quais dados de fato dão ShiftDown: os de face máxima no normal; numa rolagem
  // Risky, todo dado que não teve sucesso.
  const shiftTest = rollType === "risky" ? e => !e.isSuccess : e => e.isMax;
  for (const e of entries) e.willShift = shiftTest(e);

  let isCrit;
  if (rollType === "inspired") isCrit = hasSuccess;
  else if (critRule === "allOnes") isCrit = entries.length > 0 && entries.every(e => e.isOne);
  else isCrit = ones > 0;

  let type;
  if (isCrit) type = "criticalSuccess";
  else if (hasSuccess && anyMax) type = "mitigatedSuccess";
  else if (hasSuccess) type = "success";
  else if (anyMax) type = "criticalFailure";
  else type = "failure";

  let critCount = 0;
  if (type === "criticalSuccess") critCount = critRule === "everyOne" ? Math.max(1, ones) : 1;
  return { type, critCount };
}

/**
 * Resolve a interação opcional de Scale de um Action Roll contra UM Trait alvo
 * escolhido (a interação entre níveis de Scale diferentes).
 *
 *   gap = rollerScale - targetTraitScale
 *    gap <= -2 ...... sem efeito (qualquer resultado conta como Failure)
 *    gap === -1 ..... só um Critical Success dá shift no alvo (Successes normais
 *                     contam como Failure)
 *    gap >=  +1 ..... um Critical Success deixa o Trait alvo Exhausted de uma vez
 *                     (a vantagem de estar uma Scale acima); um Success sem crit
 *                     é um único shift normal
 *
 * gap >= 2 espelha de propósito o gap === 1: não há regra separada para estar
 * duas ou mais Scales acima, então aplicamos a vantagem de uma acima sem efeitos
 * extras.
 *
 * Com gap >= 1 o Exhaust acontece em QUALQUER Critical Success, tanto no caminho
 * base do "Apply to Target" quanto no bônus de Critical Success de dar shift de
 * novo, porque um crit de uma Scale maior sempre deixa Exhausted por completo
 * (regra da mesa).
 *
 * @param {number} gap rollerScale menos a Scale efetiva do Trait alvo escolhido
 * @param {object} [opts]
 * @param {boolean} [opts.isCrit] o Action Roll foi um Critical Success
 * @returns {"none"|"shift"|"exhaust"}
 */
export function scaleEffect(gap, { isCrit = false } = {}) {
  if (gap <= -2) return "none";
  if (gap === -1 && !isCrit) return "none";
  if (gap >= 1 && isCrit) return "exhaust";
  return "shift";
}

/**
 * A Scale em que um Action Roll inteiro resolve: a maior Scale entre os Traits
 * que contribuem eleva a rolagem toda. Os valores por Trait já carregam qualquer
 * override custom (acima OU abaixo do dono; veja ShiftItem#effectiveScale); aqui
 * só os combinamos.
 *
 *  - O Trait de maior Scale eleva a rolagem (Math.max).
 *  - `bumps` sobe o resultado uma Scale por passo (a regra opcional de gastar XP
 *    para Scale Up e qualquer outro modificador fixo).
 *  - `focusUpgrade` retrata UM Trait que contribui numa Scale maior antes do max
 *    (a Technique "Scaled Up": um Focus Trait escolhido conta como Scale 2).
 *  - O resultado é limitado ao domínio de Scale 1..4.
 *
 * @param {number[]} traitScales Scale efetiva de cada Trait que contribui
 * @param {object} [opts]
 * @param {number} [opts.bumps=0] passos fixos de Scale a somar (cada um = +1)
 * @param {{index:number, scale:number}|null} [opts.focusUpgrade] eleva um Trait
 * @returns {number} 1..4
 */
export function rollScaleOf(traitScales = [], { bumps = 0, focusUpgrade = null } = {}) {
  const adjusted = (traitScales.length ? traitScales : [1]).map((s, i) =>
    focusUpgrade && i === focusUpgrade.index ? Math.max(s ?? 1, focusUpgrade.scale ?? 1) : (s ?? 1));
  return Math.min(4, Math.max(Math.max(...adjusted, 1) + (bumps || 0), 1));
}
