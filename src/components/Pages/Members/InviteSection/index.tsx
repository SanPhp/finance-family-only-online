'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { ApiError } from '@/lib/axios';
import { formatDate } from '@/lib/date';
import { CreateInviteZodSchema, type CreateInviteProps } from '@/lib/validationZodSchema/InviteZodSchema';
import { createInvite, getPendingInvites } from '@/services/family';
import S from './style.module.scss';

const roleLabel = { ADMIN: 'Administrador', MEMBER: 'Membro' };

export function InviteSection() {
  const queryClient = useQueryClient();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const invites = useQuery({ queryKey: ['invites'], queryFn: getPendingInvites });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateInviteProps>({
    resolver: zodResolver(CreateInviteZodSchema),
    defaultValues: { email: '', role: 'MEMBER' },
  });

  const mutation = useMutation({
    mutationFn: createInvite,
    onSuccess: ({ token }) => {
      setLink(`${window.location.origin}/invite/${token}`);
      setCopied(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fields?.email) setError('email', { message: error.fields.email });
    },
  });

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // sem permissão de área de transferência: a pessoa copia o texto manualmente
    }
  }

  const generalError =
    mutation.error && !(mutation.error instanceof ApiError && mutation.error.fields) ? mutation.error.message : null;

  return (
    <Card title="Convidar alguém">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate>
        <Input label="E-mail da pessoa" type="email" error={errors.email?.message} {...register('email')} />
        <Select label="Papel" error={errors.role?.message} {...register('role')}>
          <option value="MEMBER">Membro (lança e consulta)</option>
          <option value="ADMIN">Administrador (também gerencia)</option>
        </Select>
        {generalError && <p className={S.error} role="alert">{generalError}</p>}
        <Button type="submit" fullWidth disabled={mutation.isPending} className={S.submit}>
          {mutation.isPending ? 'Gerando...' : 'Gerar link de convite'}
        </Button>
      </form>

      {link && (
        <div className={S.linkBox}>
          <p className={S.linkHelp}>Envie este link para a pessoa. Ele vale por 7 dias e não será mostrado de novo.</p>
          <input className={S.linkInput} readOnly value={link} aria-label="Link do convite" onFocus={(e) => e.target.select()} />
          <Button type="button" variant="ghost" fullWidth onClick={copyLink}>
            {copied ? 'Copiado ✓' : 'Copiar link'}
          </Button>
        </div>
      )}

      {invites.data && invites.data.length > 0 && (
        <div className={S.pending}>
          <h3 className={S.pendingTitle}>Convites pendentes</h3>
          {invites.data.map((invite) => (
            <div key={invite.id} className={S.pendingRow}>
              <span>{invite.email}</span>
              <small>{roleLabel[invite.role]} · vence em {formatDate(invite.expires_at)}</small>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
