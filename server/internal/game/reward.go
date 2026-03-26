package game

import "math/rand"

type Reward struct {
	DidWin     bool `json:"didWin"`
	WinBonus   int  `json:"winBonus"`
	GoalBonus  int  `json:"goalBonus"`
	Total      int  `json:"total"`
	NewBalance int  `json:"newBalance"`
}

func CalculateReward(left, right int, rng *rand.Rand) Reward {
	playerGoals := left
	if playerGoals < 0 {
		playerGoals = 0
	}
	didWin := left > right
	goalBonus := playerGoals * 5
	winBonus := 0
	if didWin {
		winBonus = rng.Intn(51)
	}
	return Reward{DidWin: didWin, WinBonus: winBonus, GoalBonus: goalBonus, Total: winBonus + goalBonus}
}
