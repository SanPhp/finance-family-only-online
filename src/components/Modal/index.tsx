'use client';

import { useEffect, useRef } from 'react';
import S from './style.module.scss';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/** Diálogo pequeno e centralizado, para confirmações curtas. */
export function Modal({ open, onClose, title, children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className={S.modal} onClose={onClose}>
      <h2 className={S.title}>{title}</h2>
      <div className={S.body}>{children}</div>
      {footer && <div className={S.footer}>{footer}</div>}
    </dialog>
  );
}
