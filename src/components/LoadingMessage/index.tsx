'use client';

import S from './style.module.scss';

/** Estado de carregamento das telas: blocos que imitam o layout (skeleton), em vez de uma tela vazia. */
export function LoadingMessage() {
  return (
    <div role="status" aria-busy="true">
      <span className={S.srOnly}>Carregando...</span>
      <div className={S.kpis} aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className={`${S.block} ${S.kpi}`} />
        ))}
      </div>
      <div className={S.row} aria-hidden>
        <div className={`${S.block} ${S.card}`} />
        <div className={`${S.block} ${S.card}`} />
      </div>
    </div>
  );
}
