'use client';

import { Input } from '@/components/Input';
import { maskMoney } from '@/lib/money';

type Props = React.ComponentProps<typeof Input> & {
  /** aceita valor negativo (saldo de conta no cheque especial). Sem isso só entram números. */
  allowNegative?: boolean;
};

/**
 * Campo de dinheiro com máscara ("87,50", "1.234,56"). Funciona com o `register` do React Hook Form:
 * o valor já mascarado é o que chega ao formulário, e `parseMoneyToCents` entende esse formato.
 */
export function MoneyInput({ allowNegative = false, onChange, ...props }: Props) {
  return (
    <Input
      // teclado numérico no celular; com valor negativo é preciso o teclado normal, para ter o "-"
      inputMode={allowNegative ? 'text' : 'numeric'}
      autoComplete="off"
      {...props}
      onChange={(event) => {
        event.target.value = maskMoney(event.target.value, allowNegative);
        onChange?.(event);
      }}
    />
  );
}
