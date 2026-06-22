/**
 * SHIFT VTT — Automação do Party: deploy/recall dos Tokens dos membros e os
 * hooks que ligam o Actor de grupo ao canvas e à barra lateral de Actors.
 *
 * Fiel ao "clown car" do Pathfinder 2e: solte o Actor do party no canvas para
 * colocar um único Token de PARTY, depois use o toggle de deploy/recall no HUD
 * desse Token para espalhar os membros ao redor dele (deploy) ou reuni-los de
 * volta (recall). O mesmo toggle alterna conforme os membros já estejam ou não
 * em deploy.
 *
 * O override da barra lateral de Actors (CONFIG.ui.actors = ShiftActorDirectory)
 * é ligado diretamente em shift.mjs; este módulo cuida do HUD do Token, dos
 * hooks de limpeza e dos helpers de deploy/recall.
 */

const L = (k, data) => (data ? game.i18n.format(k, data) : game.i18n.localize(k));

/* ------------------------------------------------------------------ */
/* Registration                                                        */
/* ------------------------------------------------------------------ */

/** Liga os hooks de runtime. Chame no `init` (após settings/handlebars prontos). */
export function registerParty() {
  // Override por usuário do "party ativo" (escopo client; normalmente derivado, ver abaixo).
  game.settings.register("shift-vtt", "activePartyId", {
    scope: "client", config: false, type: String, default: ""
  });

  // Hotkeys: P abre o party ativo/óbvio; Ctrl+P o define.
  game.keybindings.register("shift-vtt", "openParty", {
    name: "SHIFT.Party.Keybind.Open", hint: "SHIFT.Party.Keybind.OpenHint",
    editable: [{ key: "KeyP" }],
    onDown: () => { openActiveParty(); return true; }
  });
  game.keybindings.register("shift-vtt", "setActiveParty", {
    name: "SHIFT.Party.Keybind.SetActive", hint: "SHIFT.Party.Keybind.SetActiveHint",
    editable: [{ key: "KeyP", modifiers: ["Control"] }],
    onDown: () => { promptSetActiveParty(true); return true; }
  });

  // Botão nos controles de cena (abaixo da ferramenta de Global Traits / Clocks).
  Hooks.on("getSceneControlButtons", controls => {
    if (!controls?.tokens?.tools) return;
    controls.tokens.tools["shift-party"] = {
      name: "shift-party", title: "SHIFT.Party.SceneControl",
      icon: "fa-solid fa-people-group", button: true, order: 100,
      onChange: () => openActiveParty()
    };
  });

  // Adiciona um toggle de deploy/recall ao HUD do Token de party (estilo PF2e).
  Hooks.on("renderTokenHUD", onRenderTokenHUD);

  // Atualização ao vivo das Field Notes compartilhadas do Codex: quando uma
  // página no Journal do Codex de um party muda (um Player ou o GM salvou uma
  // nota), repinta a parte do Codex de toda sheet aberta daquele party, EXCETO
  // num client que esteja editando no momento num editor de field-notes (não
  // arranque o texto debaixo de quem está digitando).
  Hooks.on("updateJournalEntryPage", (page, changed) => {
    if (!foundry.utils.hasProperty(changed ?? {}, "text.content")) return;
    const journalUuid = page.parent?.uuid;
    if (!journalUuid) return;
    for (const actor of game.actors) {
      if (actor.type !== "party" || actor.system.codexJournal !== journalUuid) continue;
      for (const app of Object.values(actor.apps ?? {})) {
        const editing = app.element?.querySelector?.(
          ".codex-fieldnotes .editor-container, .codex-fieldnotes [contenteditable='true']");
        if (editing) continue;
        app.render?.({ parts: ["codex"] });
      }
    }
  });

  // Sincronia ao vivo da GM Note / Description no Codex: ambas vivem na ficha do
  // próprio Actor (system.gmNote / system.description) e são espelhadas no detalhe
  // do Codex. Quando um Actor muda uma delas, repinta o Codex de toda sheet de party
  // aberta cujo detalhe esteja mostrando ESSE Actor — pulando um client que esteja
  // editando a nota ali (não arranca o texto debaixo de quem digita).
  Hooks.on("updateActor", (actor, changed) => {
    const sys = changed?.system ?? {};
    if (!("gmNote" in sys) && !("description" in sys)) return;
    for (const party of game.actors) {
      if (party.type !== "party") continue;
      if (!(party.system.codex ?? []).some(e => e.uuid === actor.uuid)) continue;
      for (const app of Object.values(party.apps ?? {})) {
        if (app._codexOpen !== actor.uuid) continue;     // só o detalhe aberto importa
        const editing = app.element?.querySelector?.(
          ".codex-fieldnotes [contenteditable='true'], textarea.cd-gmnote-edit:focus");
        if (editing) continue;
        app.render?.({ parts: ["codex"] });
      }
    }
  });

  // Mesma sincronia para Items catalogados (trait/technique/landmark): Description e
  // GM Note saem do próprio Item, então editar a ficha dele repinta o detalhe do Codex
  // que o esteja mostrando. Sem pré-filtro por system.codex: um landmark VIRTUAL (de
  // uma Location) não tem entrada própria no codex, mas seu detalhe abre por uuid — o
  // teste app._codexOpen === item.uuid já é preciso. Pula quem está digitando ali.
  Hooks.on("updateItem", (item, changed) => {
    const sys = changed?.system ?? {};
    if (!("gmNote" in sys) && !("description" in sys)) return;
    const uuid = item?.uuid;
    if (!uuid) return;
    for (const party of game.actors) {
      if (party.type !== "party") continue;
      for (const app of Object.values(party.apps ?? {})) {
        if (app._codexOpen !== uuid) continue;
        const editing = app.element?.querySelector?.(
          ".codex-fieldnotes [contenteditable='true'], textarea.cd-gmnote-edit:focus");
        if (editing) continue;
        app.render?.({ parts: ["codex"] });
      }
    }
  });

  // Aninhamento de Locations: quando uma Location muda estruturalmente (safe,
  // children, scale, nome, img), repinta as fichas que a EXIBEM por referência — a(s)
  // Location(s)-mãe (aba Landmarks) e qualquer Party que a tenha no codex/location. A
  // própria ficha dela o Foundry já repinta. Pula quem digita numa nota do codex.
  Hooks.on("updateActor", (actor, changed) => {
    if (actor.type !== "location") return;
    const sys = changed?.system ?? {};
    const structural = ("safe" in sys) || ("children" in sys) || ("scale" in sys)
      || ("name" in (changed ?? {})) || ("img" in (changed ?? {}));
    if (!structural) return;
    for (const a of game.actors) {
      if (a.type === "location" && (a.system.children ?? []).includes(actor.uuid)) {
        for (const app of Object.values(a.apps ?? {})) app.render?.(false);
      } else if (a.type === "party"
          && ((a.system.codex ?? []).some(e => e.uuid === actor.uuid) || a.system.location === actor.uuid)) {
        for (const app of Object.values(a.apps ?? {})) {
          const editing = app.element?.querySelector?.(
            ".codex-fieldnotes [contenteditable='true'], textarea.cd-gmnote-edit:focus");
          if (!editing) app.render?.({ parts: ["codex", "header"] });
        }
      }
    }
  });

  // Remove Actors deletados do Roster de cada party. O hook dispara em TODO
  // client, então restringe a escrita ao único GM ativo (espelha o idioma de
  // escritor-único em session.mjs / socket.mjs) para evitar updates concorrentes
  // redundantes quando há mais de um GM conectado.
  Hooks.on("deleteActor", actor => {
    if (!game.user.isGM || actor.type === "party") return;
    const activeGM = game.users?.activeGM;
    if (activeGM && activeGM.id !== game.user.id) return;
    for (const party of game.actors) {
      if (party.type === "party" && (party.system.members ?? []).includes(actor.uuid)) {
        party.removePartyMembers(actor.uuid);
      }
      // Location-filha deletada: tira o uuid órfão dos children da(s) mãe(s).
      if (party.type === "location" && (party.system.children ?? []).includes(actor.uuid)) {
        party.update({ "system.children": (party.system.children ?? []).filter(u => u !== actor.uuid) });
      }
    }
  });
}

