import S from './style.module.scss';

type Props = {
  /** percentual usado; pode passar de 100 */
  percent: number;
  label?: string;
};

function levelOf(percent: number) {
  if (percent >= 100) return S.danger;
  if (percent >= 85) return S.warning;
  return S.ok;
}

export function ProgressBar({ percent, label }: Props) {
  const width = Math.min(Math.max(percent, 0), 100);
  return (
    <div
      className={S.bar}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
      aria-label={label}
    >
      <span className={`${S.fill} ${levelOf(percent)}`} style={{ width: `${width}%` }} />
    </div>
  );
}
