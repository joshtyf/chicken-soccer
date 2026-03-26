import { motion, AnimatePresence } from 'framer-motion';

export default function ChickenCard({ chicken, selected, onSelect }) {
  const speed = chicken?.stats?.speed ?? 0;
  const isSelectable = typeof onSelect === 'function';
  const classes = [
    'relative w-full border-2 border-white/22 bg-[rgba(10,16,24,0.76)] px-[0.6rem] py-[0.6rem] text-left text-text-main transition-[border-color,background-color,box-shadow] duration-150',
    selected ? 'active-selection' : 'hover:border-white/40',
    isSelectable ? 'cursor-pointer' : 'cursor-default',
    'max-[720px]:px-[0.55rem] max-[720px]:py-[0.55rem]',
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      type="button"
      className={classes}
      animate={selected ? { y: -3, scale: 1.015 } : { y: 0, scale: 1 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
      onClick={() => {
        if (isSelectable) {
          onSelect(chicken.id);
        }
      }}
      aria-pressed={isSelectable ? selected : undefined}
    >
      <AnimatePresence>
        {selected && isSelectable && (
          <motion.span
            className="absolute right-0 top-0 border-b border-l border-[rgba(255,225,120,0.85)] bg-[rgba(58,44,6,0.95)] px-[0.3rem] py-[0.08rem] text-[clamp(0.34rem,0.65vw,0.44rem)] text-[#ffe8aa]"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          >
            ✓ PICK
          </motion.span>
        )}
      </AnimatePresence>

      <div className="mb-[0.45rem] flex items-center justify-between gap-[0.6rem]">
        <p className={`text-[clamp(0.56rem,1.1vw,0.68rem)] transition-colors duration-150 ${selected ? 'text-[#ffe8aa]' : 'text-text-main'}`}>{chicken.name}</p>
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
