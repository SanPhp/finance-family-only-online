'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { ApiError } from '@/lib/axios';
import { RegisterFormZodSchema, type RegisterFormProps } from '@/lib/validationZodSchema/RegisterZodSchema';
import { registerUser } from '@/services/auth';
import S from './style.module.scss';

export function SignUpForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormProps>({ resolver: zodResolver(RegisterFormZodSchema) });

  const mutation = useMutation({
    mutationFn: (data: RegisterFormProps) =>
      registerUser({ familyName: data.familyName, name: data.name, email: data.email, password: data.password }),
    onError: (error) => {
      if (error instanceof ApiError && error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          setError(field as keyof RegisterFormProps, { message });
        }
      }
    },
  });

  if (mutation.isSuccess) {
    return (
      <Card className={S.card}>
        <h1 className={S.title}>Conta criada 🎉</h1>
        <p className={S.text}>Sua família foi criada e você é o administrador dela.</p>
        <Link className={S.link} href="/sign-in">Entrar</Link>
      </Card>
    );
  }

  const generalError =
    mutation.error && !(mutation.error instanceof ApiError && mutation.error.fields) ? mutation.error.message : null;

  return (
    <Card className={S.card}>
      <h1 className={S.title}>Criar conta</h1>
      <p className={S.text}>Você cria a família e depois convida os outros membros.</p>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate>
        <Input label="Nome da família" autoComplete="off" error={errors.familyName?.message} {...register('familyName')} />
        <Input label="Seu nome" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Senha" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <Input
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {generalError && <p className={S.error} role="alert">{generalError}</p>}

        <Button type="submit" fullWidth disabled={mutation.isPending} className={S.submit}>
          {mutation.isPending ? 'Criando...' : 'Criar conta'}
        </Button>
      </form>

      <p className={S.footer}>
        Já tem conta? <Link className={S.link} href="/sign-in">Entrar</Link>
      </p>
    </Card>
  );
}
