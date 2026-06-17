/**
 * SHIFT VTT, seed de compêndio e organização da sidebar do lado do GM.
 *
 * O seed é idempotente e protegido por um flag de mundo; a organização de
 * folders é auto-corretiva e segura para rodar a cada carregamento. Ambos rodam
 * a partir do hook `ready`, apenas para o GM.
 */

/**
 * Roda `fn` com o pack temporariamente destravado, depois restaura seu estado
 * de trava original. Packs do sistema vêm travados; isto abre um deles apenas o
 * tempo suficiente para escrever nele. O re-travamento é best-effort e nunca
 * mascara um erro vindo de `fn`.
 * @param {CompendiumCollection} pack
 * @param {() => Promise<void>} fn
 */
async function withUnlockedPack(pack, fn) {
  const wasLocked = pack.locked;
  try {
    if (wasLocked) await pack.configure({ locked: false });
    await fn();
  } finally {
    if (wasLocked) {
      try { await pack.configure({ locked: true }); } catch (e) { /* re-travamento é best-effort */ }
    }
  }
}

/**
 * Popula o compêndio embutido "SHIFT Traits" com os Core Traits padrão
 * (Body / Mind / Soul) e os presets de Special Trait, completos com descrições
 * e configuração de regras. Roda uma vez; depois disso o GM pode editar ou
 * apagar as entradas livremente, sem que sejam recriadas.
 */
export async function seedCompendium() {
  if (game.settings.get("shift-vtt", "compendiumSeeded")) return;
  const pack = game.packs.get("shift-vtt.shift-traits");
  if (!pack) return;

  const L = k => game.i18n.localize(k);
  const source = L("SHIFT.Compendium.Source");

  const core = (name, desc) => ({
    name,
    type: "trait",
    img: CONFIG.SHIFT.defaultIcons.trait,
    system: {
      category: "core",
      maxDie: "d6",
      currentDie: "d6",
      source,
      description: `<p>${desc}</p>`,
      features: { usesKeywords: false, usesDrawbacks: true }
    }
  });

  const docs = [
    core(L("SHIFT.Trait.Body"), L("SHIFT.Trait.BodyDesc")),
    core(L("SHIFT.Trait.Mind"), L("SHIFT.Trait.MindDesc")),
    core(L("SHIFT.Trait.Soul"), L("SHIFT.Trait.SoulDesc"))
  ];

  for (const preset of Object.values(CONFIG.SHIFT.specialTraitPresets)) {
    docs.push({
      name: L(preset.name),
      type: "trait",
      img: CONFIG.SHIFT.defaultIcons.trait,
      system: foundry.utils.mergeObject(
        { description: `<p>${L(preset.description)}</p>`, source, locked: true },
        preset.system,
        { inplace: false }
      )
    });
  }

  // Nunca duplica uma entrada que o pack (já distribuído ou já populado) contém:
  // cria apenas os padrões que estão faltando, comparando pelo nome.
  const existing = new Set([...await pack.getIndex()].map(e => e.name.toLowerCase()));
  const toCreate = docs.filter(d => !existing.has(d.name.toLowerCase()));

  // Um pack do sistema vem travado por padrão; abre-o só o tempo do seed.
  try {
    await withUnlockedPack(pack, async () => {
      if (toCreate.length) await Item.createDocuments(toCreate, { pack: pack.collection });
      await game.settings.set("shift-vtt", "compendiumSeeded", true);
      console.log(`shift-vtt | Seeded ${toCreate.length} default Trait(s) into ${pack.collection}`);
    });
  } catch (err) {
    console.error("shift-vtt | Compendium seeding failed", err);
  }
}

/**
 * Faz o seed da(s) Technique(s) canônica(s) no pack embutido, arquivadas sob um
 * único Folder "Techniques". Atualmente a Technique "Scale Up" (techniqueType
 * "scaledUp"): suas regras ficam no próprio campo de descrição, então a sheet
 * não precisa mais de uma dica inline. Arrastá-la para um personagem pede para
 * vincular um Focus Trait (ShiftItem._onCreate). Protegida por seu próprio flag
 * de mundo, e nunca duplica uma entrada que já exista pelo nome, então o GM pode
 * editá-la ou apagá-la livremente. O Folder é identificado por um flag estável
 * `shift-vtt.group`, então mudar o idioma do mundo nunca cria uma segunda cópia.
 */
