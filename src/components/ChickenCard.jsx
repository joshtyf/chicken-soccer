import { motion } from 'framer-motion';

export default function ChickenCard({ chicken, selected, onSelect }) {
  const speed = chicken?.stats?.speed ?? 0;

  return (
    <motion.button
      type="button"
      className={`chicken-card ${selected ? 'selected' : ''}`.trim()}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(chicken.id)}
    >
      <div className="chicken-card-head">
        <p className="chicken-name">{chicken.name}</p>
        <p className="chicken-speed-value">SPD {Math.round(speed)}</p>
      </div>

      <div className="stat-row">
        <span>SPEED</span>
        <div className="stat-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={speed}>
          <div className="stat-bar-fill" style={{ width: `${speed}%` }} />
        </div>
      </div>
    </motion.button>
  );
}
