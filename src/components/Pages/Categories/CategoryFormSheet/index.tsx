'use client';

import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Sheet } from '@/components/Sheet';
import { ApiError } from '@/lib/axios';
import { CreateCategoryZodSchema, type CreateCategoryProps } from '@/lib/validationZodSchema/CategoryZodSchema';
import { createCategory, updateCategory } from '@/services/categories';
import type { Category, CategoryType } from '@/types/category';
import S from './style.module.scss';

const FORM_ID = 'category-form';
const SUGGESTIONS = ['🏠', '🛒', '🍔', '🚗', '💊', '📚', '🎬', '💡', '🛍️', '🎁', '✈️', '🐶', '👶', '🏋️', '💼', '💰'];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  type: CategoryType;
};

export function CategoryFormSheet({ open, onOpenChange, category, type }: Props) {
  const isEdit = !!category;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar categoria' : type === 'EXPENSE' ? 'Nova categoria de saída' : 'Nova categoria de entrada'}
      footer={<SubmitButton />}
    >
      {/* remonta ao trocar de categoria, para os campos começarem com os valores certos */}
      <CategoryForm key={category?.id ?? `new-${type}`} category={category} type={type} onDone={() => onOpenChange(false)} />
    </Sheet>
  );
}

function SubmitButton() {
  return (
    <Button type="submit" form={FORM_ID} fullWidth>
      Salvar
    </Button>
  );
}

function CategoryForm({ category, type, onDone }: { category?: Category; type: CategoryType; onDone: () => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<CreateCategoryProps>({
    resolver: zodResolver(CreateCategoryZodSchema),
    defaultValues: { name: category?.name ?? '', icon: category?.icon ?? '', type: category?.type ?? type },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateCategoryProps) =>
      category ? updateCategory(category.id, { name: data.name, icon: data.icon }) : createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onDone();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fields?.name) setError('name', { message: error.fields.name });
    },
  });

  const icon = useWatch({ control, name: 'icon' });
  const generalError =
    mutation.error && !(mutation.error instanceof ApiError && mutation.error.fields) ? mutation.error.message : null;

  return (
    <form id={FORM_ID} onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate>
      <Input label="Nome" autoComplete="off" error={errors.name?.message} {...register('name')} />
      <Input label="Ícone (emoji)" autoComplete="off" error={errors.icon?.message} {...register('icon')} />

      <div className={S.suggestions} role="group" aria-label="Sugestões de ícone">
        {SUGGESTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={emoji === icon ? `${S.emoji} ${S.selected}` : S.emoji}
            onClick={() => setValue('icon', emoji, { shouldValidate: true })}
            aria-label={`Usar ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {generalError && <p className={S.error} role="alert">{generalError}</p>}
      {mutation.isPending && <p className={S.info}>Salvando...</p>}
    </form>
  );
}
