package api

import "net/http"

func (a *API) GetPlayer(w http.ResponseWriter, r *http.Request) {
	playerID := playerIDFromReq(r)
	balance, err := a.playerStore.GetBalance(playerID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	inv, err := a.feedStore.GetInventory(playerID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"balance": balance, "feedInventory": inv})
}
