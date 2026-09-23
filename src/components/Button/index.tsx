import S from './style.module.scss';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  fullWidth?: boolean;
};

export function Button({ variant = 'primary', fullWidth, className, ...rest }: Props) {
  const classes = [S.button, S[variant], fullWidth ? S.full : '', className].filter(Boolean).join(' ');
  return <button className={classes} {...rest} />;
}