/* ------------------------------------------------------------------ */
/* Active party + hotkeys                                              */
/* ------------------------------------------------------------------ */

/** Party Actors visíveis que listam `actor` (por uuid) como membro. */
function partiesWithMember(actor) {
  if (!actor) return [];
  return game.actors.filter(p =>
    p.type === "party" && p.visible && (p.system.members ?? []).includes(actor.uuid));
}

/** Todos os party Actors que o usuário atual consegue ver. */
function visibleParties() {
  return game.actors.filter(p => p.type === "party" && p.visible);
}

/**
 * Melhor palpite do party "ativo" para o usuário atual, em ordem de prioridade:
 *   1. o (único) party que contém o personagem atribuído ao usuário,
 *   2. um override explícito definido no client (`activePartyId`),
 *   3. o único party visível, se houver exatamente um.
 * Retorna null quando a escolha é ambígua (o caller deve perguntar).
 */
export function resolveActiveParty() {
  const own = partiesWithMember(game.user?.character);
  if (own.length === 1) return own[0];

  const setId = game.settings.get("shift-vtt", "activePartyId");
  const set = setId ? game.actors.get(setId) : null;
  if (set?.type === "party" && set.visible) return set;

  const all = visibleParties();
  if (all.length === 1) return all[0];
  return null;
}

