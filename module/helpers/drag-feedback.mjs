/**
 * SHIFT VTT — feedback visual de drag-and-drop (dinâmico).
 *
 * Liga, num root de sheet, três efeitos PURAMENTE VISUAIS — não interfere na
 * lógica de drop do Foundry (só adiciona/remove classes, nunca chama
 * preventDefault/stopPropagation):
 *   • card-fonte "levantado" como bloco sólido     → .is-dragging
 *   • realce do container/card válido sob o cursor → .drag-over
 *   • linha de inserção no reorder de cards        → .drop-before / .drop-after
 *
 * Idempotente por root (flag no dataset): seguro chamar a cada _onRender.
 */

const CARD = "[data-item-id][data-draggable='true']";
const ZONES = "[data-drop], [data-page='codex'], .party-codex, .party-dropzone";

export function bindDragFeedback(root) {
  if (!root || root.dataset.shiftDragFx) return;
  root.dataset.shiftDragFx = "1";

  const DROP_CLASSES = ["drag-over", "drop-before", "drop-after", "drop-left", "drop-right", "drop-nest"];
  let dragging = null;     // card-fonte arrastado a partir DESTE root (= reorder)
  let current = null;      // alvo realçado no momento
  let currentCls = null;

  const setHighlight = (el, cls) => {
    if (el === current && cls === currentCls) return;
    current?.classList.remove(...DROP_CLASSES);
    current = el; currentCls = cls;
    if (el && cls) el.classList.add(cls);
  };

  const clear = () => {
    dragging?.classList.remove("is-dragging");
    dragging = null;
    setHighlight(null, null);
    root.classList.remove("is-dragging-active");
  };

  root.addEventListener("dragstart", ev => {
    const card = ev.target?.closest?.(CARD);
    if (!card || !root.contains(card)) return;
    dragging = card;
    card.classList.add("is-dragging");
    root.classList.add("is-dragging-active");
  });

  root.addEventListener("dragover", ev => {
    if (dragging) {
      // Reorder: linha de inserção no card irmão sob o cursor. Em LISTA (card ocupa
      // quase toda a largura) a linha é horizontal (acima/abaixo); em GRADE (cards
      // lado a lado, ex. Traits) a linha é vertical na LATERAL (antes/depois).
      const target = ev.target?.closest?.(CARD);
      if (!target || target === dragging || !root.contains(target)) return setHighlight(null, null);
      const rect = target.getBoundingClientRect();
      // Quest sobre Quest (espelha #sortQuestOnDrop): a METADE DIREITA (relX > 0.5)
      // aninha como subquest (realce de "vira filha"); a metade esquerda reordena como
      // irmã, com a linha de inserção antes/depois pela metade vertical.
      if (dragging.classList.contains("is-quest") && target.classList.contains("is-quest")) {
        const relX = rect.width ? (ev.clientX - rect.left) / rect.width : 0;
        if (relX > 0.5) return setHighlight(target, "drop-nest");
        const relY = rect.height ? (ev.clientY - rect.top) / rect.height : 0.5;
        return setHighlight(target, relY <= 0.5 ? "drop-before" : "drop-after");
      }
      const parentW = target.parentElement?.getBoundingClientRect().width ?? rect.width;
      if (rect.width > parentW * 0.8) {
        setHighlight(target, ev.clientY < rect.top + rect.height / 2 ? "drop-before" : "drop-after");
      } else {
        setHighlight(target, ev.clientX < rect.left + rect.width / 2 ? "drop-left" : "drop-right");
      }
    } else {
      // Drop externo (de outra sheet/sidebar): realça a zona/card reconhecido.
      const zone = ev.target?.closest?.(ZONES) || ev.target?.closest?.(CARD);
      setHighlight(zone || null, zone ? "drag-over" : null);
    }
  });

  // Limpa quando o cursor sai do root inteiro (não a cada filho).
  root.addEventListener("dragleave", ev => {
    if (!root.contains(ev.relatedTarget)) setHighlight(null, null);
  });
  // O drop real é tratado pelo Foundry; aqui só limpamos o visual depois dele.
  root.addEventListener("drop", () => setTimeout(clear, 0));
  root.addEventListener("dragend", clear);
}
