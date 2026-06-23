/**
 * SHIFT VTT — settings do sistema.
 *
 * Registradas de cima para baixo por público, para a lista nativa de Settings
 * ler de forma limpa: primeiro as regras de GM/mundo (agrupadas por tema), depois
 * as settings de interface por jogador (client/local) que cada um controla para si.
 * As chaves de armazenamento interno (config:false) ficam no fim, escondidas do
 * menu. Settings de mundo são só do GM por padrão do Foundry; settings de client
 * são sempre editáveis pelo jogador a quem pertencem.
 */
import { SHIFT } from "./config.mjs";
import { refreshActionHud } from "./apps/action-hud.mjs";
import { applyStatusEffects } from "./helpers/status-effects.mjs";

export function registerSettings() {
  const reg = (key, data) => game.settings.register("shift-vtt", key, data);

  /* ============================================================
     GM · Regras e rolagens, escopo de mundo (só o GM altera)
     ============================================================ */

  // Rest e Travel são Building Blocks agrupados no submenu "Rest & Travel"
  // (config:false → escondidos da lista plana; ver registerMenu em shift.mjs).
  // Settings config:false ainda disparam onChange no set().
  reg("restMode", {
    name: "SHIFT.Settings.RestMode.Name",
    hint: "SHIFT.Settings.RestMode.Hint",
    scope: "world",
    config: false,
    type: String,
    choices: SHIFT.restModes,
    default: "standard"
  });

  // enableTravel é a chave-mestra de Travel: desligada, o controle de viagem some
  // da ficha de Party. travelMode escolhe o Building Block sem se acoplar ao
  // restMode. travelRandomCore: quando os suprimentos esgotam, escolhe o Core a
  // baixar aleatoriamente (ligado) ou por prompt do player (desligado, = raw).
  reg("enableTravel", {
    name: "SHIFT.Settings.EnableTravel.Name",
    hint: "SHIFT.Settings.EnableTravel.Hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
    // A ficha de Party não é alcançada pelo loop de instâncias se estiver fechada;
    // re-renderiza as ApplicationV2 de Actor vivas para o controle aparecer/sumir.
    onChange: () => {
      for (const app of foundry.applications.instances.values()) {
        if (app.document instanceof Actor) app.render?.();
      }
    }
  });

  reg("travelMode", {
    name: "SHIFT.Settings.TravelMode.Name",
    hint: "SHIFT.Settings.TravelMode.Hint",
    scope: "world",
    config: false,
    type: String,
    choices: SHIFT.travelModes,
    default: "simple"
  });

  reg("travelRandomCore", {
    name: "SHIFT.Settings.TravelRandomCore.Name",
    hint: "SHIFT.Settings.TravelRandomCore.Hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: true
  });

  // Pesos (relativos) da rolagem de Legs por viagem: 4 distribuições SS/US/SU/UU,
  // cada uma [w1..w5]. Editadas no submenu Rest & Travel; vazio/malformado cai nos
  // defaults de fábrica em CONFIG.SHIFT.travelLegWeights.
  reg("travelLegWeights", {
    scope: "world",
    config: false,
    type: Object,
    default: foundry.utils.deepClone(SHIFT.travelLegWeights)
  });

  reg("critRule", {
    name: "SHIFT.Settings.CritRule.Name",
    hint: "SHIFT.Settings.CritRule.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: SHIFT.critRules,
    default: "standard"
  });

  reg("rerollTurnOrder", {
    name: "SHIFT.Settings.RerollTurnOrder.Name",
    hint: "SHIFT.Settings.RerollTurnOrder.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  reg("promptCoreExhausted", {
    name: "SHIFT.Settings.PromptCoreExhausted.Name",
    hint: "SHIFT.Settings.PromptCoreExhausted.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Scale é uma regra OPCIONAL. Estas vivem no submenu "Scale"
  // (config:false → escondidas da lista plana) para lerem como um grupo.
  // enableScale é a chave-mestra: desligada, esconde todo controle de Scale no sistema.
  reg("enableScale", {
    name: "SHIFT.Settings.EnableScale.Name",
    hint: "SHIFT.Settings.EnableScale.Hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
    // O Action HUD não é ApplicationV2 (é DOM manual), então o loop de instâncias
    // não o alcança: rebuilda explicitamente para o glow/pip de Scale aparecer/sumir.
    onChange: () => {
      refreshActionHud();
      // Re-renderiza só as SHEETS de Actor/Item (onde marcadores de Scale aparecem),
      // pulando DialogV2, a janela de Settings e qualquer outra ApplicationV2 viva —
      // re-renderizar essas fecharia diálogos abertos ou bagunçaria a própria config.
      for (const app of foundry.applications.instances.values()) {
        if (app.document instanceof Actor || app.document instanceof Item) app.render?.();
      }
    }
  });

  reg("enableScaledUp", {
    name: "SHIFT.Settings.EnableScaledUp.Name",
    hint: "SHIFT.Settings.EnableScaledUp.Hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: true
  });

  reg("enableXpScaleUp", {
    name: "SHIFT.Settings.EnableXpScaleUp.Name",
    hint: "SHIFT.Settings.EnableXpScaleUp.Hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: true
  });

  reg("xpPerScaleStep", {
    name: "SHIFT.Settings.XpPerScaleStep.Name",
    hint: "SHIFT.Settings.XpPerScaleStep.Hint",
    scope: "world",
    config: false,
    type: Number,
    default: 2
  });

  /* ============================================================
     GM · Sessões e advancement, escopo de mundo
     ============================================================ */

  reg("xpPerSessionLimit", {
    name: "SHIFT.Settings.XpLimit.Name",
    hint: "SHIFT.Settings.XpLimit.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 5
  });

  // Pelas regras, um personagem só adquire UM advancement por sessão. Ligado por
  // padrão; o GM pode sobrepor a trava quando clica num chip já travado.
  reg("oneAdvancementPerSession", {
    name: "SHIFT.Settings.OneAdvancement.Name",
    hint: "SHIFT.Settings.OneAdvancement.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  reg("autoXp", {
    name: "SHIFT.Settings.AutoXp.Name",
    hint: "SHIFT.Settings.AutoXp.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  reg("promptSessionOnLogin", {
    name: "SHIFT.Settings.PromptSession.Name",
    hint: "SHIFT.Settings.PromptSession.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  /* ============================================================
     Por jogador · Interface, escopo de client (cada um define o
     seu; sempre editável, independente de ser GM)
     ============================================================ */

  reg("theme", {
    name: "SHIFT.Settings.Theme.Name",
    hint: "SHIFT.Settings.Theme.Hint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      dark: "SHIFT.Settings.Theme.dark",
      light: "SHIFT.Settings.Theme.light"
    },
    default: "dark",
    onChange: () => applyShiftTheme()
  });

  // EXPERIMENTAL (toggleável, fácil de reverter): pinta a CHROME nativa do
  // Foundry (sidebar, chat, HUDs, janelas) com a estética "Bunny Glass" das
  // fichas. Liga/desliga a classe body.shift-ui-theme, que governa um único
  // bloco isolado no fim de shift.less. Desligue aqui para voltar ao visual
  // padrão do Foundry sem tocar em nada.
  reg("uiTheme", {
    name: "SHIFT.Settings.UiTheme.Name",
    hint: "SHIFT.Settings.UiTheme.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => applyShiftUiTheme()
  });

  // As settings do Action HUD vivem no submenu "Action HUD" (config:false →
  // escondidas da lista plana). Settings config:false ainda disparam onChange no
  // set(), então a barra se atualiza quando o jogador mexe num toggle do submenu.
  reg("enableActionHud", {
    name: "SHIFT.Settings.ActionHud.Name",
    hint: "SHIFT.Settings.ActionHud.Hint",
    scope: "client",
    config: false,
    type: Boolean,
    default: true,
    onChange: () => refreshActionHud()
  });

  reg("hudAlwaysOpen", {
    name: "SHIFT.Settings.HudAlwaysOpen.Name",
    hint: "SHIFT.Settings.HudAlwaysOpen.Hint",
    scope: "client",
    config: false,
    type: Boolean,
    default: true,
    onChange: () => refreshActionHud()
  });

  reg("hudMenuTrigger", {
    name: "SHIFT.Settings.HudMenuTrigger.Name",
    hint: "SHIFT.Settings.HudMenuTrigger.Hint",
    scope: "client",
    config: false,
    type: String,
    choices: {
      click: "SHIFT.Settings.HudMenuTrigger.click",
      hover: "SHIFT.Settings.HudMenuTrigger.hover"
    },
    default: "hover",
    onChange: () => refreshActionHud()
  });

  /* ============================================================
     Armazenamento interno, config:false (nunca aparece no menu)
     ============================================================ */

  // Dados gerenciados pelo GM
  reg("advancements", { scope: "world", config: false, type: Array, default: [] });
  reg("statusEffects", {
    scope: "world",
    config: false,
    type: Array,
    default: [],
    onChange: () => {
      applyStatusEffects();
      // Atualiza um Token HUD já aberto para os swatches refletirem a nova
      // lista; nunca força a abertura.
      const hud = canvas?.hud?.token;
      if (hud?.rendered) hud.render();
    }
  });
  reg("clocks", { scope: "world", config: false, type: Array, default: [] });
  // Faixas de distância personalizáveis (faixas abstratas do SHIFT, medidas em
  // unidades de cena). Editadas no submenu "Distance Ranges"; vazio cai nos padrões.
  reg("ranges", { scope: "world", config: false, type: Array, default: [] });
  // O que a leitura de hover na cena mostra: o nome da faixa, as unidades numéricas, ou ambos.
  reg("rangeMode", { scope: "world", config: false, type: String, default: "both" });
  reg("lastSessionStart", { scope: "world", config: false, type: Number, default: 0 });
  reg("compendiumSeeded", { scope: "world", config: false, type: Boolean, default: false });
  reg("techniquesSeeded", { scope: "world", config: false, type: Boolean, default: false });
  // Migração one-time: Quests legadas (Trait category="quest") → tipo de Item "quest".
  reg("questTypeMigrated", { scope: "world", config: false, type: Boolean, default: false });
  reg("attitudeTransformMigrated", { scope: "world", config: false, type: Boolean, default: false });
  // Migração one-time: remove o campo morto system.features das Traits (Keywords/Drawbacks
  // deixaram de ser opcionais por Trait; agora toda Trait tem ambos).
  reg("traitFeaturesRemoved", { scope: "world", config: false, type: Boolean, default: false });
  // Migração one-time: re-aloja a GM Note legada do Codex (system.codex[].note → system.gmNote do Actor/Item referenciado).
  reg("codexNoteMigrated", { scope: "world", config: false, type: Boolean, default: false });
  // Migração one-time: varre os Items órfãos do tipo `landmark` (descontinuado; Landmarks
  // viraram Locations aninhadas). Sem isso, ficariam como subtipo desconhecido na sidebar.
  reg("landmarksRemoved", { scope: "world", config: false, type: Boolean, default: false });

  // Estado de UI por jogador (painel Global Traits + posição do Action HUD)
  reg("clocksPanelOpen", { scope: "client", config: false, type: Boolean, default: true });
  reg("clocksPanelMinimized", { scope: "client", config: false, type: Boolean, default: false });
  // Posição custom de arraste do painel Global Traits; null = docado acima dos Players.
  reg("clocksPanelPos", { scope: "client", config: false, type: Object, default: null });
  reg("hudPosition", { scope: "client", config: false, type: Object, default: null });
  // Por jogador: mostra a faixa de distância ao passar o mouse num token na cena.
  reg("showTokenRanges", { scope: "client", config: false, type: Boolean, default: true });
  // Aplica os temas escolhidos assim que o jogo estiver pronto.
  Hooks.once("ready", async () => {
    // Bunny Glass ATIVO POR PADRÃO via default:true da setting "uiTheme": instalações
    // novas já vêm ligadas. Quem desligou de propósito mantém a escolha — NÃO forçamos
    // mais o tema ON aqui, só aplicamos o valor atual da setting.
    applyShiftTheme();
    applyShiftUiTheme();
    randomizePauseDie();   // garante um dado já no boot (mundo que abre pausado)
  });

  // Bunny Glass: sorteia um novo dado do SHIFT toda vez que o jogo é PAUSADO,
  // para o ícone central do indicador #pause (ver applyShiftUiTheme / seção K).
  Hooks.on("pauseGame", paused => { if ( paused ) randomizePauseDie(); });
}

function applyShiftTheme() {
  const light = game.settings.get("shift-vtt", "theme") === "light";
  document.body.classList.toggle("shift-theme-light", light);
  // Bunny Glass é PADRÃO obrigatório: assa direto no tema escuro via CSS
  // (body:not(.shift-theme-light)), sem setting nem classe pra alternar.
}

/** EXPERIMENTAL: liga/desliga o skin "Bunny Glass" na chrome nativa do Foundry
 *  (sidebar, chat, HUDs, janelas). Tudo mora num único bloco isolado de
 *  shift.less sob `body.shift-ui-theme` — alternar a classe é reverter por
 *  completo, sem reload. Ver setting "uiTheme". */
function applyShiftUiTheme() {
  const on = game.settings.get("shift-vtt", "uiTheme") !== false;
  document.body.classList.toggle("shift-ui-theme", on);
}

/** Bunny Glass: sorteia um dado do SHIFT (d4..d12) e grava sua imagem na custom
 *  prop --shift-pause-die do body. A seção K do tema (shift.less) lê essa prop
 *  num #pause::before que pulsa com glow, no lugar do relógio/compasso padrão.
 *  Sem o tema ligado a prop fica inerte — o CSS só a consome sob .shift-ui-theme. */
function randomizePauseDie() {
  const imgs = Object.values(SHIFT.diceImages).filter(Boolean);  // exhausted é null
  if ( !imgs.length ) return;
  const pick = imgs[Math.floor(Math.random() * imgs.length)];
  // URL ABSOLUTA (getRoute → "/systems/shift-vtt/…", respeita route prefix): um
  // url() RELATIVO numa custom prop é resolvido contra o arquivo CSS (styles/),
  // não contra a página, e geraria styles/systems/shift-vtt/… → 404.
  const url = foundry.utils.getRoute(pick);
  document.body.style.setProperty("--shift-pause-die", `url("${url}")`);
}

/** Se o sistema opcional de Scale está ligado (chave-mestra). Importada onde quer
 *  que um controle ou marcador de Scale deva sumir quando Scale está desligado. */
export function scaleEnabled() {
  return game.settings.get("shift-vtt", "enableScale") !== false;
}

/** Se o subsistema opcional de Travel está ligado (chave-mestra). Importada onde
 *  o controle de viagem da Party deve aparecer/sumir. */
export function travelEnabled() {
  return game.settings.get("shift-vtt", "enableTravel") === true;
}
