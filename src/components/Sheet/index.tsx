'use client';

import { useSyncExternalStore } from 'react';
import { Drawer } from 'vaul';
import S from './style.module.scss';

const DESKTOP_QUERY = '(min-width: 900px)';

/** Media query segura para SSR: no servidor assume mobile. */
function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESKTOP_QUERY);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

/** Abaixo disso a diferença de altura é a barra do navegador, não o teclado virtual. */
const KEYBOARD_MIN_HEIGHT = 120;
/** Folga entre o topo da tela visível e o topo do Sheet quando o teclado está aberto. */
const KEYBOARD_TOP_GAP = 12;
/** Tempo para o teclado terminar de subir antes de rolar o campo focado para a vista. */
const FOCUS_SCROLL_DELAY_MS = 350;

function subscribeViewport(onChange: () => void) {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  viewport.addEventListener('resize', onChange);
  viewport.addEventListener('scroll', onChange);
  return () => {
    viewport.removeEventListener('resize', onChange);
    viewport.removeEventListener('scroll', onChange);
  };
}

/** Snapshot em string ("distância do fundo|altura visível") para ser estável no useSyncExternalStore. */
function getKeyboardSnapshot() {
  const viewport = window.visualViewport;
  if (!viewport) return '';
  const covered = window.innerHeight - viewport.height;
  if (covered <= KEYBOARD_MIN_HEIGHT) return '';
  return `${Math.max(0, Math.round(covered - viewport.offsetTop))}|${Math.round(viewport.height)}`;
}

/**
 * Área visível quando o teclado virtual está aberto (null quando fechado).
 * No iPhone e no Android o teclado cobre a página em vez de redimensioná-la, então um elemento
 * `fixed` no rodapé fica escondido atrás dele: o Sheet precisa subir e encolher para caber.
 */
function useKeyboardArea() {
  const snapshot = useSyncExternalStore(subscribeViewport, getKeyboardSnapshot, () => '');
  if (!snapshot) return null;
  const [bottom, height] = snapshot.split('|').map(Number);
  return { bottom, height };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** esconde o título visualmente, mantendo para leitor de tela */
  hideTitle?: boolean;
  /** trava fechar por clique fora / ESC / arraste (ex.: modal aberto por cima) */
  locked?: boolean;
};

export function Sheet({ open, onOpenChange, title, children, footer, hideTitle, locked = false }: Props) {
  const direction = useIsDesktop() ? 'right' : 'bottom';
  const keyboard = useKeyboardArea();
  const keyboardArea = direction === 'bottom' ? keyboard : null;

  // com o teclado aberto, leva o campo focado para dentro da área visível do corpo do Sheet
  const scrollFocusedIntoView = (event: React.FocusEvent<HTMLDivElement>) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
    window.setTimeout(() => field.scrollIntoView({ block: 'center', behavior: 'smooth' }), FOCUS_SCROLL_DELAY_MS);
  };

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction={direction}
      dismissible={!locked}
      // o reposicionamento do vaul empurra o Sheet inteiro para cima e esconde o topo: quem ajusta é o useKeyboardArea
      repositionInputs={false}
      key={direction}
    >
      <Drawer.Portal>
        <Drawer.Overlay className={S.overlay} />
        <Drawer.Content
          className={S.content}
          data-dir={direction}
          data-keyboard={keyboardArea ? 'true' : undefined}
          style={keyboardArea ? { bottom: keyboardArea.bottom, maxHeight: keyboardArea.height - KEYBOARD_TOP_GAP } : undefined}
          aria-describedby={undefined}
          onPointerDownOutside={(e) => locked && e.preventDefault()}
          onInteractOutside={(e) => locked && e.preventDefault()}
          onEscapeKeyDown={(e) => locked && e.preventDefault()}
        >
          {direction === 'bottom' && (
            <div className={S.grab}>
              <span className={S.handle} />
            </div>
          )}

          <div className={hideTitle ? S.headHidden : S.head}>
            <Drawer.Title className={hideTitle ? S.srOnly : S.title}>{title}</Drawer.Title>
            {!hideTitle && (
              <button type="button" className={S.close} onClick={() => onOpenChange(false)} aria-label="Fechar">
                ✕
              </button>
            )}
          </div>

          <div className={S.body} onFocus={scrollFocusedIntoView}>{children}</div>

          {footer && <div className={S.foot}>{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
