'use client';

/**
 * Se pode usar `autoFocus` com segurança: só em telas sem toque (mouse/teclado físico).
 *
 * Em telas de toque (Android sobretudo), focar um input assim que o Sheet monta abre o teclado
 * virtual ANTES da animação de abertura terminar. O redimensionamento da viewport que o teclado
 * causa é interpretado pelo vaul como um gesto de arrastar para fechar, e o Sheet fecha sozinho
 * sem dar tempo de digitar nada.
 */
export function canAutoFocusSafely(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return !window.matchMedia('(pointer: coarse)').matches;
}
