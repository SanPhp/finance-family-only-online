'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { InviteSection } from '@/components/Pages/Members/InviteSection';
import { getMembers } from '@/services/family';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingMessage } from '@/components/LoadingMessage';
import S from './style.module.scss';

const roleLabel = { ADMIN: 'Administrador', MEMBER: 'Membro' };

export function MembersPanel() {
  const { data, isPending, error, refetch } = useQuery({ queryKey: ['members'], queryFn: getMembers });

  if (isPending) return <LoadingMessage />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => void refetch()} />;

  return (
    <div className={S.grid}>
      <Card title="Membros">
        {data.members.map((member) => (
          <div key={member.id} className={S.row}>
            <div className={S.avatar} aria-hidden>{member.name.charAt(0).toUpperCase()}</div>
            <div className={S.who}>
              <b>{member.name}{member.id === data.me.id_user && ' (você)'}</b>
              <small>{member.email}</small>
            </div>
            <span className={S.badge}>{roleLabel[member.role]}</span>
          </div>
        ))}
      </Card>

      {data.me.role === 'ADMIN' && <InviteSection />}
    </div>
  );
}