export async function seedTechniques() {
  if (game.settings.get("shift-vtt", "techniquesSeeded")) return;
  const pack = game.packs.get("shift-vtt.shift-traits");
  if (!pack) return;

  const L = k => game.i18n.localize(k);
  const source = L("SHIFT.Compendium.Source");

  const docs = [
    {
      name: L("SHIFT.Compendium.ScaleUpName"),
      type: "technique",
      img: CONFIG.SHIFT.defaultIcons.technique,
      system: {
        techniqueType: "scaledUp",
        source,
        description: `<p>${L("SHIFT.Compendium.ScaleUpDesc")}</p>`,
        recharges: { session: true, safeRest: true, unsafeRest: false },
        focus: { scale: 2 }
      }
    }
  ];

  const existing = new Set([...await pack.getIndex()].map(e => e.name.toLowerCase()));
  const toCreate = docs.filter(d => !existing.has(d.name.toLowerCase()));

  try {
    await withUnlockedPack(pack, async () => {
      // Um único folder "Techniques", identificado por flag para que uma mudança de idioma nunca o duplique.
      const folderName = L("SHIFT.Compendium.TechniquesFolder");
      let folder = pack.folders.contents.find(f => f.getFlag("shift-vtt", "group") === "techniques")
        ?? pack.folders.contents.find(f => f.name === folderName);
      if (!folder) {
        [folder] = await Folder.createDocuments(
          [{ name: folderName, type: "Item", flags: { "shift-vtt": { group: "techniques" } } }],
          { pack: pack.collection }
        );
      }

      if (toCreate.length) {
        for (const d of toCreate) d.folder = folder.id;
        await Item.createDocuments(toCreate, { pack: pack.collection });
      }
      await game.settings.set("shift-vtt", "techniquesSeeded", true);
      console.log(`shift-vtt | Seeded ${toCreate.length} Technique(s) into ${pack.collection}`);
    });
  } catch (err) {
    console.error("shift-vtt | Technique seeding failed", err);
  }
}

/**
 * Faz o seed do pack embutido "Macros | SHIFT" com um conjunto pequeno e
 * selecionado de macros úteis e personalizadas (cada uma guiada por prompt, em
 * vez de uma execução fixa e única). Espelha a receita de seed de trait/
 * technique: protegida por um flag de mundo, deduplicada por nome,
 * destravar → criar → marcar flag → re-travar. Os comandos das macros se apoiam
 * na API pública `game.shift.api` e no novo `actor.rechargeAllTraits()`.
 */
