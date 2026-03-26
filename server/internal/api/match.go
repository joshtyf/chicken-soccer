package api

import (
	"encoding/json"
	"net/http"

	"chicken-soccer/server/internal/model"
)

func (a *API) CreateMatch(w http.ResponseWriter, r *http.Request) {
	playerID := playerIDFromReq(r)
	var req struct {
		ChickenIDs []string `json:"chickenIds"`
		GameModeID string   `json:"gameModeId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	mode := model.GetGameModeByID(req.GameModeID)
	if len(req.ChickenIDs) != mode.ChickensPerTeam {
		writeError(w, http.StatusBadRequest, "invalid chicken count for mode")
		return
	}
	selected := make([]model.Chicken, 0, len(req.ChickenIDs))
	for _, id := range req.ChickenIDs {
		ch, err := a.chickenStore.GetByID(playerID, id)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid chicken id")
			return
		}
		selected = append(selected, *ch)
	}
	feedInv, err := a.feedStore.GetInventory(playerID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	sessionID, opponents := a.matchmaker.Create(playerID, selected, mode, feedInv)
	writeJSON(w, http.StatusOK, map[string]any{"sessionId": sessionID, "opponentChickens": opponents, "feedInventory": feedInv})
}
