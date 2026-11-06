export type NoteT = {
	id: string
	// 0 is the bottom row (N1 of the lowest band).
	pitch: number
	// Ticks from the start of the pattern.
	start: number
	duration: number
	// 0 - 1
	velocity: number
	isMuted: boolean
	modifiedTime: number
}

export type NoteDraftT = {
	id?: string
	pitch: number
	start: number
	duration: number
	velocity: number
	isMuted?: boolean
}

export type ViewT = {
	pxPerTick: number
	rowHeight: number
	scrollTick: number
	// Fractional row at the top edge. Row 0 is the highest pitch.
	scrollRow: number
	// Where paste lands. Set by clicking the grid or the ruler.
	cursorTick: number
	// Velocity for new notes. Follows the last velocity the user set.
	noteVelocity: number
	// Length for new notes. Follows the last note the user resized.
	noteLength: number | null
}

export type ViewportT = {
	width: number
	height: number
}

export type PointT = {
	x: number
	y: number
}

export type RectT = {
	x: number
	y: number
	width: number
	height: number
}

export type NoteZoneT = 'body' | 'start' | 'end'

export type NoteHitT = {
	note: NoteT
	zone: NoteZoneT
}

export type SelectModeT = 'replace' | 'add' | 'toggle' | 'remove'

// Notes shown during a drag, before anything is committed.
export type PreviewT = {
	overrides: Map<string, NoteT>
	added: NoteT[]
}

export type NoteChangesT = {
	added: NoteT[]
	updated: NoteT[]
	removedIds: string[]
}

export type GestureT = {
	move: (event: PointerEvent) => void
	up: (event: PointerEvent) => void
	cancel: () => void
}
