import { useEffect, useState } from 'react';
import { shopLogic } from '../data/shopLogic';
import { playerDB } from '../data/playerDB';
import { feedInventoryDB } from '../data/feedInventoryDB';

function getPurchaseErrorMessage(reason) {
  if (reason === 'insufficient_funds') return 'NOT ENOUGH PP';
  if (reason === 'missing_name') return 'PLEASE ENTER A NAME';
  if (reason === 'feed_not_found') return 'ITEM NOT FOUND';
  if (reason === 'feed_not_purchasable') return 'ITEM NOT PURCHASABLE';
  return 'PURCHASE FAILED';
}

export function useShop(onBalanceChange) {
  const [balance, setBalance] = useState(() => playerDB.getBalance());
  const [listings, setListings] = useState([]);
  const [activeListing, setActiveListing] = useState(null);
  const [shopDate, setShopDate] = useState('');
  const [errorText, setErrorText] = useState('');
  const [feedInventory, setFeedInventory] = useState({ slowness: 0 });

  useEffect(() => {
    const shop = shopLogic.getDailyShop();
    const nextBalance = playerDB.getBalance();
    setListings(shop.listings);
    setShopDate(shop.dateKey);
    setBalance(nextBalance);
    setFeedInventory({ slowness: feedInventoryDB.getCount('slowness') });
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

  function buyFeed(feedKey) {
    const result = shopLogic.purchaseFeed(feedKey, 1);

    if (!result.success) {
      setErrorText(getPurchaseErrorMessage(result.reason));
      return;
    }

    setBalance(result.balance);
    onBalanceChange?.(result.balance);
    setFeedInventory((current) => ({
      ...current,
      [feedKey]: result.newCount,
    }));
    setErrorText('PURCHASE COMPLETE');
  }

  return {
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
  };
}