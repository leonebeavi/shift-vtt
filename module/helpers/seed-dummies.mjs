/**
 * SHIFT VTT, geração de conteúdo de teste / sandbox (LOCALIZADO, conjunto único).
 *
 * Popula dois compêndios embutidos, "Atores · Sandbox" (Actors) e
 * "Itens · Sandbox" (Items), com fixtures de TESTE prontas e totalmente
 * configuradas para que o GM possa montar um mundo de testes e exercitar TODAS
 * as funcionalidades do sistema de uma só vez: cada tipo de Actor/Item, cada
 * categoria de Trait, estados exhausted/temporário/travado, overrides de Scale,
 * a matriz de Special Traits de Adversary, Scaled Up Techniques, Quests de
 * Party, Landmarks de Location e assim por diante.
 *
 * Há UM único conjunto de fixtures, localizado DINAMICAMENTE para o idioma
 * ativo do Foundry (`game.i18n.lang`). Os dados embutidos (seed-dummies-data.mjs)
 * guardam cada string traduzível como um par {"pt-BR":…, en:…}; resolvemos para
 * o idioma ativo ao gerar E re-localizamos os documentos já gerados sempre que o
 * idioma do mundo muda, de modo que há uma única árvore de pastas, nunca uma
 * pasta por idioma. Os nomes das pastas também seguem o idioma ativo.
 *
 * Adversaries se dividem pela disposition do Token em "NPCs" (aliados neutros) e
 * "Criaturas"/"Creatures" (inimigos hostis). Cada documento gerado carrega um id
 * estável `flags.shift-vtt.fixture` (qual fixture é) e `flags.shift-vtt.lang`
 * (em qual idioma ele está exibido) para que a re-localização seja idempotente.
 *
 * Somente GM; deduplicado por id de fixture; destrava → cria → trava de novo. A
 * criação é controlada por versão (`testDummiesSeedVersion` vs SEED_VERSION) e
 * incrementar SEED_VERSION elimina as pastas legadas por idioma e gera de novo.
 * Para estender a sandbox: adicione entradas em seed-dummies-data.mjs, nunca
 * edite o LevelDB à mão.
 */
import { SANDBOX } from "./seed-dummies-data.mjs";

const ACTORS_PACK = "shift-vtt.shift-test-actors";
const ITEMS_PACK = "shift-vtt.shift-test-items";
const SANDBOX_FOLDER = "SHIFT VTT | Sandbox";
const PURPLE = "#9a5cf0";

/** Incremente para reconstruir o conteúdo gerado da sandbox em todos os mundos
 *  (incrementar a versão apaga os documentos+pastas que geramos antes e os
 *  recria, de modo que fixtures corrigidas substituem as antigas; documentos
 *  adicionados pelo GM no pack ficam intactos). */
const SEED_VERSION = 5;

/** Chave do idioma ativo; só pt-BR e en são fornecidos; qualquer outro → en. */
const activeLang = () => (game.i18n?.lang === "pt-BR" ? "pt-BR" : "en");

/** Rótulos de pasta por chave de roteamento, localizados em runtime (mapa fixo,
 *  NÃO TYPES, para que a divisão NPCs/Criaturas leia corretamente e permaneça
 *  agnóstica de idioma). */
const FOLDER_LABEL = {
  character: { "pt-BR": "Personagens", en: "Characters" },
  npc: { "pt-BR": "NPCs", en: "NPCs" },
  creature: { "pt-BR": "Criaturas", en: "Creatures" },
  vehicle: { "pt-BR": "Veículos", en: "Vehicles" },
  location: { "pt-BR": "Locais", en: "Locations" },
  party: { "pt-BR": "Grupos", en: "Parties" },
  trait: { "pt-BR": "Traços", en: "Traits" },
  technique: { "pt-BR": "Técnicas", en: "Techniques" },
  keyword: { "pt-BR": "Palavras-chave", en: "Keywords" },
  drawback: { "pt-BR": "Desvantagens", en: "Drawbacks" },
  landmark: { "pt-BR": "Marcos", en: "Landmarks" }
};
const labelOf = (key, lang) => FOLDER_LABEL[key]?.[lang] ?? FOLDER_LABEL[key]?.en ?? key;

/** Uma folha traduzível {"pt-BR":…, en:…}. */
const isI18n = v => v && typeof v === "object" && !Array.isArray(v)
  && Object.prototype.hasOwnProperty.call(v, "en")
  && Object.prototype.hasOwnProperty.call(v, "pt-BR");

/** Resolve em profundidade cada folha traduzível de uma fixture para um idioma. */
function loc(v, lang) {
  if (isI18n(v)) return v[lang] ?? v.en;
  if (Array.isArray(v)) return v.map(x => loc(x, lang));
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = loc(v[k], lang);
    return o;
  }
  return v;
}

/** Roteamento de pastas: adversaries se dividem pela disposition (neutral →
 *  NPCs, hostile → Criaturas); todo outro Actor fica sob seu próprio tipo; Items
 *  por tipo. */
