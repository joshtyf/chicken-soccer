import NamingModal from './NamingModal';
import ScreenLayout from './ScreenLayout';
import StoreListingCard from './StoreListingCard';
import UiButton from './UiButton';
import { useShop } from '../hooks/useShop';

export default function StoreScreen({ onBack, onBalanceChange }) {
  const {
    balance,
    listings,
    activeListing,
    shopDate,
    errorText,
    openNameModal,
    confirmPurchase,
    cancelPurchase,
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
