'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LoadingMessage } from '@/components/LoadingMessage';
import { ErrorMessage } from '@/components/ErrorMessage';
import { CommitmentFormSheet } from '@/components/Pages/Commitments/CommitmentFormSheet';
import { ProgressBar } from '@/components/ProgressBar';
import { formatCurrency } from '@/lib/money';
import { getCategories } from '@/services/categories';
import { getCommitments } from '@/services/commitments';
import type { Commitment } from '@/types/commitment';
import S from './style.module.scss';

type SheetState = { commitment?: Commitment } | null;

function CommitmentCard({ commitment, icon, onEdit }: { commitment: Commitment; icon: string; onEdit: () => void }) {
  const percent = Math.round((commitment.paid_installments * 100) / commitment.total_installments);
  const remainingInstallments = commitment.total_installments - commitment.paid_installments;
  const remainingCents = remainingInstallments * commitment.amount_cents;

  return (
    <Card>
      <div className={S.head}>
        <span className={S.name}>
          <i className={S.icon} aria-hidden>{icon}</i>
          {commitment.name}
        </span>
        <span className={commitment.status === 'DONE' ? `${S.pill} ${S.pillOk}` : S.pill}>
          {commitment.status === 'DONE' ? 'Concluído' : `${commitment.paid_installments} de ${commitment.total_installments}`}
        </span>
      </div>

      <small className={S.installment}>Parcela de {formatCurrency(commitment.amount_cents)}</small>
      <b className={S.spent}>{formatCurrency(commitment.paid_installments * commitment.amount_cents)}</b>
      <ProgressBar percent={percent} label={`${commitment.name}: ${percent}% pago`} />

      {commitment.status === 'DONE' ? (
        <small className={S.note}>Todas as {commitment.total_installments} parcelas pagas.</small>
      ) : (
        <small className={S.note}>
          Falta {remainingInstallments} {remainingInstallments === 1 ? 'parcela' : 'parcelas'} · {formatCurrency(remainingCents)}
          {commitment.due_day && ` · vence dia ${commitment.due_day}`}
        </small>
      )}

      <button type="button" className={S.edit} onClick={onEdit}>Editar</button>
    </Card>
  );
}

export function CommitmentsPanel() {
  const [sheet, setSheet] = useState<SheetState>(null);
  const commitments = useQuery({ queryKey: ['commitments'], queryFn: getCommitments });
  const categories = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  // erros primeiro: assim o TypeScript sabe que, depois disso, os dados existem
  if (commitments.isError) return <ErrorMessage message={commitments.error.message} onRetry={() => void commitments.refetch()} />;
  if (categories.isError) return <ErrorMessage message={categories.error.message} onRetry={() => void categories.refetch()} />;
  if (commitments.isPending || categories.isPending) return <LoadingMessage />;

  const iconOf = (id: string) => categories.data.find((category) => category.id === id)?.icon ?? '❔';
  const active = commitments.data.filter((commitment) => commitment.status === 'ACTIVE');
  const done = commitments.data.filter((commitment) => commitment.status === 'DONE');

  return (
    <>
      <div className={S.bar}>
        <div className={S.newButton}>
          <Button onClick={() => setSheet({})}>＋ Novo compromisso</Button>
        </div>
      </div>

      {active.length === 0 ? (
        <Card>
          <div className={S.empty}>
            <p>Nenhum compromisso em aberto. Cadastre uma compra parcelada pra acompanhar o quanto falta pagar.</p>
            <Button onClick={() => setSheet({})}>＋ Criar o primeiro</Button>
          </div>
        </Card>
      ) : (
        <div className={S.grid}>
          {active.map((commitment) => (
            <CommitmentCard key={commitment.id} commitment={commitment} icon={iconOf(commitment.id_category)} onEdit={() => setSheet({ commitment })} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <>
          <h2 className={S.sectionTitle}>Concluídos</h2>
          <div className={S.grid}>
            {done.map((commitment) => (
              <CommitmentCard key={commitment.id} commitment={commitment} icon={iconOf(commitment.id_category)} onEdit={() => setSheet({ commitment })} />
            ))}
          </div>
        </>
      )}

      <CommitmentFormSheet
        open={sheet !== null}
        onOpenChange={(open) => !open && setSheet(null)}
        commitment={sheet?.commitment}
        categories={categories.data}
      />
    </>
  );
}
