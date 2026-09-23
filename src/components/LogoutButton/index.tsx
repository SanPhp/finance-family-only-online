'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { logout } from '@/services/auth';
import S from './style.module.scss';

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(false);

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear(); // não deixar dados da família em memória para o próximo login
      router.push('/sign-in');
    },
    onError: () => setFailed(true),
  });

  return (
    <>
      <button type="button" className={S.button} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        Sair
      </button>

      <Modal
        open={failed}
        onClose={() => setFailed(false)}
        title="Não foi possível sair"
        footer={<Button onClick={() => setFailed(false)}>Entendi</Button>}
      >
        {mutation.error && <p role="alert">{mutation.error.message}</p>}
      </Modal>
    </>
  );
}
