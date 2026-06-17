/**
 * SHIFT VTT, diretório da barra lateral de Actors que renderiza cada Party Actor como
 * um grupo parecido com uma pasta fixado no topo, fiel ao diretório de party do
 * Pathfinder 2e no v14.
 *
 * Arquitetura (verificada contra o core do Foundry V14 + PF2e v14-dev):
 *  - Um PART `parties` dedicado renderiza o(s) grupo(s); em `_onRender` ele é
 *    realocado para o topo da `.directory-list` viva para ficar acima de todas
 *    as pastas reais e ser coberto pela única ligação de DragDrop do core.
 *  - Recolher/expandir reaproveita a action `toggleFolder` do core e o mapa
 *    `game.folders._expanded[uuid]` (UUIDs de party nunca colidem com UUIDs de
 *    pasta reais), então nenhum estado próprio é necessário.
 *  - Edições de membros são chamadas diretas ao documento da party
 *    (`addPartyMembers` / `removePartyMembers`); o diretório apenas roteia os
 *    drops e os cliques de menu de contexto para elas.
 */
import { fvtt } from "../helpers/utils.mjs";

const { ActorDirectory } = foundry.applications.sidebar.tabs;

export class ShiftActorDirectory extends ActorDirectory {

  /** @override, também re-renderiza o grupo da party quando a lista de membros muda.
   *  (Opções de array são CONCATENADAS com as do pai, então liste apenas a
   *  chave adicional; `actions` é mesclado em profundidade para as actions do core sobreviverem.) */
  static DEFAULT_OPTIONS = {
    renderUpdateKeys: ["system.members"],
    actions: {
      openPartySheet: ShiftActorDirectory.#onOpenPartySheet
    }
  };

  /** @override, anexa um part `parties` ao header/directory/footer herdado. */
  static PARTS = (() => {
    const parts = { ...super.PARTS };
    parts.parties = { template: "systems/shift-vtt/templates/sidebar/party-folders.hbs" };
    return parts;
  })();

