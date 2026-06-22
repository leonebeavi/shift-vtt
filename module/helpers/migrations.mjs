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
      description: `<p>${desc}</p>`
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
  const pack = game.packs.get("shift-vtt.shift-macros");
  if (!pack) return;

  // Carimbo de versão: guarda a versão do sistema do último re-sync. Auto-registrado
  // aqui (config:false, world) para não depender de settings.mjs. Se o carimbo for
  // igual à versão atual, já re-sincronizamos neste release → pula o trabalho (early-
  // return), evitando hidratar e fazer diff de todos os macros a cada login de GM.
  // Vazio (mundo novo / setting recém-criado) ou diferente (novo release) → re-sync.
  if (!game.settings.settings.has("shift-vtt.macrosSeededVersion")) {
    game.settings.register("shift-vtt", "macrosSeededVersion", { scope: "world", config: false, type: String, default: "" });
  }
  const stamped = game.settings.get("shift-vtt", "macrosSeededVersion");
  if (stamped === game.system.version) return;

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

  // Concede XP a personagens escolhidos (prêmio do GM sem limite). Wrapper fino: a
  // lógica e o diálogo bonito vivem na API pública, compartilhados com a ficha de Party.
  const grantXpCmd = `await game.shift.api.grantXp();`;

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

  // GM: abre o diálogo "Request a Roll" para a party ativa.
  const requestRollCmd = `await game.shift.api.requestRoll();`;

  const docs = [
    { name: L("SHIFT.Macro.RechargeName"),    img: "icons/magic/time/arrows-circling-green.webp",      command: rechargeCmd },
    { name: L("SHIFT.Macro.GrantXpName"),     img: "icons/magic/light/explosion-star-glow-yellow.webp", command: grantXpCmd },
    { name: L("SHIFT.Macro.RequestRollName"), img: "icons/sundries/gaming/dice-runed-brown.webp",      command: requestRollCmd },
    { name: L("SHIFT.Macro.NewSessionName"),  img: "icons/magic/time/day-night-sunset-sunrise.webp",   command: newSessionCmd },
    { name: L("SHIFT.Macro.ActionRollName"),  img: "icons/sundries/gaming/dice-pair-white-green.webp", command: actionRollCmd },
    { name: L("SHIFT.Macro.ClocksName"),      img: "icons/magic/time/clock-spinning-gold-pink.webp",   command: clocksCmd }
  ].map(m => ({ name: m.name, type: "script", img: m.img, scope: "global", command: m.command.trim() }));

  // Cria os que faltam e RE-SINCRONIZA o `command` dos já existentes — os comandos
  // se apoiam na API pública, então uma correção aqui precisa alcançar mundos antigos.
  const index = [...await pack.getIndex()];
  const byName = new Map(index.map(e => [e.name.toLowerCase(), e]));
  const toCreate = [];
  const toUpdate = [];
  for (const d of docs) {
    const ex = byName.get(d.name.toLowerCase());
    if (!ex) { toCreate.push(d); continue; }
    const full = await pack.getDocument(ex._id);
    if (full && full.command !== d.command) toUpdate.push({ doc: full, command: d.command });
  }
  if (!toCreate.length && !toUpdate.length) {
    // Nada a criar/atualizar: já está em dia → carimba a versão para pular o diff no próximo login.
    await game.settings.set("shift-vtt", "macrosSeededVersion", game.system.version);
    return;
  }
  try {
    await withUnlockedPack(pack, async () => {
      if (toCreate.length) await Macro.createDocuments(toCreate, { pack: pack.collection });
      for (const u of toUpdate) await u.doc.update({ command: u.command });
      // Re-sync concluído: carimba a versão atual para que o próximo login pule o trabalho.
      await game.settings.set("shift-vtt", "macrosSeededVersion", game.system.version);
      console.log(`shift-vtt | Macros: ${toCreate.length} criada(s), ${toUpdate.length} re-sincronizada(s) em ${pack.collection}`);
    });
  } catch (err) {
    console.error("shift-vtt | Macro seeding failed", err);
  }
}

/**
 * Coloca os packs de compêndio embutidos ("SHIFT Traits" + "SHIFT Macros") em um
 * único folder colorido "SHIFT VTT" na sidebar de Compêndios (rosa do sistema).
 *
 * Esta é a ÚNICA fonte da verdade para o folder: o manifesto NÃO declara mais
 * `packFolders` (que duplicava o folder ao competir com este passo). Idempotente e
 * auto-corretivo: adota qualquer folder "SHIFT VTT" existente, consolida nele os
 * nossos packs, aposenta o antigo sub-folder "Items" e REMOVE folders "SHIFT VTT"
 * duplicados que ficaram vazios. Um pack que o GM arquivou de propósito em outro
 * folder fica intocado.
 */
