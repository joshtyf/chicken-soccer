import NamingModal from './NamingModal';
import ScreenLayout from './ScreenLayout';
import StoreListingCard from './StoreListingCard';
import UiButton from './UiButton';
import { useShop } from '../hooks/useShop';
import { getFeedDef } from '../data/feedDefs';

export default function StoreScreen({ onBack, onBalanceChange }) {
  const slownessFeed = getFeedDef('slowness');

  const {
    balance,
    listings,
    activeListing,
    shopDate,
    errorText,
    feedInventory,
    openNameModal,
    confirmPurchase,
    cancelPurchase,
    buyFeed,
  } = useShop(onBalanceChange);

  return (
    <ScreenLayout
      panelClassName="store-card"
      panelMotion={{
        initial: { scale: 0.96, y: 10 },
        animate: { scale: 1, y: 0 },
        exit: { scale: 1.01, opacity: 0 },
      }}
    >
      <h1 className="screen-title" aria-label="Chicken Store">
        <span className="word">CHICKEN</span>
        <span className="word">STORE</span>
      </h1>

      <p className="screen-subtitle store-subtitle">
        DAILY OFFERS: {shopDate || '---'}
        <br />
        BALANCE: {balance} PP
      </p>

      {errorText && <p className="store-feedback">{errorText}</p>}

      <section className="store-grid" aria-label="Store chickens">
        {listings.length === 0 && <p className="store-empty">SOLD OUT. COME BACK TOMORROW.</p>}

        {listings.map((listing) => (
          <StoreListingCard
            key={listing.id}
            listing={listing}
            canAfford={balance >= listing.price}
            onBuy={openNameModal}
          />
        ))}
      </section>

      <section className="store-consumables" aria-label="Store consumables">
        <h2 className="store-consumables-title">CONSUMABLES</h2>
        <article className="store-consumable-item">
          <div className="store-consumable-main">
            <p className="store-consumable-name">[2] {slownessFeed?.label?.toUpperCase() || 'SLOWNESS FEED'}</p>
            <p className="store-consumable-copy">{slownessFeed?.description || 'Slows consumed chicken for 3 seconds.'}</p>
            <p className="store-consumable-stock">OWNED: {feedInventory.slowness || 0}</p>
          </div>
          <div className="store-consumable-actions">
            <p className="store-price">{slownessFeed?.price ?? 2} PP</p>
            <button
              type="button"
              className="store-feed-buy"
              disabled={balance < (slownessFeed?.price ?? 2)}
              onClick={() => buyFeed('slowness')}
            >
              BUY +1
            </button>
          </div>
        </article>
      </section>

      <UiButton onClick={onBack}>BACK</UiButton>

      <NamingModal
        open={Boolean(activeListing)}
        chickenNameHint={activeListing?.generatedName || ''}
        onConfirm={confirmPurchase}
        onCancel={cancelPurchase}
      />
    </ScreenLayout>
  );
}
