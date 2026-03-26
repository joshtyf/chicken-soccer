import { useEffect, useState } from 'react';
import { buyChicken, buyFeed, getPlayer, getShop } from '../services/api';

function getPurchaseErrorMessage(reason) {
  if (reason === 'insufficient_funds') return 'NOT ENOUGH PP';
  if (reason === 'missing_name') return 'PLEASE ENTER A NAME';
  if (reason === 'feed_not_found') return 'ITEM NOT FOUND';
  if (reason === 'feed_not_purchasable') return 'ITEM NOT PURCHASABLE';
  return 'PURCHASE FAILED';
}

export function useShop(onBalanceChange, onCollectionChange) {
  const [balance, setBalance] = useState(0);
  const [listings, setListings] = useState([]);
  const [activeListing, setActiveListing] = useState(null);
  const [shopDate, setShopDate] = useState('');
  const [errorText, setErrorText] = useState('');
  const [feedInventory, setFeedInventory] = useState({ slowness: 0 });

  useEffect(() => {
    async function loadShop() {
      try {
        const [shop, player] = await Promise.all([getShop(), getPlayer()]);
        setListings(shop.listings || []);
        setShopDate(shop.dateKey || '');
        setBalance(player.balance || 0);
        setFeedInventory(player.feedInventory || { slowness: 0 });
        onBalanceChange?.(player.balance || 0);
      } catch (error) {
        setErrorText(error.message || 'FAILED TO LOAD SHOP');
      }
    }

    loadShop();
  }, [onBalanceChange]);

  function openNameModal(listing) {
    if (balance < listing.price) {
      setErrorText('NOT ENOUGH PP');
      return;
    }

    setErrorText('');
    setActiveListing(listing);
  }

  async function confirmPurchase(chickenName) {
    if (!activeListing) return;

    try {
      const result = await buyChicken(activeListing.id, chickenName);
      setListings(result.listings || []);
      setBalance(result.balance || 0);
      onBalanceChange?.(result.balance || 0);
      onCollectionChange?.();
      setActiveListing(null);
      setErrorText('PURCHASE COMPLETE');
    } catch (error) {
      setErrorText(getPurchaseErrorMessage(error.message));
    }
  }

  function cancelPurchase() {
    setActiveListing(null);
  }

  async function buyFeedItem(feedKey) {
    try {
      const result = await buyFeed(feedKey, 1);
      setBalance(result.balance || 0);
      onBalanceChange?.(result.balance || 0);
      setFeedInventory((current) => ({
        ...current,
        [feedKey]: result.newCount || 0,
      }));
      setErrorText('PURCHASE COMPLETE');
    } catch (error) {
      setErrorText(getPurchaseErrorMessage(error.message));
    }
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
    buyFeed: buyFeedItem,
  };
}