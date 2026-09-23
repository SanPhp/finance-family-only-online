import S from './style.module.scss';

type Props = React.ComponentProps<'input'> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, ...rest }: Props) {
  const inputId = id ?? rest.name;
  return (
    <div className={S.field}>
      <label className={S.label} htmlFor={inputId}>{label}</label>
      <input className={S.input} id={inputId} aria-invalid={!!error} aria-describedby={error ? inputId + "-error" : undefined} {...rest} />
      {error && <span id={inputId + "-error"} className={S.error} role="alert">{error}</span>}
    </div>
  );
}
