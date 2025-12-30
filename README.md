# keylime

## ROUTING

```
# Public routes
/ -> splash (if not authed), redirect to /dashboard (if authed)
/auth/login -> login form, redirect to /dashboard (if already authed)
/auth/signup -> signup form, redirect to /dashboard (if already authed)
/auth/forgot-password -> email form, redirect to /dashboard (if authed without token)
/auth/reset-password -> password form (requires token), redirect to /dashboard (if authed without valid token)

# Protected routes (require auth)
/dashboard -> user's project list + activity feed
/projects -> public project browser
/users -> user directory
/users/:userName -> user profile page
/project/:projectId -> project editor (fork if not owner)
```

```json
{
	"id": 123456789,
	"name": "foo",
	"description": "foo bar baz",
	"key": "B",
	"scale": "minor",
	"bpm": 93,
	"baseOctave": 3,
	"instrument": "piano",
	"chords": [
		{
			"name": "Bm",
			"inversion": 0,
			"voicing": "standard",
			"octaveOffset": 0,
			"duration": 48
		},
		{
			"name": "A",
			"inversion": 0,
			"voicing": "standard",
			"octaveOffset": 0,
			"duration": 48
		},
		{
			"name": "Em7",
			"inversion": 0,
			"voicing": "standard",
			"octaveOffset": 0,
			"duration": 96
		}
	],
	"performance": {
		"id": 569192,
		"name": "Jasper's Great Run",
		"description": "foo bar baz",
		"gridResolution": 48,
		"signals": [
			{
				"id": 96859,
				"startTime": 0,
				"noteIndex": 0,
				"velocity": 50,
				"duration": 24,
				"octaveOffset": -1
			},
			{
				"id": 62456,
				"startTime": 24,
				"noteIndex": 3,
				"velocity": 50,
				"duration": 24,
				"octaveOffset": -2
			},
			{
				"id": 54321,
				"startTime": 0,
				"noteIndex": 0,
				"velocity": 50,
				"duration": 12,
				"octaveOffset": 0
			},
			{
				"id": 23414,
				"startTime": 12,
				"noteIndex": 1,
				"velocity": 50,
				"duration": 12,
				"octaveOffset": 0
			},
			{
				"id": 75432,
				"startTime": 24,
				"noteIndex": 3,
				"velocity": 50,
				"duration": 24,
				"octaveOffset": 0
			}
		]
	}
}
```

---

