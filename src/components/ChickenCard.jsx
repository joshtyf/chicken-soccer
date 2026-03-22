import { motion } from 'framer-motion';

export default function ChickenCard({ chicken, selected, onSelect }) {
  const speed = chicken?.stats?.speed ?? 0;
  const isSelectable = typeof onSelect === 'function';
  const classes = [
    'w-full border-2 border-white/22 bg-[rgba(10,16,24,0.76)] px-[0.6rem] py-[0.6rem] text-left text-text-main transition-[border-color,box-shadow] duration-170',
    selected ? 'border-[rgba(255,225,120,0.85)] shadow-[0_0_0_2px_rgba(255,205,94,0.2)]' : '',
    isSelectable ? 'cursor-pointer' : 'cursor-default',
    'max-[720px]:px-[0.55rem] max-[720px]:py-[0.55rem]',
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      type="button"
      className={classes}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        if (isSelectable) {
          onSelect(chicken.id);
        }
      }}
      aria-pressed={isSelectable ? selected : undefined}
    >
      <div className="mb-[0.45rem] flex items-center justify-between gap-[0.6rem]">
        <p className="text-[clamp(0.56rem,1.1vw,0.68rem)] text-text-main">{chicken.name}</p>
        <p className="text-[clamp(0.5rem,1vw,0.62rem)] text-text-muted">SPD {Math.round(speed)}</p>
      </div>

      <div className="grid grid-cols-[auto_1fr] items-center gap-[0.5rem] text-[0.5rem] text-text-muted">
        <span>SPEED</span>
        <div
          className="h-[0.46rem] border border-white/25 bg-black/32"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={speed}
        >
          <div className="stat-bar-fill" style={{ width: `${speed}%` }} />
        </div>
      </div>
    </motion.button>
  );
}