export async function ensureCompendiumFolder() {
  const ourPacks = ["shift-vtt.shift-traits", "shift-vtt.shift-macros"]
    .map(id => game.packs.get(id)).filter(Boolean);
  if (!ourPacks.length) return;

  const PINK = "#ff5fa2";
  try {
    // 1) TODOS os folders de topo "SHIFT VTT" (duplicatas podem existir de builds
    //    que também declaravam packFolders); o primeiro vira o canônico.
    const roots = game.folders.filter(f => f.type === "Compendium" && !f.folder && f.name === "SHIFT VTT");
    let root = roots[0];
    if (!root) {
      [root] = await Folder.createDocuments([
        { name: "SHIFT VTT", type: "Compendium", color: PINK, sorting: "a" }
      ]);
    } else if ((root.color?.css ?? root.color) !== PINK) {
      try { await root.update({ color: PINK }); } catch (e) { /* noop */ }
    }

    // 2) Aposenta o sub-folder "Items" legado: re-arquiva seus packs sob o root e o apaga.
    const items = game.folders.find(f => f.type === "Compendium" && f.folder?.id === root.id && f.name === "Items");
    if (items) {
      for (const p of game.packs) {
        if (p.config?.folder === items.id) { try { await p.setFolder(root); } catch (e) { /* noop */ } }
      }
      try { await items.delete(); } catch (e) { /* noop */ }
    }

    // 3) Arquiva nossos packs sob o root quando estão sem folder, apontam para um
    //    folder inexistente, ou estão presos num "SHIFT VTT" duplicado. Um pack que
    //    o GM arquivou de propósito em outro folder fica intocado.
    const rootIds = new Set(roots.map(f => f.id));
    for (const pack of ourPacks) {
      const cur = pack.config?.folder;
      if (!cur || !game.folders.get(cur) || (rootIds.has(cur) && cur !== root.id)) {
        try { await pack.setFolder(root); } catch (e) { /* noop */ }
      }
    }

    // 4) Remove os folders "SHIFT VTT" duplicados agora vazios.
    for (const dup of roots.slice(1)) {
      const hasPacks = game.packs.some(p => p.config?.folder === dup.id);
      const hasSubs = game.folders.some(f => f.folder?.id === dup.id);
      if (!hasPacks && !hasSubs) { try { await dup.delete(); } catch (e) { /* noop */ } }
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

  // Lê só o índice (com system.category + folder) em vez de hidratar cada Item: o
  // fast-path "needsWork" e o arquivamento precisam apenas de _id, categoria e id da
  // pasta atual de cada entrada. Evita instanciar N documentos a cada ready do GM.
  const index = await pack.getIndex({ fields: ["system.category", "folder"] });
  // Folders de categoria existentes no pack, indexados por categoria (nunca duplicados).
  const byCat = new Map();
  for (const f of pack.folders.contents) {
    const cat = folderCat(f);
    if (cat && !byCat.has(cat)) byCat.set(cat, f);
  }

  // Categorias presentes entre as entradas que ainda não têm folder.
  const missing = new Set();
  for (const e of index) {
    const cat = e.system?.category;
    if (cat && cats[cat] && !byCat.has(cat)) missing.add(cat);
  }

  // Nada a criar e tudo já arquivado → no-op barato (sem destravar). No índice,
  // e.folder já é o id da pasta atual (string) ou null.
  const needsWork = missing.size || index.some(e => {
    const cat = e.system?.category;
    const folder = cat && cats[cat] && byCat.get(cat);
    return folder && e.folder !== folder.id;
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

      // 2) Arquiva cada entrada categorizada sob seu folder (apenas quando ela se move),
      //    montando os updates direto do índice (sem hidratar os Items).
      const updates = [];
      for (const e of index) {
        const cat = e.system?.category;
        const folder = cat && cats[cat] ? byCat.get(cat) : null;
        if (folder && e.folder !== folder.id) updates.push({ _id: e._id, folder: folder.id });
      }
      if (updates.length) await Item.updateDocuments(updates, { pack: pack.collection });

      console.log(`shift-vtt | Organised SHIFT Traits: +${missing.size} folder(s), ${updates.length} entr(ies) filed`);
    });
  } catch (err) {
    console.error("shift-vtt | Organising the Traits compendium failed", err);
  }
}

/**
 * Migração one-time: converte as Quests LEGADAS (Items `type:"trait"` com
 * `category:"quest"`) para o novo tipo de Item `quest`. Mudar o tipo de um
 * documento exige recriação, então cada legado é RECRIADO como quest e o antigo
 * é APAGADO, preservando nome/img/sort + clock (maxDie/currentDie/exhausted),
 * rollable/autoShiftOnRoll, revealed e descrição. `outcome` e `links` nascem no
 * default do modelo. Idempotente e protegida pelo flag de mundo
 * `questTypeMigrated`; roda uma vez, só para o GM, a partir do `ready`.
 */
export async function migrateQuestType() {
  if (game.settings.get("shift-vtt", "questTypeMigrated")) return;

  const isLegacyQuest = i => i.type === "trait" && i.system?.category === "quest";
  const toQuestData = old => ({
    name: old.name,
    type: "quest",
    img: old.img,
    sort: old.sort ?? 0,
    // Marca a origem: torna a migração IDEMPOTENTE mesmo se um delete falhar no
    // meio (um re-run não recria nada que já tenha uma quest com este fromTrait).
    flags: foundry.utils.mergeObject(foundry.utils.deepClone(old.flags ?? {}), { "shift-vtt": { fromTrait: old.id } }),
    system: {
      description: old.system?.description ?? "",
      source: old.system?.source ?? "",
      maxDie: old.system?.maxDie ?? "d6",
      currentDie: old.system?.currentDie ?? "d6",
      exhausted: !!old.system?.exhausted,
      rollable: old.system?.rollable ?? true,
      autoShiftOnRoll: old.system?.autoShiftOnRoll ?? true,
      revealed: old.system?.revealed ?? true
    }
  });

  /** Converte uma coleção: cria só os legados ainda SEM quest-equivalente (pelo
   *  flag fromTrait), depois apaga TODOS os legados (recriados agora ou numa
   *  tentativa anterior). Assim um retry após falha parcial converge sem duplicar. */
  const convert = async (legacy, existingQuests, create, del) => {
    if (!legacy.length) return 0;
    const done = new Set(existingQuests.map(q => q.getFlag("shift-vtt", "fromTrait")).filter(Boolean));
    const fresh = legacy.filter(t => !done.has(t.id));
    if (fresh.length) await create(fresh.map(toQuestData));
    await del(legacy.map(i => i.id));
    return fresh.length;
  };

  let converted = 0;
  try {
    // Items de mundo.
    converted += await convert(
      game.items.filter(isLegacyQuest),
      game.items.filter(i => i.type === "quest"),
      data => Item.createDocuments(data),
      ids => Item.deleteDocuments(ids)
    );
    // Items embutidos em cada Actor (as Quests normalmente vivem numa Party).
    for (const actor of game.actors) {
      converted += await convert(
        actor.items.filter(isLegacyQuest),
        actor.items.filter(i => i.type === "quest"),
        data => actor.createEmbeddedDocuments("Item", data),
        ids => actor.deleteEmbeddedDocuments("Item", ids)
      );
    }
    await game.settings.set("shift-vtt", "questTypeMigrated", true);
    if (converted) console.log(`shift-vtt | Migrated ${converted} legacy quest(s) from Trait to the Quest item type.`);
  } catch (err) {
    // Não seta o flag → tenta de novo no próximo load (idempotente pelo fromTrait).
    console.error("shift-vtt | Quest type migration failed", err);
    ui.notifications?.error(game.i18n.localize("SHIFT.Migration.QuestFailed"));
  }
}

/**
 * Habilita Transform on Exhaust nas Attitude Traits que já existiam antes desta feature
 * (mundos atualizados), pra elas também ganharem o reset a D4 com nova identidade.
 * CONSERVADORA: só liga o transform (não mexe em nome/keywords/features de Attitudes
 * existentes, pra não quebrar setups que usavam a keyword como identidade). One-time por
 * flag, idempotente. Toca apenas Traits de mundo e embutidos em Actors; compêndios de
 * terceiros não são alterados (e Attitudes importadas de lá pegam o default no _preCreate).
 */
export async function migrateAttitudeTransform() {
  if (game.settings.get("shift-vtt", "attitudeTransformMigrated")) return;

  const needs = i => i.type === "trait" && i.system?.category === "attitude" && !i.system?.transform?.enabled;
  const dataFor = i => ({
    _id: i.id,
    "system.transform.enabled": true,
    "system.transform.resetDie": i.system?.maxDie || "d4"
  });

  let migrated = 0;
  try {
    const worldTraits = game.items.filter(needs);
    if (worldTraits.length) {
      await Item.updateDocuments(worldTraits.map(dataFor));
      migrated += worldTraits.length;
    }
    for (const actor of game.actors) {
      const traits = actor.items.filter(needs);
      if (traits.length) {
        await actor.updateEmbeddedDocuments("Item", traits.map(dataFor));
        migrated += traits.length;
      }
    }
    await game.settings.set("shift-vtt", "attitudeTransformMigrated", true);
    if (migrated) console.log(`shift-vtt | Enabled Transform on ${migrated} existing Attitude trait(s).`);
  } catch (err) {
    // Sem setar o flag → re-tenta no próximo load (idempotente: já-habilitadas são puladas).
    console.error("shift-vtt | Attitude transform migration failed", err);
  }
}

/**
 * Migração one-time: apaga o campo morto `system.features` das Traits. A opção de
 * customizar "esta Trait usa Keywords / usa Drawbacks" foi descontinuada — toda Trait
 * passa a ter ambos (eles só aparecem na ficha quando preenchidos). O dado antigo
 * vira lixo no source do documento, então esta migração o remove com a sintaxe `-=`.
 * CONSERVADORA: só apaga `features`, não toca em mais nada. One-time por flag,
 * idempotente (Traits já limpas são puladas). Toca apenas Traits de mundo e embutidas
 * em Actors; o source extra em compêndios de terceiros é inofensivo e fica intocado.
 */
export async function migrateTraitFeatures() {
  if (game.settings.get("shift-vtt", "traitFeaturesRemoved")) return;

  const needs = i => i.type === "trait" && foundry.utils.hasProperty(i._source, "system.features");
  const dataFor = i => ({ _id: i.id, "system.-=features": null });

  let migrated = 0;
  try {
    const worldTraits = game.items.filter(needs);
    if (worldTraits.length) {
      await Item.updateDocuments(worldTraits.map(dataFor));
      migrated += worldTraits.length;
    }
    for (const actor of game.actors) {
      const traits = actor.items.filter(needs);
      if (traits.length) {
        await actor.updateEmbeddedDocuments("Item", traits.map(dataFor));
        migrated += traits.length;
      }
    }
    await game.settings.set("shift-vtt", "traitFeaturesRemoved", true);
    if (migrated) console.log(`shift-vtt | Removed legacy system.features from ${migrated} trait(s).`);
  } catch (err) {
    // Sem setar o flag → re-tenta no próximo load (idempotente: já-limpas são puladas).
    console.error("shift-vtt | Trait features removal migration failed", err);
  }
}

/**
 * Migração one-time: re-aloja a GM Note legada do Codex. Cada entrada de Codex tinha uma
 * nota por-entrada (system.codex[i].note, no Actor Party); a GM Note agora mora em
 * system.gmNote do Actor/Item REFERENCIADO (sincronizada com a ficha dele). Esta migração
 * copia a nota legada para o gmNote do documento referenciado, SEM sobrescrever uma nota já
 * escrita lá. Uma entrada que aponta para um Character (sem campo gmNote) não tem destino: a
 * nota fica preservada na própria entrada do Codex e logamos um aviso para o GM recuperar à
 * mão — nunca é descartada calada. One-time por flag, idempotente (gmNote já preenchido é
 * pulado, e a nota legada nunca é apagada). O campo legado `note` segue no schema do Codex só
 * para esta leitura ser garantida; some num release futuro.
 */
export async function migrateCodexNote() {
  if (game.settings.get("shift-vtt", "codexNoteMigrated")) return;
  const hasText = html => !!html && html.replace(/<[^>]*>/g, "").trim().length > 0;

  let moved = 0, orphaned = 0;
  try {
    for (const party of game.actors) {
      if (party.type !== "party") continue;
      for (const e of party.system.codex ?? []) {
        if (!hasText(e.note)) continue;
        const doc = await fromUuid(e.uuid);
        if (!doc) continue;                            // referência morta: deixa a nota onde está
        if (doc.pack) {                                // doc de compêndio: pack travado, não dá pra gravar
          orphaned++;
          console.warn(`shift-vtt | Codex GM note for "${doc.name}" lives in a locked compendium; left on the codex entry for manual recovery.`);
          continue;
        }
        if (doc.system?.gmNote === undefined) {        // Character/Party não têm gmNote
          orphaned++;
          console.warn(`shift-vtt | Codex GM note for "${doc.name}" (${doc.type}) has no gmNote field; left on the codex entry for manual recovery.`);
          continue;
        }
        if (hasText(doc.system.gmNote)) continue;      // não sobrescreve uma nota já escrita no Actor/Item
        await doc.update({ "system.gmNote": e.note });
        moved++;
      }
    }
    await game.settings.set("shift-vtt", "codexNoteMigrated", true);
    if (moved || orphaned) console.log(`shift-vtt | Codex GM notes: ${moved} moved to gmNote, ${orphaned} left in place (no target field).`);
  } catch (err) {
    // Sem setar o flag → re-tenta no próximo load (idempotente: gmNote já preenchido é pulado).
    console.error("shift-vtt | Codex note migration failed", err);
  }
}
