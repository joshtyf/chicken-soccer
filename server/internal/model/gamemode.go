package model

type GameMode struct {
	ID              string `json:"id"`
	Label           string `json:"label"`
	Description     string `json:"description"`
	ChickensPerTeam int    `json:"chickensPerTeam"`
}

var GameModes = map[string]GameMode{
	"solo": {
		ID:              "solo",
		Label:           "1v1",
		Description:     "Pick one chicken and face one random CPU chicken.",
		ChickensPerTeam: 1,
	},
	"duo": {
		ID:              "duo",
		Label:           "2v2",
		Description:     "Pick two chickens and face two random CPU chickens.",
		ChickensPerTeam: 2,
	},
}

func DefaultGameMode() GameMode {
	return GameModes["solo"]
}

func GetGameModeByID(id string) GameMode {
	if m, ok := GameModes[id]; ok {
		return m
	}
	return DefaultGameMode()
}