function actorKey(fx) {
  if (fx.type === "adversary") return Number(fx.disposition) >= 0 ? "npc" : "creature";
  return fx.type;
}
const itemKey = fx => fx.type;

/** Constrói um objeto de criação de Actor localizado, marcado com seu id de
 *  fixture + lang; os items embutidos recebem uma flag `idx` estável para que a
 *  re-localização consiga casá-los. */
function buildActor(fx, lang, folderId) {
  const r = loc(fx, lang);
  const token = { texture: { src: r.tokenImg || r.img } };
  if (Number.isFinite(r.disposition)) token.disposition = r.disposition;
  const items = (r.items ?? []).map((it, i) => ({
    ...it,
    flags: { ...(it.flags || {}), "shift-vtt": { ...(it.flags?.["shift-vtt"] || {}), idx: i } }
  }));
  return {
    name: r.name, type: r.type, img: r.img, folder: folderId ?? null,
    prototypeToken: token, system: r.system ?? {}, items,
    flags: { "shift-vtt": { fixture: fx.id, lang } }
  };
}
function buildItem(fx, lang, folderId) {
  const r = loc(fx, lang);
  return {
    name: r.name, type: r.type, img: r.img, folder: folderId ?? null,
    system: r.system ?? {}, flags: { "shift-vtt": { fixture: fx.id, lang } }
  };
}

/** Garante uma pasta por chave de roteamento dentro de um pack, nomeada no
 *  idioma ativo. Pastas existentes são renomeadas para acompanhar uma troca de
 *  idioma. */
async function ensureFolders(pack, documentType, keys, lang) {
  const prefix = `sbx-${documentType.toLowerCase()}-`;
  const byKey = new Map();
  for (const f of pack.folders.contents) {
    const g = f.getFlag("shift-vtt", "group");
    if (g && g.startsWith(prefix)) byKey.set(g.slice(prefix.length), f);
  }
  for (const [key, f] of byKey) {
    const want = labelOf(key, lang);
    if (f.name !== want) { try { await f.update({ name: want }); } catch (e) { /* nada */ } }
  }
  const missing = keys.filter(k => !byKey.has(k));
  if (missing.length) {
    const created = await Folder.createDocuments(
      missing.map(k => ({ name: labelOf(k, lang), type: documentType, sorting: "a", flags: { "shift-vtt": { group: `${prefix}${k}` } } })),
      { pack: pack.collection }
    );
    for (const f of created) byKey.set(f.getFlag("shift-vtt", "group").slice(prefix.length), f);
  }
  return byKey;
}

/** Renomeia as pastas de sandbox do pack para o idioma ativo (sem criar nada). */
async function refreshFolders(pack, lang) {
  const prefix = `sbx-${pack.documentName.toLowerCase()}-`;
  for (const f of pack.folders.contents) {
    const g = f.getFlag("shift-vtt", "group");
    if (!g || !g.startsWith(prefix)) continue;
    const want = labelOf(g.slice(prefix.length), lang);
    if (f.name !== want) { try { await f.update({ name: want }); } catch (e) { /* nada */ } }
  }
}

/** Reconstrução completa ao incrementar a versão: apaga todo documento e pasta
 *  que este gerador administra (esquema atual `sbx-*` + qualquer esquema legado
 *  `test-*`), depois recria o conjunto inteiro do zero no idioma ativo. Os
 *  documentos que o próprio GM adicionou (sem flag de fixture, fora de uma das
 *  nossas pastas) ficam intactos. */
async function rebuild(pack, list, build, lang) {
  const ours = pack.folders.contents.filter(f => {
    const g = f.getFlag("shift-vtt", "group") || "";
    return g.startsWith("sbx-") || g.startsWith("test-");
  });
  const ourFolderIds = new Set(ours.map(f => f.id));
  const docs = await pack.getDocuments();
  for (const d of docs) {
    if (d.getFlag("shift-vtt", "fixture") || ourFolderIds.has(d.folder?.id)) {
      try { await d.delete(); } catch (e) { /* nada */ }
    }
  }
  for (const f of ours) { try { await f.delete(); } catch (e) { /* nada */ } }

  const keyOf = pack.documentName === "Actor" ? actorKey : itemKey;
  const keys = [...new Set(list.map(keyOf))];
  const folders = await ensureFolders(pack, pack.documentName, keys, lang);
  const built = list.map(fx => build(fx, lang, folders.get(keyOf(fx))?.id));
  const Cls = pack.documentName === "Actor" ? Actor : Item;
  await Cls.createDocuments(built, { pack: pack.collection });
  console.log(`shift-vtt | (Re)built ${built.length} sandbox ${pack.documentName}(s) in ${pack.collection}`);
}