  /* ---------------------------------------------------------------- */
  /* Context                                                           */
  /* ---------------------------------------------------------------- */

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    if (partId === "parties") {
      const parties = game.actors
        .filter(a => a.type === "party" && a.visible)
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name));
      context.parties = parties.map(p => this.#partyContext(p));
    }
    return context;
  }

  /** @override, faz a party se comportar como uma pasta REAL: remove tanto os
   *  Party Actors (renderizados como grupos de pasta no part `parties`) quanto seus
   *  membros da árvore de diretório normal, para que um membro apareça SOMENTE sob sua
   *  party, nunca duplicado na raiz. Os membros reaparecem na raiz no momento em que saem
   *  da party. A árvore é clonada de forma rasa para que o `collection.tree` em cache
   *  nunca seja mutado. */
  async _prepareDirectoryContext(context, options) {
    await super._prepareDirectoryContext(context, options);
    const hidden = new Set();
    for (const actor of game.actors) {
      if (actor.type !== "party") continue;
      hidden.add(actor.uuid);
      for (const uuid of actor.system.members ?? []) hidden.add(uuid);
    }
    context.tree = hidden.size ? this.#pruneTree(context.tree, hidden) : context.tree;
  }

  #pruneTree(node, hidden) {
    return {
      ...node,
      entries: (node.entries ?? []).filter(e => !hidden.has(e.uuid)),
      children: (node.children ?? []).map(child => this.#pruneTree(child, hidden))
    };
  }

  #partyContext(party) {
    return {
      id: party.id,
      uuid: party.uuid,
      name: party.name,
      img: party.img,
      expanded: !!game.folders._expanded[party.uuid],
      canModify: party.isOwner,
      members: party.partyMembers.map(m => ({
        id: m.id,
        uuid: m.uuid,
        name: m.name,
        img: m.img
      }))
    };
  }

  /* ---------------------------------------------------------------- */
  /* Rendering                                                         */
  /* ---------------------------------------------------------------- */

  /** @override, mantém `parties` e `directory` em sincronia: renderizar um
   *  sem o outro deixaria o bloco de party realocado órfão (o elemento parties
   *  vive dentro do elemento directory depois de `_onRender`). */
  render(options = {}, _options) {
    if (Array.isArray(options.parts)) {
      const wantsDir = options.parts.includes("directory");
      const wantsParties = options.parts.includes("parties");
      if (wantsDir && !wantsParties) options.parts.push("parties");
      else if (wantsParties && !wantsDir) options.parts.push("directory");
    }
    return super.render(options, _options);
  }

  /** @override, realoca o part parties para o topo da lista de diretório
   *  ANTES de o core ligar o drag/drop, para que as linhas de party + membros sejam cobertas. */
  async _onRender(context, options) {
    if (options.parts.includes("directory") || options.parts.includes("parties")) {
      const partiesPart = this.parts.parties;
      const list = this.parts.directory;
      if (partiesPart && list) {
        partiesPart.remove();
        list.prepend(partiesPart);
      }
    }
    await super._onRender(context, options);
  }

  /* ---------------------------------------------------------------- */
  /* Drag & drop                                                       */
  /* ---------------------------------------------------------------- */

  /** @override, marca o drag de um membro com sua party de origem para que soltá-lo
   *  em outro lugar o remova daquela party. */
  _onDragStart(event) {
    super._onDragStart(event);
    const el = event.currentTarget;
    const fromParty = el.closest("[data-party]")?.dataset.entryId;
    if (fromParty && el.dataset.entryId && el.dataset.entryId !== fromParty) {
      try {
        const data = JSON.parse(event.dataTransfer.getData("text/plain"));
        data.fromParty = fromParty;
        event.dataTransfer.setData("text/plain", JSON.stringify(data));
      } catch (err) { /* deixa o payload do drag intacto */ }
    }
  }

  /** @override, roteia drops de Actor para dentro / para fora de um grupo de party como
   *  edições de membros; delega todo o resto ao core. */
  async _onDrop(event) {
    const data = fvtt.TextEditor.getDragEventData(event);
    if (data?.type !== "Actor") return super._onDrop(event);

    const target = event.target.closest(".directory-item");
    const toParty = game.actors.get(target?.closest("[data-party]")?.dataset.entryId ?? "");
    const fromParty = game.actors.get(data.fromParty ?? "");

    // Não relacionado a party → comportamento normal de diretório (ordenar / pasta / importar).
    if (toParty?.type !== "party" && fromParty?.type !== "party") return super._onDrop(event);

    // Solto sobre um grupo de party → adiciona como membro, realocando-o para fora de
    // qualquer party de origem (um membro vive em uma única party, como numa pasta).
    if (toParty?.type === "party") {
      let actor = await Actor.implementation.fromDropData(data);
      if (!actor) return;
      if (actor.inCompendium) {
        actor = await Actor.implementation.create(game.actors.fromCompendium(actor), { fromCompendium: true });
      }
      if (!actor || actor.type === "party") return;
      if (fromParty?.type === "party" && fromParty.id !== toParty.id) {
        await fromParty.removePartyMembers(data.uuid);
      }
      await toParty.addPartyMembers(actor);
      return;
    }

    // Membro arrastado para fora de sua party (solto em outro lugar) → remove, depois deixa
    // o core posicionar/ordenar como uma linha de Actor normal.
    if (fromParty?.type === "party") await fromParty.removePartyMembers(data.uuid);
    return super._onDrop(event);
  }

  /* ---------------------------------------------------------------- */
  /* Context menus                                                     */
  /* ---------------------------------------------------------------- */

  /** @override, o menu de contexto de pasta deve ligar-se apenas a pastas REAIS; grupos
   *  de party (que carregam `data-entry-id`) usam o menu de entry no lugar. */
  _createContextMenus() {
    this._createContextMenu(this._getFolderContextOptions, ".folder:not([data-party]) > .folder-header", {
      fixed: true,
      hookName: "getFolderContextOptions",
      parentClassHooks: false
    });
    this._createContextMenu(this._getEntryContextOptions, ".directory-item[data-entry-id]", {
      fixed: true,
      hookName: `get${this.documentName}ContextOptions`,
      parentClassHooks: false
    });
  }

  /** @override, adiciona uma entry "Remove from Party" exclusiva de membros. (Deploy/Recall
   *  ficam no HUD do Token da party, no estilo do PF2e, não aqui.) As entries de menu de
   *  contexto do V14 usam `label`/`icon`/`visible`/`onClick(event, li)` com `li` sendo um
   *  HTMLElement cru. */
  _getEntryContextOptions() {
    const options = super._getEntryContextOptions();
    const memberPartyOf = li => {
      if (li.matches("[data-party]")) return null;
      const id = li.closest("[data-party]")?.dataset.entryId;
      return id ? game.actors.get(id) : null;
    };
    options.push({
      label: "SHIFT.Party.RemoveMember",
      icon: '<i class="fa-solid fa-user-minus"></i>',
      visible: li => !!memberPartyOf(li)?.isOwner,
      onClick: (event, li) => {
        const party = memberPartyOf(li);
        const member = game.actors.get(li.dataset.entryId ?? "");
        if (party && member) party.removePartyMembers(member.uuid);
      }
    });
    return options;
  }

  /* ---------------------------------------------------------------- */
  /* Search                                                            */
  /* ---------------------------------------------------------------- */

  /** @override, o core trata o grupo de party como uma pasta real e, por ele
   *  não ter `data-folder-id`, o esconde durante qualquer query. Restaure-o aqui: mostre
   *  o grupo (e auto-expanda) quando um membro corresponde, ou quando o próprio
   *  nome da party corresponde. Sem query, o core já restaurou as pastas corretamente. */
  _onSearchFilter(event, query, rgx, html) {
    super._onSearchFilter(event, query, rgx, html);
    if (!query) return;
    const SearchFilter = foundry.applications.ux.SearchFilter;
    for (const folder of html.querySelectorAll(".shift-parties .directory-item.folder[data-party]")) {
      const memberMatch = [...folder.querySelectorAll(".directory-item.entry")]
        .some(li => li.style.display !== "none");
      const party = game.actors.get(folder.dataset.entryId ?? "");
      const nameMatch = !!party && rgx.test(SearchFilter.cleanQuery(party.name));
      if (memberMatch || nameMatch) {
        folder.style.display = "flex";
        if (memberMatch) folder.classList.add("expanded");
      } else {
        folder.style.display = "none";
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Actions                                                           */
  /* ---------------------------------------------------------------- */

  static #partyFromTarget(target) {
    const id = target.closest("[data-party]")?.dataset.entryId;
    return id ? game.actors.get(id) : null;
  }

  static #onOpenPartySheet(event, target) {
    ShiftActorDirectory.#partyFromTarget(target)?.sheet.render(true);
  }
}
