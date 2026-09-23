import S from './style.module.scss';

type Props = React.ComponentProps<'select'> & {
  label: string;
  error?: string;
};

export function Select({ label, error, id, children, ...rest }: Props) {
  const selectId = id ?? rest.name;
  return (
    <div className={S.field}>
      <label className={S.label} htmlFor={selectId}>{label}</label>
      <select className={S.select} id={selectId} aria-invalid={!!error} aria-describedby={error ? selectId + "-error" : undefined} {...rest}>
        {children}
      </select>
      {error && <span id={selectId + "-error"} className={S.error} role="alert">{error}</span>}
    </div>
  );
}
