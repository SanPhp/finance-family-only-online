'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { LoginZodSchema, type LoginProps } from '@/lib/validationZodSchema/LoginZodSchema';
import { login } from '@/services/auth';
import S from './style.module.scss';

export function SignInForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginProps>({ resolver: zodResolver(LoginZodSchema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => router.push('/dashboard'),
  });

  return (
    <Card className={S.card}>
      <h1 className={S.title}>Entrar</h1>
      <p className={S.text}>Acesse as finanças da sua família.</p>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate>
        <Input label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {mutation.error && <p className={S.error} role="alert">{mutation.error.message}</p>}

        <Button type="submit" fullWidth disabled={mutation.isPending || mutation.isSuccess} className={S.submit}>
          {mutation.isPending || mutation.isSuccess ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className={S.footer}>
        Ainda não tem conta? <Link className={S.link} href="/sign-up">Criar conta</Link>
      </p>
    </Card>
  );
}
