/**
 * Restringe o seletor de personagem ativo da User Configuration do core.
 *
 * Nativamente o Foundry lista no `<select name="character">` todo Actor que o
 * usuário pode *controlar ou observar* (OWNER ou OBSERVER). Isso permite marcar
 * como personagem ativo um Actor que o jogador só observa — e que, pelas regras
 * de permissão do SHIFT, ele não conseguiria rolar nem editar. Aqui removemos as
 * opções em que o usuário-alvo não é OWNER, de modo que só personagens de fato
 * controláveis possam virar o ativo.
 */
function restrictCharacterOptions(app, html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;

  // O usuário sendo configurado (não o que abriu o diálogo): o GM editando a
  // config de um jogador deve ver apenas os Actors que *aquele jogador* possui.
  const user = app.document ?? app.object;
  if (!user) return;

  const select = root.querySelector('select[name="character"]');
  if (!select) return;

  const currentId = user.character?.id ?? null;
  for (const opt of [...select.options]) {
    if (!opt.value) continue;              // mantém a opção "nenhum"
    if (opt.value === currentId) continue; // não remove o já atribuído (evita troca silenciosa)
    const actor = game.actors.get(opt.value);
    if (actor && !actor.testUserPermission(user, "OWNER")) opt.remove();
  }

  // O core agrupa os atores por nível de permissão em <optgroup> ("Observer",
  // "Owner"). Esvaziar um grupo deixa seu rótulo órfão no menu, então removemos
  // qualquer grupo que tenha ficado sem opções.
  for (const group of select.querySelectorAll("optgroup")) {
    if (!group.querySelector("option")) group.remove();
  }
}

export function registerUserConfig() {
  Hooks.on("renderUserConfig", restrictCharacterOptions);
}
