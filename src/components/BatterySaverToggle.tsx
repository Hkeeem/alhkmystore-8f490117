import { useBatterySaver } from '../hooks/useBatterySaver';

/** زرار تفعيل/إيقاف وضع توفير البطارية — يوضع في الهيدر أو الإعدادات */
export default function BatterySaverToggle() {
  const { enabled, toggle } = useBatterySaver();

  return (
    <button
      dir="rtl"
      className={`battery-toggle ${enabled ? 'active' : ''}`}
      onClick={toggle}
      aria-label={enabled ? 'إيقاف وضع توفير البطارية' : 'تفعيل وضع توفير البطارية'}
      title={enabled ? 'إيقاف وضع توفير البطارية' : 'تفعيل وضع توفير البطارية'}
    >
      <span className="battery-icon">{enabled ? '🔋' : '🔌'}</span>
      <span className="battery-label">
        {enabled ? 'توفير البطارية مفعّل' : 'توفير البطارية'}
      </span>
    </button>
  );
}
