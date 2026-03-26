package game

import "math"

type BallState struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	VX     float64 `json:"vx"`
	VY     float64 `json:"vy"`
	Radius float64 `json:"radius"`
}

func NewBall() BallState {
	return BallState{X: PitchX + PitchW/2, Y: PitchY + PitchH/2, Radius: 3}
}

func (b *BallState) Reset() {
	b.X = PitchX + PitchW/2
	b.Y = PitchY + PitchH/2
	b.VX = 0
	b.VY = 0
	b.Radius = 3
}

func (b *BallState) Kick(angle, power float64) {
	b.VX += math.Cos(angle) * power
	b.VY += math.Sin(angle) * power
}

func (b *BallState) Update(dt float64) {
	b.VX *= 0.98
	b.VY *= 0.98
	if math.Abs(b.VX) < 0.01 {
		b.VX = 0
	}
	if math.Abs(b.VY) < 0.01 {
		b.VY = 0
	}
	b.X += b.VX * dt * 60
	b.Y += b.VY * dt * 60

	if b.Y-b.Radius < PitchY {
		b.Y = PitchY + b.Radius
		b.VY = math.Abs(b.VY) * 0.7
	}
	if b.Y+b.Radius > PitchY+PitchH {
		b.Y = PitchY + PitchH - b.Radius
		b.VY = -math.Abs(b.VY) * 0.7
	}
	inGoalY := b.Y > goalTop && b.Y < goalBot
	if b.X-b.Radius < PitchX && !inGoalY {
		b.X = PitchX + b.Radius
		b.VX = math.Abs(b.VX) * 0.7
	}
	if b.X+b.Radius > PitchX+PitchW && !inGoalY {
		b.X = PitchX + PitchW - b.Radius
		b.VX = -math.Abs(b.VX) * 0.7
	}
}
