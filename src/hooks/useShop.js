import { useEffect, useState } from 'react';
import { shopLogic } from '../data/shopLogic';
import { playerDB } from '../data/playerDB';

function getPurchaseErrorMessage(reason) {
  if (reason === 'insufficient_funds') return 'NOT ENOUGH PP';
  if (reason === 'missing_name') return 'PLEASE ENTER A NAME';
  return 'PURCHASE FAILED';
}

export function useShop(onBalanceChange) {
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

  function confirmPurchase(chickenName) {
    if (!activeListing) return;

    const result = shopLogic.purchaseChicken(activeListing.id, chickenName);

    if (!result.success) {
      setErrorText(getPurchaseErrorMessage(result.reason));
      return;
    }

    setListings(result.listings);
    setBalance(result.balance);
    onBalanceChange?.(result.balance);
    setActiveListing(null);
    setErrorText('PURCHASE COMPLETE');
  }

  function cancelPurchase() {
    setActiveListing(null);
  }

  return {
    balance,
    listings,
    activeListing,
    shopDate,
    errorText,
    openNameModal,
    confirmPurchase,
    cancelPurchase,
  };
}