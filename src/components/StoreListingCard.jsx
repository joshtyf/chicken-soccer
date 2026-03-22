import ChickenCard from './ChickenCard';
import UiButton from './UiButton';

export default function StoreListingCard({ listing, canAfford, onBuy }) {
  return (
    <div className="grid gap-[0.45rem] border-2 border-white/18 bg-[rgba(8,14,21,0.62)] p-[0.45rem]">
      <ChickenCard
        chicken={{
          id: listing.id,
          name: listing.generatedName,
          stats: listing.stats,
        }}
        selected={false}
      />

      <div className="flex items-center justify-between gap-[0.5rem] max-[720px]:flex-wrap max-[720px]:justify-center">
        <p className="text-[clamp(0.52rem,1vw,0.64rem)] text-[#ffe08b]">{listing.price} PP</p>
        <UiButton
          className="min-w-[88px] px-[0.8rem] py-[0.5rem] text-[clamp(0.52rem,1vw,0.62rem)]"
          hoverScale={1.03}
          onClick={() => onBuy(listing)}
          disabled={!canAfford}
        >
          BUY
        </UiButton>
      </div>
    </div>
  );
}