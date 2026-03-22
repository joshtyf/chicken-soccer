import ChickenCard from './ChickenCard';

export default function ChickenList({
  chickens,
  title,
  ariaLabel,
  selectedId,
  onSelect,
}) {
  return (
    <section className="mx-auto grid w-[min(100%,640px)] gap-[0.65rem]" aria-label={ariaLabel}>
      <p className="text-left text-[clamp(0.58rem,1.1vw,0.72rem)] text-text-main max-[720px]:text-center">{title}</p>
      <div className="grid gap-[0.5rem]">
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