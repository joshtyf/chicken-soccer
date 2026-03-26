package game

import "math"

func Dist(ax, ay, bx, by float64) float64 {
	dx := ax - bx
	dy := ay - by
	return math.Sqrt(dx*dx + dy*dy)
}

func Clamp(v, minV, maxV float64) float64 {
	if v < minV {
		return minV
	}
	if v > maxV {
		return maxV
	}
	return v
}

func AngleBetween(ax, ay, bx, by float64) float64 {
	return math.Atan2(by-ay, bx-ax)
}

func LerpAngle(a, b, t float64) float64 {
	diff := math.Atan2(math.Sin(b-a), math.Cos(b-a))
	return a + diff*t
}
