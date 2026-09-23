import { formatCurrency } from '@/lib/money';
import type { Member } from '@/types/family';
import type { InsightsResponse } from '@/types/insight';
import S from './style.module.scss';

type Props = {
  byMember: InsightsResponse['by_member'];
  members: Member[];
};

/** Quem gastou quanto no mês. id_user nulo é o gasto compartilhado da Família. */
export function MemberBars({ byMember, members }: Props) {
  const total = byMember.reduce((sum, row) => sum + row.amount_cents, 0);
  if (total === 0) return <p className={S.empty}>Nenhuma saída neste mês.</p>;

  const nameById = new Map(members.map((member) => [member.id, member.name]));

  return (
    <div>
      {byMember.map((row) => {
        const name = row.id_user ? (nameById.get(row.id_user) ?? 'Membro') : 'Família (compartilhado)';
        const share = Math.round((row.amount_cents * 100) / total);
        return (
          <div key={row.id_user ?? 'shared'} className={S.row}>
            <div className={S.head}>
              <span>{row.id_user ? '👤' : '👨‍👩‍👧'} {name}</span>
              <span>{formatCurrency(row.amount_cents)} · {share}%</span>
            </div>
            <div className={S.track} role="img" aria-label={`${name}: ${share}% das saídas`}>
              <b className={S.fill} style={{ width: `${share}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