/** Re-localiza documentos desatualizados (e seus items embutidos) para o idioma ativo. */
async function applyLocalize(pack, stale, byId, lang) {
  for (const d of stale) {
    const fx = byId.get(d.getFlag("shift-vtt", "fixture"));
    if (!fx) continue;
    const r = loc(fx, lang);
    try {
      await d.update({ name: r.name, system: r.system ?? {}, "flags.shift-vtt.lang": lang });
      if (pack.documentName === "Actor" && d.items?.size) {
        const ri = r.items ?? [];
        const ups = [];
        for (const it of d.items.contents) {
          const i = it.getFlag("shift-vtt", "idx");
          const x = Number.isInteger(i) ? ri[i] : null;
          if (x) ups.push({ _id: it.id, name: x.name, system: x.system ?? {} });
        }
        if (ups.length) await d.updateEmbeddedDocuments("Item", ups);
      }
    } catch (e) { /* sem permissão */ }
  }
}

/**
 * Gera e localiza os dois compêndios de sandbox (somente GM). Ao incrementar
 * SEED_VERSION ele RECONSTRÓI (apaga os documentos+pastas que geramos antes e
 * recria o conjunto corrigido); caso contrário, executa apenas o passo de
 * LOCALIZE por carregamento, que reescreve qualquer documento cujo idioma
 * armazenado difira do ativo, o mecanismo por trás de "um único conjunto,
 * traduzido dinamicamente para o idioma selecionado do Foundry".
 */
export async function seedTestDummies() {
  const actorsPack = game.packs.get(ACTORS_PACK);
  const itemsPack = game.packs.get(ITEMS_PACK);
  if (!actorsPack || !itemsPack) return;

  const lang = activeLang();
  const cfg = [
    { pack: actorsPack, list: SANDBOX.actors, build: buildActor, byId: new Map(SANDBOX.actors.map(f => [f.id, f])) },
    { pack: itemsPack, list: SANDBOX.items, build: buildItem, byId: new Map(SANDBOX.items.map(f => [f.id, f])) }
  ];

  try {
    const needRebuild = (game.settings.get("shift-vtt", "testDummiesSeedVersion") || 0) < SEED_VERSION;
    for (const { pack, list, build, byId } of cfg) {
      const docs = await pack.getDocuments();
      const stale = needRebuild ? [] : docs.filter(d => {
        const fx = d.getFlag("shift-vtt", "fixture");
        return fx && d.getFlag("shift-vtt", "lang") !== lang && byId.has(fx);
      });
      if (!needRebuild && !stale.length) continue;

      const wasLocked = pack.locked;
      try {
        if (wasLocked) await pack.configure({ locked: false });
        if (needRebuild) await rebuild(pack, list, build, lang);
        else { await refreshFolders(pack, lang); await applyLocalize(pack, stale, byId, lang); }
      } finally {
        if (wasLocked) { try { await pack.configure({ locked: true }); } catch (e) { /* ignora */ } }
      }
    }
    if (needRebuild) await game.settings.set("shift-vtt", "testDummiesSeedVersion", SEED_VERSION);
  } catch (err) {
    console.error("shift-vtt | Sandbox seeding failed", err);
  }
}

/**
 * Arquiva os dois packs de sandbox dentro de uma única pasta de Compêndio
 * colorida "SHIFT VTT — Sandbox". A entrada `packFolders` do manifesto já faz
 * isso para mundos *novos*; este passo idempotente do lado do GM cobre mundos
 * que já existiam antes de os packs serem adicionados. Um pack que o GM
 * deliberadamente arquivou em outro lugar fica intacto. Espelha
 * ensureCompendiumFolder em migrations.mjs.
 */
export async function ensureSandboxFolder() {
  const packs = [game.packs.get(ACTORS_PACK), game.packs.get(ITEMS_PACK)].filter(Boolean);
  if (!packs.length) return;

  try {
    let root = game.folders.find(f => f.type === "Compendium" && !f.folder
      && (f.getFlag?.("shift-vtt", "group") === "sandbox"
        || f.name === SANDBOX_FOLDER || f.name === "SHIFT VTT — Sandbox"));
    if (!root) {
      [root] = await Folder.createDocuments([
        { name: SANDBOX_FOLDER, type: "Compendium", color: PURPLE, sorting: "a", flags: { "shift-vtt": { group: "sandbox" } } }
      ]);
    } else {
      // Mantém a cor roxa e migra o nome antigo "— Sandbox" para "| Sandbox".
      const upd = {};
      if ((root.color?.css ?? root.color) !== PURPLE) upd.color = PURPLE;
      if (root.name !== SANDBOX_FOLDER) upd.name = SANDBOX_FOLDER;
      if (Object.keys(upd).length) { try { await root.update(upd); } catch (e) { /* nada */ } }
    }

    for (const p of packs) {
      const cur = p.config?.folder ?? p.folder?.id;
      if ((!cur || !game.folders.get(cur)) && cur !== root.id) {
        try { await p.setFolder(root); } catch (e) { /* nada */ }
      }
    }
  } catch (err) {
    console.error("shift-vtt | Placing the sandbox packs in their folder failed", err);
  }
}
