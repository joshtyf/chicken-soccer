package model

type FeedEffect struct {
	Type            string  `json:"type"`
	SpeedMultiplier float64 `json:"speedMultiplier,omitempty"`
	Duration        float64 `json:"duration,omitempty"`
}

type FeedDef struct {
	Key         string      `json:"key"`
	Label       string      `json:"label"`
	Description string      `json:"description"`
	Limited     bool        `json:"limited"`
	Price       *int        `json:"price,omitempty"`
	Effect      *FeedEffect `json:"effect,omitempty"`
}

var FeedDefs = map[string]FeedDef{
	"basic": {
		Key:         "basic",
		Label:       "Basic Feed",
		Description: "Standard distraction feed. Unlimited during matches.",
		Limited:     false,
	},
	"slowness": {
		Key:         "slowness",
		Label:       "Slowness Feed",
		Description: "Slows the chicken that consumes it for 3 seconds.",
		Limited:     true,
		Price:       intPtr(2),
		Effect: &FeedEffect{
			Type:            "slowness",
			SpeedMultiplier: 0.3,
			Duration:        3,
		},
	},
}

func intPtr(v int) *int { return &v }
