package api

import "net/http"

func (a *API) Register(w http.ResponseWriter, r *http.Request) {
	playerID, token, err := a.playerStore.CreatePlayer()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if _, err := a.chickenStore.Init(playerID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"playerId": playerID, "token": token})
}
