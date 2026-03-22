import ChickenCard from './ChickenCard';
import UiButton from './UiButton';

export default function StoreListingCard({ listing, canAfford, onBuy }) {
  return (
    <div className="store-item">
      <ChickenCard
        chicken={{
          id: listing.id,
          name: listing.generatedName,
          stats: listing.stats,
        }}
        selected={false}
      />

      <div className="store-item-footer">
        <p className="store-price">{listing.price} PP</p>
        <UiButton
          className="store-buy-btn"
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