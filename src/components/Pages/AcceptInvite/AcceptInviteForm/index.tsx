'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { AcceptInviteFormZodSchema, type AcceptInviteFormProps } from '@/lib/validationZodSchema/InviteZodSchema';
import { acceptInvite, getInvitePreview } from '@/services/family';
import S from './style.module.scss';

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const preview = useQuery({ queryKey: ['invite', token], queryFn: () => getInvitePreview(token), retry: false });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormProps>({ resolver: zodResolver(AcceptInviteFormZodSchema) });

  const mutation = useMutation({
    mutationFn: (data: AcceptInviteFormProps) => acceptInvite({ token, name: data.name, password: data.password }),
    onSuccess: () => router.push('/dashboard'),
  });

  if (preview.isPending) {
    return <Card className={S.card}><p className={S.text}>Verificando convite...</p></Card>;
  }

  if (preview.error) {
    return (
      <Card className={S.card}>
        <h1 className={S.title}>Convite indisponível</h1>
        <p className={S.text}>{preview.error.message} Peça um novo link a quem convidou você.</p>
        <p className={S.footer}><Link className={S.link} href="/sign-in">Ir para o login</Link></p>
      </Card>
    );
  }

  return (
    <Card className={S.card}>
      <h1 className={S.title}>Entrar na família {preview.data.familyName}</h1>
      <p className={S.text}>Crie sua senha para acessar com <b>{preview.data.email}</b>.</p>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate>
        <Input label="Seu nome" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input label="Senha" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <Input
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {mutation.error && <p className={S.error} role="alert">{mutation.error.message}</p>}

        <Button type="submit" fullWidth disabled={mutation.isPending || mutation.isSuccess} className={S.submit}>
          {mutation.isPending || mutation.isSuccess ? 'Entrando...' : 'Criar conta e entrar'}
        </Button>
      </form>
    </Card>
  );
}