/** Abre a sheet do party ativo, ou pergunta para escolher quando não é óbvio. */
function openActiveParty() {
  const party = resolveActiveParty();
  if (party) return void party.sheet.render(true);
  return promptSetActiveParty(true);
}

/**
 * Pede ao usuário para escolher (e lembrar) o party ativo. Com um único party a
 * escolha é feita automaticamente. `open` também renderiza a sheet escolhida.
 */
async function promptSetActiveParty(open = false) {
  const parties = visibleParties();
  if (!parties.length) return void ui.notifications.info(L("SHIFT.Party.NoParties"));
  if (parties.length === 1) {
    await game.settings.set("shift-vtt", "activePartyId", parties[0].id);
    if (open) parties[0].sheet.render(true);
    return;
  }

  const current = game.settings.get("shift-vtt", "activePartyId");
  const esc = foundry.utils.escapeHTML;
  const options = parties.map(p =>
    `<option value="${p.id}"${p.id === current ? " selected" : ""}>${esc(p.name)}</option>`).join("");
  const content =
    `<div class="shift-dialog-body"><div class="form-group">` +
    `<label>${L("SHIFT.Party.ActiveParty")}</label>` +
    `<select name="party" autofocus>${options}</select></div></div>`;

  let id;
  try {
    id = await foundry.applications.api.DialogV2.prompt({
      window: { title: L("SHIFT.Party.SetActive"), icon: "fa-solid fa-people-group" },
      classes: ["shift-vtt", "shift-dialog"],
      content, rejectClose: false,
      ok: { label: L("SHIFT.Common.Confirm"), callback: (_e, btn) => btn.form.elements.party.value }
    });
  } catch (_err) { return; }
  if (!id) return;

  // Revalida: o party escolhido pode ter sido deletado enquanto o prompt estava aberto.
  const party = game.actors.get(id);
  if (party?.type !== "party" || !party.visible) {
    return void ui.notifications.warn(L("SHIFT.Party.NoParties"));
  }
  await game.settings.set("shift-vtt", "activePartyId", id);
  if (open) party.sheet.render(true);
}

/* ------------------------------------------------------------------ */
/* Token HUD button                                                    */
/* ------------------------------------------------------------------ */

/** Injeta o controle de deploy/recall no HUD do Token de party (estilo clown-car). */
function onRenderTokenHUD(hud, html) {
  const token = hud.document;
  const party = token?.actor;
  if (party?.type !== "party") return;
  if (!game.user.can("TOKEN_CREATE")) return; // só quem pode colocar Tokens

  const root = html instanceof HTMLElement ? html : html?.[0];
  const col = root?.querySelector(".col.left");
  if (!col || col.querySelector(".shift-party-hud")) return; // evita re-append

  const deployed = membersOnScene(party, token.scene ?? canvas.scene).length > 0;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "control-icon shift-party-hud";
  btn.dataset.tooltip = L(deployed ? "SHIFT.Party.RecallHint" : "SHIFT.Party.DeployHint");
  btn.setAttribute("aria-label", L(deployed ? "SHIFT.Party.Recall" : "SHIFT.Party.Deploy"));
  btn.innerHTML = `<i class="fa-solid ${deployed
    ? "fa-down-left-and-up-right-to-center"
    : "fa-people-arrows"}" inert></i>`;
  btn.addEventListener("click", async ev => {
    ev.preventDefault();
    ev.stopPropagation();
    btn.disabled = true;
    try { await togglePartyTokens(token); }
    finally { if (hud.element?.isConnected) hud.render(); }
  });
  col.appendChild(btn);
}

/** Tokens dos membros atualmente numa cena (casados pelo id do Actor base → linked + unlinked). */
function membersOnScene(party, scene) {
  if (!scene) return [];
  const ids = new Set(party.partyMembers.map(m => m.id));
  return scene.tokens.filter(t => t.actorId && ids.has(t.actorId));
}

/**
 * Alterna os membros de um party na cena: deploy se nenhum estiver presente,
 * recall se houver algum. Ancorado no Token do party.
 * @param {TokenDocument} partyToken
 */
async function togglePartyTokens(partyToken) {
  const party = partyToken?.actor;
  if (party?.type !== "party") return;
  const scene = partyToken.scene ?? canvas?.scene;
  if (membersOnScene(party, scene).length > 0) return recallParty(party, scene);
  return deployParty(party, { token: partyToken });
}

/* ------------------------------------------------------------------ */
/* Deploy / Recall                                                     */
/* ------------------------------------------------------------------ */

