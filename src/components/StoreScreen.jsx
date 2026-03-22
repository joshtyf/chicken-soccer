import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import ChickenCard from './ChickenCard';
import NamingModal from './NamingModal';
import { shopLogic } from '../data/shopLogic';
import { playerDB } from '../data/playerDB';

export default function StoreScreen({ onBack, onBalanceChange }) {
  const [balance, setBalance] = useState(() => playerDB.getBalance());
  const [listings, setListings] = useState([]);
  const [activeListing, setActiveListing] = useState(null);
  const [shopDate, setShopDate] = useState('');
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    const shop = shopLogic.getDailyShop();
    const nextBalance = playerDB.getBalance();
    setListings(shop.listings);
    setShopDate(shop.dateKey);
    setBalance(nextBalance);
    onBalanceChange?.(nextBalance);
  }, [onBalanceChange]);

  function openNameModal(listing) {
    if (balance < listing.price) {
      setErrorText('NOT ENOUGH PP');
      return;
    }

    setErrorText('');
    setActiveListing(listing);
  }

  function handleConfirmPurchase(chickenName) {
    if (!activeListing) return;

    const result = shopLogic.purchaseChicken(activeListing.id, chickenName);

    if (!result.success) {
      if (result.reason === 'insufficient_funds') {
        setErrorText('NOT ENOUGH PP');
      } else if (result.reason === 'missing_name') {
        setErrorText('PLEASE ENTER A NAME');
      } else {
        setErrorText('PURCHASE FAILED');
      }
      return;
    }

    setListings(result.listings);
    setBalance(result.balance);
    onBalanceChange?.(result.balance);
    setActiveListing(null);
    setErrorText('PURCHASE COMPLETE');
  }

  return (
    <motion.div
      className="screen-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      <motion.div
        className="overlay-panel store-card"
        initial={{ scale: 0.96, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 1.01, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
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
            <div key={listing.id} className="store-item">
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
                <motion.button
                  type="button"
                  className="ui-button store-buy-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openNameModal(listing)}
                  disabled={balance < listing.price}
                >
                  BUY
                </motion.button>
              </div>
            </div>
          ))}
        </section>

        <motion.button
          type="button"
          className="ui-button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
        >
          BACK
        </motion.button>
      </motion.div>

      <NamingModal
        open={Boolean(activeListing)}
        chickenNameHint={activeListing?.generatedName || ''}
        onConfirm={handleConfirmPurchase}
        onCancel={() => setActiveListing(null)}
      />
    </motion.div>
  );
}
