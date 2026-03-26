package game

import (
	"math"
	"math/rand"

	"chicken-soccer/server/internal/model"
)

type ChickenState struct {
	ID             string             `json:"id"`
	Name           string             `json:"name"`
	Team           string             `json:"team"`
	Role           string             `json:"role"`
	X              float64            `json:"x"`
	Y              float64            `json:"y"`
	VX             float64            `json:"vx"`
	VY             float64            `json:"vy"`
	Stats          map[string]float64 `json:"stats"`
	Speed          float64            `json:"speed"`
	BaseSpeed      float64            `json:"baseSpeed"`
	SlowTimer      float64            `json:"slowTimer"`
	SlowMultiplier float64            `json:"slowMultiplier"`
	HomeX          float64            `json:"-"`
	HomeY          float64            `json:"-"`
	Appetite       float64            `json:"appetiteCooldown"`
	KickCooldown   float64            `json:"-"`
}

func slots(team string, size int) [][2]float64 {
	centerY := PitchY + PitchH/2
	if size <= 1 {
		if team == "left" {
			return [][2]float64{{PitchX + 40, centerY}}
		}
		return [][2]float64{{PitchX + PitchW - 40, centerY}}
	}
	if team == "left" {
		return [][2]float64{{PitchX + 60, centerY - 14}, {PitchX + 25, centerY + 14}}
	}
	return [][2]float64{{PitchX + PitchW - 60, centerY - 14}, {PitchX + PitchW - 25, centerY + 14}}
}

func BuildTeam(team string, chickens []model.Chicken) []ChickenState {
	s := slots(team, len(chickens))
	out := make([]ChickenState, 0, len(chickens))
	for i, ch := range chickens {
		st := model.ResolveStatsForGame(ch.Stats)
		role := "solo"
		if len(chickens) > 1 {
			if i == 0 {
				role = "striker"
			} else {
				role = "defender"
			}
		}
		out = append(out, ChickenState{
			ID:             ch.ID,
			Name:           ch.Name,
			Team:           team,
			Role:           role,
			X:              s[i][0],
			Y:              s[i][1],
			HomeX:          s[i][0],
			HomeY:          s[i][1],
			Stats:          model.SanitizeStats(ch.Stats),
			Speed:          st.Speed,
			BaseSpeed:      st.Speed,
			SlowMultiplier: 1,
		})
	}
	return out
}

func UpdateChicken(c *ChickenState, dt float64, ball *BallState, nearest *FeedItem, rng *rand.Rand) {
	if c.SlowTimer > 0 {
		c.SlowTimer -= dt
		if c.SlowTimer <= 0 {
			c.SlowTimer = 0
			c.SlowMultiplier = 1
		}
	}
	if c.Appetite > 0 {
		c.Appetite -= dt
		if c.Appetite < 0 {
			c.Appetite = 0
		}
	}
	if c.KickCooldown > 0 {
		c.KickCooldown -= dt
		if c.KickCooldown < 0 {
			c.KickCooldown = 0
		}
	}
	effectiveSpeed := c.BaseSpeed * c.SlowMultiplier
	tx, ty := ball.X, ball.Y
	if nearest != nil && c.Appetite <= 0 {
		tx, ty = nearest.X, nearest.Y
	}
	a := AngleBetween(c.X, c.Y, tx, ty)
	c.VX = cos(a) * effectiveSpeed
	c.VY = sin(a) * effectiveSpeed
	c.X += c.VX * dt
	c.Y += c.VY * dt
	c.X = Clamp(c.X, PitchX+5, PitchX+PitchW-5)
	c.Y = Clamp(c.Y, PitchY+5, PitchY+PitchH-5)

	if Dist(c.X, c.Y, ball.X, ball.Y) < 8 && c.KickCooldown <= 0 {
		opponentGoalX := PitchX - GoalW/2
		if c.Team == "left" {
			opponentGoalX = PitchX + PitchW + GoalW/2
		}
		chickenToBall := AngleBetween(c.X, c.Y, ball.X, ball.Y)
		ballToGoal := AngleBetween(ball.X, ball.Y, opponentGoalX, PitchY+PitchH/2)
		kickAngle := LerpAngle(chickenToBall, ballToGoal, 0.6)
		kickAngle += rng.Float64()*0.6 - 0.3
		ball.Kick(kickAngle, 2.5)
		c.KickCooldown = 0.15
	}
}

func cos(v float64) float64 { return math.Cos(v) }
func sin(v float64) float64 { return math.Sin(v) }