/**
 * Cria um Token para cada membro do party, dispostos numa formação compacta em
 * grid centrada numa âncora: o Token do party (preferido), um ponto explícito,
 * ou o centro da visão atual.
 * @param {ShiftActor} party
 * @param {{x?:number, y?:number, token?:TokenDocument}} [anchor]
 */
async function deployParty(party, { x, y, token } = {}) {
  if (party?.type !== "party") return;
  const scene = token?.scene ?? canvas?.scene;
  if (!scene || !canvas.ready) return void ui.notifications.warn(L("SHIFT.Party.NoScene"));
  // Espelha o gate de token-drop do core (TOKEN_CREATE + ownership por Actor
  // abaixo), não o ownership da cena, para que um GM em qualquer cena (e um
  // Player com permissão adequada) possa fazer deploy.
  if (!game.user.can("TOKEN_CREATE")) {
    return void ui.notifications.warn(L("SHIFT.Party.NoPermission"));
  }
  const members = party.partyMembers;
  if (!members.length) return void ui.notifications.warn(L("SHIFT.Party.NoMembers"));

  // Âncora: o centro do Token do party, senão um ponto explícito, senão o centro da visão.
  if (token?.object?.center) {
    ({ x, y } = token.object.center);
  } else if (Number.isFinite(token?.x) && Number.isFinite(token?.y)) {
    const gs = canvas.grid.size;
    x = token.x + (token.width ?? 1) * gs / 2;
    y = token.y + (token.height ?? 1) * gs / 2;
  } else if (!Number.isFinite(x) || !Number.isFinite(y)) {
    const pivot = canvas.stage?.pivot;
    x = pivot?.x ?? (canvas.dimensions.sceneX + canvas.dimensions.sceneWidth / 2);
    y = pivot?.y ?? (canvas.dimensions.sceneY + canvas.dimensions.sceneHeight / 2);
  }

  const centers = formationCenters(x, y, members.length);
  const tokensData = [];
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (!member.isOwner) continue; // não dá pra criar Token de um Actor que você não possui
    const td = await member.getTokenDocument({}, { parent: scene });
    // Converte o centro de cada slot → canto superior-esquerdo encaixado usando
    // o tamanho do próprio Token do membro (o helper do core cuida do pivot
    // ciente do tamanho + encaixe no grid).
    const pos = CONFIG.Token.objectClass._getDropActorPosition(td, centers[i], { snap: true });
    const obj = td.toObject();
    obj.x = pos.x;
    obj.y = pos.y;
    tokensData.push(obj);
  }
  if (!tokensData.length) return void ui.notifications.warn(L("SHIFT.Party.NoPermission"));

  const created = await scene.createEmbeddedDocuments("Token", tokensData);
  canvas.tokens?.activate?.();
  ui.notifications.info(L("SHIFT.Party.Deployed", { count: created.length, party: party.name }));
}

/**
 * Remove os Tokens dos membros do party da cena atual (o inverso de
 * {@link deployParty}). Os membros são casados pelo id do Actor base, então
 * tanto Tokens linked quanto unlinked-da-mesma-base são reunidos.
 * @param {ShiftActor} party
 */
async function recallParty(party, scene = canvas?.scene) {
  if (party?.type !== "party") return;
  if (!scene || !canvas.ready) return void ui.notifications.warn(L("SHIFT.Party.NoScene"));

  const memberIds = new Set(party.partyMembers.map(m => m.id));
  // Reúne apenas os Tokens que este usuário realmente pode deletar (GMs: todos).
  const ids = scene.tokens
    .filter(t => t.actorId && memberIds.has(t.actorId) && t.canUserModify(game.user, "delete"))
    .map(t => t.id);
  if (!ids.length) return void ui.notifications.info(L("SHIFT.Party.NothingToRecall"));

  await scene.deleteEmbeddedDocuments("Token", ids);
  ui.notifications.info(L("SHIFT.Party.Recalled", { count: ids.length, party: party.name }));
}

/* ------------------------------------------------------------------ */
/* Formation                                                           */
/* ------------------------------------------------------------------ */

/**
 * CENTROS de slot contínuos para N Tokens num bloco quadrado centrado na âncora.
 * Os centros ficam espaçados em uma célula de grid e ladeiam a âncora de forma
 * uniforme (incluindo contagens pares). Cada membro é então posicionado pelo
 * caller a partir do seu próprio pivot ciente do tamanho, de modo que o
 * espaçamento fica consistente independente do tamanho do Token.
 * @returns {{x:number,y:number}[]}
 */
function formationCenters(cx, cy, n) {
  const gs = canvas.grid.size;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const out = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    out.push({
      x: cx + (col - (cols - 1) / 2) * gs,
      y: cy + (row - (rows - 1) / 2) * gs
    });
  }
  return out;
}