export async function seedMacros() {
  if (game.settings.get("shift-vtt", "macrosSeeded")) return;
  const pack = game.packs.get("shift-vtt.shift-macros");
  if (!pack) return;

  const L = k => game.i18n.localize(k);

  // Restaura todo Trait do(s) token(s) selecionado(s) (ou do seu personagem
  // atribuído) ao seu Max Die; funciona para todos os tipos de Actor.
  const rechargeCmd = `
const sel = (canvas.tokens?.controlled ?? []).map(t => t.actor).filter(a => a);
const actors = sel.length ? sel : (game.user.character ? [game.user.character] : []);
if (!actors.length) { ui.notifications.warn(game.i18n.localize("SHIFT.Macro.SelectToken")); return; }
let traits = 0, done = 0;
for (const a of actors) {
  if (!a.isOwner || typeof a.rechargeAllTraits !== "function") continue;
  traits += await a.rechargeAllTraits();
  done++;
}
ui.notifications.info(game.i18n.format("SHIFT.Macro.Recharged", { actors: done, traits }));`;

  // Concede XP a personagens escolhidos por uma quantia solicitada via prompt (prêmio do GM sem limite).
  const grantXpCmd = `
const chars = game.actors.filter(a => a.type === "character" && a.isOwner);
if (!chars.length) { ui.notifications.warn(game.i18n.localize("SHIFT.Macro.NoCharacters")); return; }
const rows = chars.map(a => '<label class="shift-grant-row"><input type="checkbox" name="who" value="' + a.id + '" checked/> <img src="' + a.img + '" width="24" height="24"/> <span>' + foundry.utils.escapeHTML(a.name) + '</span></label>').join("");
const content = '<div class="shift-grant-xp"><p>' + game.i18n.localize("SHIFT.Macro.GrantXpHint") + '</p><div class="shift-grant-list">' + rows + '</div><label class="shift-grant-amt"><span>' + game.i18n.localize("SHIFT.Macro.Amount") + '</span> <input type="number" name="amt" value="1" min="1"/></label></div>';
const res = await foundry.applications.api.DialogV2.prompt({
  window: { title: game.i18n.localize("SHIFT.Macro.GrantXpTitle"), icon: "fa-solid fa-star" },
  classes: ["shift-vtt", "shift-dialog"],
  content,
  rejectClose: false,
  ok: { label: game.i18n.localize("SHIFT.Common.Confirm"), callback: (e, b) => ({
    ids: Array.from(b.form.querySelectorAll('input[name="who"]:checked')).map(i => i.value),
    amt: Number(b.form.elements.amt.value) || 0
  }) }
}).catch(() => null);
if (!res || !res.ids.length || res.amt <= 0) return;
let n = 0;
for (const id of res.ids) {
  const a = game.actors.get(id);
  if (a) { await a.addXP(res.amt, { limited: false, reason: game.i18n.localize("SHIFT.Macro.GrantXpReason"), toChat: true }); n++; }
}
ui.notifications.info(game.i18n.format("SHIFT.Macro.GrantedXp", { amount: res.amt, actors: n }));`;

  // GM: inicia uma nova sessão (renova Techniques, zera o XP da sessão).
  const newSessionCmd = `
if (!game.user.isGM) { ui.notifications.warn(game.i18n.localize("SHIFT.Macro.GMOnly")); return; }
await game.shift.api.promptNewSession();`;

  // Abre o diálogo de Action Roll para o token selecionado (ou seu personagem).
  const actionRollCmd = `
const actor = (canvas.tokens?.controlled?.[0]?.actor) ?? game.user.character;
if (!actor) { ui.notifications.warn(game.i18n.localize("SHIFT.Macro.SelectToken")); return; }
await game.shift.api.actionRoll(actor);`;

  // Alterna o painel fixado de Global Traits.
  const clocksCmd = `game.shift.api.clocks();`;

  const docs = [
    { name: L("SHIFT.Macro.RechargeName"),   img: "icons/magic/time/arrows-circling-green.webp",      command: rechargeCmd },
    { name: L("SHIFT.Macro.GrantXpName"),     img: "icons/magic/light/explosion-star-glow-yellow.webp", command: grantXpCmd },
    { name: L("SHIFT.Macro.NewSessionName"),  img: "icons/magic/time/day-night-sunset-sunrise.webp",   command: newSessionCmd },
    { name: L("SHIFT.Macro.ActionRollName"),  img: "icons/sundries/gaming/dice-pair-white-green.webp", command: actionRollCmd },
    { name: L("SHIFT.Macro.ClocksName"),      img: "icons/magic/time/clock-spinning-gold-pink.webp",   command: clocksCmd }
  ].map(m => ({ name: m.name, type: "script", img: m.img, scope: "global", command: m.command.trim() }));

  const existing = new Set([...await pack.getIndex()].map(e => e.name.toLowerCase()));
  const toCreate = docs.filter(d => !existing.has(d.name.toLowerCase()));

  try {
    await withUnlockedPack(pack, async () => {
      if (toCreate.length) await Macro.createDocuments(toCreate, { pack: pack.collection });
      await game.settings.set("shift-vtt", "macrosSeeded", true);
      console.log(`shift-vtt | Seeded ${toCreate.length} macro(s) into ${pack.collection}`);
    });
  } catch (err) {
    console.error("shift-vtt | Macro seeding failed", err);
  }
}

/**
 * Coloca o pack de compêndio embutido dentro de um único folder colorido
 * "SHIFT VTT" na sidebar de Compêndios (rosa do sistema).
 *
 * A entrada `packFolders` do manifesto já faz isso para mundos *novos*, mas o
 * Foundry só arquiva automaticamente um pack cujo `core.compendiumConfiguration`
 * ainda não tem a chave `folder`; então um mundo criado antes desta mudança
 * (onde o pack foi registrado com `folder: null`) silenciosamente nunca ganharia
 * o folder. Este passo idempotente do lado do GM preenche isso retroativamente,
 * mantém a cor em sincronia e aposenta o antigo sub-folder "Items" (re-arquivando
 * o pack sob "SHIFT VTT"). Um pack que o GM arquivou deliberadamente em algum
 * *outro* folder fica intocado.
 */
