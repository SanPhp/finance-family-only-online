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

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction={direction}
      dismissible={!locked}
      key={direction}
    >
      <Drawer.Portal>
        <Drawer.Overlay className={S.overlay} />
        <Drawer.Content
          className={S.content}
          data-dir={direction}
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

          <div className={S.body}>{children}</div>

          {footer && <div className={S.foot}>{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
