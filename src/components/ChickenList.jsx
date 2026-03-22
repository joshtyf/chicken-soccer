import ChickenCard from './ChickenCard';

export default function ChickenList({
  chickens,
  title,
  ariaLabel,
  selectedId,
  onSelect,
}) {
  return (
    <section className="chicken-picker" aria-label={ariaLabel}>
      <p className="picker-title">{title}</p>
      <div className="chicken-list">
        {chickens.map((chicken) => (
          <ChickenCard
            key={chicken.id}
            chicken={chicken}
            selected={chicken.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}