export async function ensureCompendiumFolder() {
  const pack = game.packs.get("shift-vtt.shift-traits");
  if (!pack) return;

  const PINK = "#ff5fa2";
  try {
    // 1) Um único folder de nível superior "SHIFT VTT", colorido com o rosa do mascote.
    let root = game.folders.find(f => f.type === "Compendium" && !f.folder && f.name === "SHIFT VTT");
    if (!root) {
      [root] = await Folder.createDocuments([
        { name: "SHIFT VTT", type: "Compendium", color: PINK, sorting: "a" }
      ]);
    } else if ((root.color?.css ?? root.color) !== PINK) {
      try { await root.update({ color: PINK }); } catch (e) { /* noop */ }
    }

    // 2) Aposenta o sub-folder "Items" agora indesejado, criado por builds
    //    anteriores: re-arquiva sob "SHIFT VTT" todo pack ali dentro (para que um
    //    pack que o GM por acaso arrastou para lá nunca fique órfão), depois
    //    descarta o folder.
    const items = game.folders.find(f => f.type === "Compendium" && f.folder?.id === root.id && f.name === "Items");
    if (items) {
      for (const p of game.packs) {
        if (p.config?.folder === items.id) {
          try { await p.setFolder(root); } catch (e) { /* noop */ }
        }
      }
      await items.delete();
    }

    // 3) Arquiva nosso pack diretamente sob "SHIFT VTT" quando ele está sem
    //    folder ou aponta para um folder que não existe mais. Um pack que o GM
    //    arquivou de propósito em outro lugar fica intocado.
    const cur = pack.config?.folder;
    if ((!cur || !game.folders.get(cur)) && cur !== root.id) {
      await pack.setFolder(root);
      console.log(`shift-vtt | Filed ${pack.collection} under "SHIFT VTT"`);
    }
  } catch (err) {
    console.error("shift-vtt | Placing the compendium in its sidebar folder failed", err);
  }
}

/**
 * Arquiva o compêndio embutido "SHIFT Traits" em um Folder por categoria de
 * Trait (Core, Focus, Special, …), correspondendo às categorias usadas nas
 * sheets. Idempotente e auto-corretivo: folders são criados apenas quando
 * faltam e uma entrada só é movida quando ainda não está arquivada
 * corretamente, então é seguro rodar a cada carregamento e conforme o pack
 * cresce. Tanto entradas recém-populadas quanto pré-existentes são organizadas.
 *
 * A identidade do folder é a KEY estável da categoria (armazenada como um flag
 * `shift-vtt.category`), não o nome localizado do folder, então mudar o idioma
 * do mundo nunca cria um folder duplicado.
 */
export async function organizeTraitsCompendium() {
  const pack = game.packs.get("shift-vtt.shift-traits");
  if (!pack) return;

  const cats = CONFIG.SHIFT.traitCategories;
  const nameFor = cat => game.i18n.localize(cats[cat]);
  const folderCat = f => f.getFlag("shift-vtt", "category")
    ?? Object.keys(cats).find(c => nameFor(c) === f.name); // fallback para antes do flag

  const docs = await pack.getDocuments();
  // Folders de categoria existentes no pack, indexados por categoria (nunca duplicados).
  const byCat = new Map();
  for (const f of pack.folders.contents) {
    const cat = folderCat(f);
    if (cat && !byCat.has(cat)) byCat.set(cat, f);
  }

  // Categorias presentes entre as entradas que ainda não têm folder.
  const missing = new Set();
  for (const doc of docs) {
    const cat = doc.system?.category;
    if (cat && cats[cat] && !byCat.has(cat)) missing.add(cat);
  }

  // Nada a criar e tudo já arquivado → no-op barato (sem destravar).
  const needsWork = missing.size || docs.some(doc => {
    const cat = doc.system?.category;
    const folder = cat && cats[cat] && byCat.get(cat);
    return folder && doc.folder?.id !== folder.id;
  });
  if (!needsWork) return;

  try {
    await withUnlockedPack(pack, async () => {
      // 1) Cria os folders de categoria que faltam, depois os indexa por categoria.
      if (missing.size) {
        const created = await Folder.createDocuments(
          [...missing].map(cat => ({
            name: nameFor(cat),
            type: "Item",
            flags: { "shift-vtt": { category: cat } }
          })),
          { pack: pack.collection }
        );
        for (const f of created) byCat.set(folderCat(f), f);
      }

      // 2) Arquiva cada entrada categorizada sob seu folder (apenas quando ela se move).
      const updates = [];
      for (const doc of docs) {
        const cat = doc.system?.category;
        const folder = cat && cats[cat] ? byCat.get(cat) : null;
        if (folder && doc.folder?.id !== folder.id) updates.push({ _id: doc.id, folder: folder.id });
      }
      if (updates.length) await Item.updateDocuments(updates, { pack: pack.collection });

      console.log(`shift-vtt | Organised SHIFT Traits: +${missing.size} folder(s), ${updates.length} entr(ies) filed`);
    });
  } catch (err) {
    console.error("shift-vtt | Organising the Traits compendium failed", err);
  }
}
