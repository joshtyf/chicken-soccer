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
      panelClassName="grid min-h-[min(84%,620px)] w-[min(92%,860px)] content-start gap-[0.8rem] p-[clamp(1rem,2.2vw,2rem)] text-center max-[720px]:min-h-[min(90%,760px)] max-[720px]:w-[min(97%,860px)]"
      panelMotion={{
        initial: { scale: 0.96, y: 10 },
        animate: { scale: 1, y: 0 },
        exit: { scale: 1.01, opacity: 0 },
      }}
    >
      <h1 className="leading-[1.25] text-text-main [text-shadow:0_0_12px_rgba(255,230,140,0.2)]" aria-label="Chicken Store">
        <span className="mx-[0.35ch] inline-block text-[clamp(1.25rem,4.4vw,2.55rem)]">CHICKEN</span>
        <span className="mx-[0.35ch] inline-block text-[clamp(1.25rem,4.4vw,2.55rem)]">STORE</span>
      </h1>

      <p className="mb-[0.15rem] text-[clamp(0.58rem,1.2vw,0.75rem)] leading-[1.7] text-text-muted">
        DAILY OFFERS: {shopDate || '---'}
        <br />
        BALANCE: {balance} PP
      </p>

      {errorText && <p className="min-h-[1.2em] text-[clamp(0.5rem,1vw,0.63rem)] text-[#ffe08b]">{errorText}</p>}

      <section className="grid max-h-[min(48vh,380px)] w-full grid-cols-2 gap-[0.65rem] overflow-auto pr-[0.25rem] max-[720px]:max-h-[min(46vh,360px)] max-[720px]:grid-cols-1" aria-label="Store chickens">
        {listings.length === 0 && (
          <p className="col-span-full px-[0.5rem] py-[1.2rem] text-center text-[clamp(0.56rem,1.1vw,0.68rem)] text-text-muted">
            SOLD OUT. COME BACK TOMORROW.
          </p>
        )}

        {listings.map((listing) => (
          <StoreListingCard
            key={listing.id}
            listing={listing}
            canAfford={balance >= listing.price}
            onBuy={openNameModal}
          />
        ))}
      </section>

      <section className="grid gap-[0.45rem] border-2 border-[rgba(130,200,255,0.3)] bg-[rgba(8,14,22,0.56)] p-[0.6rem]" aria-label="Store consumables">
        <h2 className="text-left text-[clamp(0.52rem,1.05vw,0.64rem)] text-[#bde7ff]">CONSUMABLES</h2>
        <article className="flex items-center justify-between gap-[0.8rem] border-2 border-[rgba(130,200,255,0.2)] bg-[rgba(8,15,26,0.7)] p-[0.55rem] max-[720px]:flex-col max-[720px]:items-stretch">
          <div className="grid gap-[0.35rem] text-left">
            <p className="text-[clamp(0.5rem,1vw,0.62rem)] text-[#d3f0ff]">[2] {slownessFeed?.label?.toUpperCase() || 'SLOWNESS FEED'}</p>
            <p className="text-[clamp(0.45rem,0.9vw,0.56rem)] text-text-muted">{slownessFeed?.description || 'Slows consumed chicken for 3 seconds.'}</p>
            <p className="text-[clamp(0.45rem,0.9vw,0.56rem)] text-text-muted">OWNED: {feedInventory.slowness || 0}</p>
          </div>
          <div className="grid justify-items-end gap-[0.38rem] max-[720px]:justify-items-stretch">
            <p className="text-[clamp(0.52rem,1vw,0.64rem)] text-[#ffe08b]">{slownessFeed?.price ?? 2} PP</p>
            <button
              type="button"
              className="store-feed-buy max-[720px]:w-full"
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
