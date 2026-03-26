package game

const (
	WorldW = 320.0
	WorldH = 180.0
	PitchX = 20.0
	PitchY = 20.0
	PitchW = 280.0
	PitchH = 140.0
	GoalW  = 6.0
	GoalH  = 40.0
)

var goalTop = PitchY + (PitchH-GoalH)/2
var goalBot = goalTop + GoalH

func InLeftGoal(ball BallState) bool {
	return ball.X-ball.Radius <= PitchX && ball.Y >= goalTop && ball.Y <= goalBot
}

func InRightGoal(ball BallState) bool {
	return ball.X+ball.Radius >= PitchX+PitchW && ball.Y >= goalTop && ball.Y <= goalBot
}
