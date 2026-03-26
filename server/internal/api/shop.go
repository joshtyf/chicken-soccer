package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"chicken-soccer/server/internal/store"
)

func dateKey(t time.Time) string {
	return t.UTC().Format("2006-01-02")
}

func (a *API) getOrCreateShop(playerID string) (store.ShopState, error) {
	dk := dateKey(time.Now())
	state, err := a.shopStore.GetDailyShop(playerID, dk)
	if err == nil {
		return *state, nil
	}
	if !errors.Is(err, errors.New("")) {
		// continue with generation for not found / parse cases
	}
	seed := store.ShopSeedFromDateAndPlayer(dk, playerID)
	generated := store.GenerateDailyShop(dk, seed)
	if err := a.shopStore.SaveDailyShop(playerID, dk, generated); err != nil {
		return store.ShopState{}, err
	}
	return generated, nil
}

func (a *API) GetShop(w http.ResponseWriter, r *http.Request) {
	playerID := playerIDFromReq(r)
	state, err := a.getOrCreateShop(playerID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, state)
}

func (a *API) BuyChicken(w http.ResponseWriter, r *http.Request) {
	playerID := playerIDFromReq(r)
	var req struct {
		ListingID string `json:"listingId"`
		Name      string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "missing name")
		return
	}
	shop, err := a.getOrCreateShop(playerID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	idx := -1
	var listing store.ShopListing
	for i, l := range shop.Listings {
		if l.ID == req.ListingID {
			idx = i
			listing = l
			break
		}
	}
	if idx == -1 {
		writeError(w, http.StatusNotFound, "listing not found")
		return
	}
	balance, ok, err := a.playerStore.DeductBalance(playerID, listing.Price)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if !ok {
		writeError(w, http.StatusBadRequest, "insufficient_funds")
		return
	}
	chicken := store.ToChicken("c_buy_"+time.Now().UTC().Format("150405")+"_"+req.ListingID, req.Name, listing)
	if err := a.chickenStore.Add(playerID, chicken); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	shop.Listings = append(shop.Listings[:idx], shop.Listings[idx+1:]...)
	if err := a.shopStore.SaveDailyShop(playerID, shop.DateKey, shop); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"balance": balance, "listings": shop.Listings, "purchased": listing})
}

func (a *API) BuyFeed(w http.ResponseWriter, r *http.Request) {
	playerID := playerIDFromReq(r)
	var req struct {
		FeedKey  string `json:"feedKey"`
		Quantity int    `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.Quantity <= 0 {
		req.Quantity = 1
	}
	if req.FeedKey != "slowness" {
		writeError(w, http.StatusBadRequest, "feed_not_purchasable")
		return
	}
	total := 2 * req.Quantity
	balance, ok, err := a.playerStore.DeductBalance(playerID, total)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if !ok {
		writeError(w, http.StatusBadRequest, "insufficient_funds")
		return
	}
	count, err := a.feedStore.AddCount(playerID, "slowness", req.Quantity)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"balance": balance, "feedKey": "slowness", "quantity": req.Quantity, "newCount": count})
}
