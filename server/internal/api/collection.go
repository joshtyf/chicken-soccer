package api

import "net/http"

func (a *API) GetCollection(w http.ResponseWriter, r *http.Request) {
	items, err := a.chickenStore.GetAll(playerIDFromReq(r))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (a *API) InitCollection(w http.ResponseWriter, r *http.Request) {
	items, err := a.chickenStore.Init(playerIDFromReq(r))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, items)
}