```

var(--a)
var(--a-01)
var(--a-02)
var(--a-03)
var(--a-05)
var(--a-06)
var(--accent)
var(--accent-foreground)
var(--background)
var(--barCount)
var(--barWidth)
var(--beatWidth)
var(--beatsPerBar)
var(--bg-app)
var(--bg-element)
var(--bg-element-active)
var(--bg-element-hover)
var(--bg-panel)
var(--bits-navigation-menu-viewport-height)
var(--bits-navigation-menu-viewport-width)
var(--border)
var(--border-default)
var(--border-strong)
var(--border-subtle)
var(--border-thick)
var(--brandColorBgColor)
var(--brandColorBgColor-active)
var(--brandColorBgColor-disabled)
var(--brandColorBgColor-hover)
var(--brandColorBorderColor)
var(--brandColorBorderColor-active)
var(--brandColorBorderColor-disabled)
var(--brandColorBorderColor-hover)
var(--brandColorTextColor)
var(--brandColorTextColor-disabled)
var(--card)
var(--card-foreground)
var(--cellWidth)
var(--chart-1)
var(--chart-2)
var(--chart-3)
var(--chart-4)
var(--chart-5)
var(--chord-fg)
var(--chord-selected-fg)
var(--color-bg-app)
var(--color-ink)
var(--color-n6)
var(--color-panel-bg)
var(--color-paper)
var(--color-pop-pink)
var(--color-stipple)
var(--color-text-primary)
var(--color-zinc-100)
var(--color-zinc-500)
var(--color-zinc-600)
var(--color-zinc-700)
var(--color-zinc-800)
var(--color-zinc-900)
var(--colorBlack)
var(--colorWhite)
var(--d-00)
var(--d-02)
var(--d-07)
var(--danger-action)
var(--destructive)
var(--ease-smooth)
var(--flows-basicsV2-bg-default)
var(--flows-basicsV2-bg-overlay)
var(--flows-basicsV2-border)
var(--flows-basicsV2-borderRadius-m)
var(--flows-basicsV2-borderRadius-xl)
var(--flows-basicsV2-borderWidth)
var(--flows-basicsV2-fg-default)
var(--flows-basicsV2-modal-overlayBackground)
var(--flows-basicsV2-modal-size-medium)
var(--flows-basicsV2-shadow-large)
var(--flows-basicsV2-size-xl)
var(--flows-basicsV2-size-xxl)
var(--font-display)
var(--font-mono)
var(--font-sans)
var(--foreground)
var(--grayscale10)
var(--input)
var(--largeSizeFontSize)
var(--largeSizeHeight)
var(--largeSizePaddingX)
var(--largeSizePaddingY)
var(--mediumSizeFontSize)
var(--mediumSizeHeight)
var(--mediumSizePaddingX)
var(--mediumSizePaddingY)
var(--muted)
var(--muted-foreground)
var(--n-00)
var(--n-01)
var(--n-02)
var(--n-03)
var(--n-04)
var(--n-05)
var(--n-06)
var(--n-08)
var(--n-09)
var(--n-10)
var(--n-alpha-1)
var(--n-alpha-2)
var(--neutral-actionSecondary)
var(--neutral-background)
var(--neutral-backgroundSubtle)
var(--neutral-cardBackground)
var(--neutral-control)
var(--neutral-separatorSubtle)
var(--neutral-text)
var(--neutral-textMuted)
var(--neutral-textOnPrimary)
var(--neutralColorBgColor)
var(--neutralColorBgColor-active)
var(--neutralColorBgColor-disabled)
var(--neutralColorBgColor-hover)
var(--neutralColorBorderColor)
var(--neutralColorBorderColor-active)
var(--neutralColorBorderColor-disabled)
var(--neutralColorBorderColor-hover)
var(--neutralColorTextColor)
var(--neutralColorTextColor-disabled)
var(--popover)
var(--popover-foreground)
var(--primary)
var(--primary-action)
var(--primary-foreground)
var(--radius)
var(--radius-md)
var(--radius-sm)
var(--red)
var(--red-alpha-1)
var(--red-alpha-3)
var(--redColorBgColor)
var(--redColorBgColor-active)
var(--redColorBgColor-disabled)
var(--redColorBgColor-hover)
var(--redColorBorderColor)
var(--redColorBorderColor-active)
var(--redColorBorderColor-disabled)
var(--redColorBorderColor-hover)
var(--redColorTextColor)
var(--redColorTextColor-disabled)
var(--ring)
var(--ring-offset)
var(--ring-width)
var(--secondary)
var(--secondary-foreground)
var(--shadow-color)
var(--shadow-hard-active)
var(--shadow-inner-top)
var(--shadow-s1)
var(--shadow-s2)
var(--shadow-s4)
var(--shadow-s5)
var(--shadow-sm)
var(--shadow-xs)
var(--sidebar)
var(--sidebar-accent)
var(--sidebar-accent-foreground)
var(--sidebar-border)
var(--sidebar-foreground)
var(--sidebar-primary)
var(--sidebar-primary-foreground)
var(--sidebar-ring)
var(--smallSizeFontSize)
var(--smallSizeHeight)
var(--smallSizePaddingX)
var(--smallSizePaddingY)
var(--stackTextFont)
var(--timeline-grid)
var(--txt-heading)
var(--txt-primary)
var(--txt-secondary)

```
