import S from './style.module.scss';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
};

export function Card({ title, className, children, ...rest }: Props) {
  return (
    <div className={[S.card, className].filter(Boolean).join(' ')} {...rest}>
      {title && <h2 className={S.title}>{title}</h2>}
      {children}
    </div>
  );
}
