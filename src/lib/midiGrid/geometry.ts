import { getDisplayRowOfPitch, getPitchAtDisplayRow } from './rows'
import { clampNumber, snapTickToCell, type SnapModeT } from './time'
import type { NoteHitT, NoteT, NoteZoneT, PointT, RectT, ViewT } from './types'

type ViewArgsT = {
	view: ViewT
}

export const getTickAtX = (args: ViewArgsT & { x: number }): number => {
	return args.view.scrollTick + args.x / args.view.pxPerTick
}

export const getXAtTick = (args: ViewArgsT & { tick: number }): number => {
	return (args.tick - args.view.scrollTick) * args.view.pxPerTick
}

export const getDisplayRowAtY = (args: ViewArgsT & { y: number }): number => {
	return args.view.scrollRow + args.y / args.view.rowHeight
}

export const getPitchAtY = (args: ViewArgsT & { y: number }): number => {
	const displayRow = getDisplayRowAtY(args)
	return getPitchAtDisplayRow(displayRow)
}

export const getNoteRect = (args: ViewArgsT & { note: NoteT }): RectT => {
	const view = args.view
	const displayRow = getDisplayRowOfPitch(args.note.pitch)
	return {
		x: (args.note.start - view.scrollTick) * view.pxPerTick,
		y: (displayRow - view.scrollRow) * view.rowHeight,
		width: Math.max(3, args.note.duration * view.pxPerTick),
		height: view.rowHeight
	}
}

type SnapArgsT = {
	tick: number
	mode?: SnapModeT
	// Alt turns snapping off for one gesture.
	isSnapOff?: boolean
}

export const snapTick = (args: SnapArgsT): number => {
	if (args.isSnapOff) return Math.max(0, Math.round(args.tick))
	return snapTickToCell({ tick: args.tick, mode: args.mode ?? 'round' })
}

type HitTestArgsT = ViewArgsT & {
	notes: NoteT[]
	selectedIds: ReadonlySet<string>
	point: PointT
}

const getZoneAtX = (args: { rect: RectT; x: number }): NoteZoneT => {
	const edgeSize = clampNumber({ value: args.rect.width * 0.25, min: 3, max: 8 })
	const rightEdgeStart = args.rect.x + args.rect.width - edgeSize
	const leftEdgeEnd = args.rect.x + edgeSize
	const isOnRightEdge = args.x > rightEdgeStart
	const isOnLeftEdge = args.x < leftEdgeEnd && args.rect.width > 12
	if (isOnRightEdge) return 'end'
	if (isOnLeftEdge) return 'start'
	return 'body'
}

// Selected notes draw on top, so they are tested first.
export const hitTestNote = (args: HitTestArgsT): NoteHitT | null => {
	const point = args.point
	const sorted = [...args.notes].sort((noteA, noteB) => {
		const aWeight = Number(args.selectedIds.has(noteA.id))
		const bWeight = Number(args.selectedIds.has(noteB.id))
		return bWeight - aWeight
	})

	for (const note of sorted) {
		const rect = getNoteRect({ view: args.view, note })
		const isLeftOf = point.x < rect.x
		const isRightOf = point.x > rect.x + rect.width
		const isAbove = point.y < rect.y
		const isBelow = point.y > rect.y + rect.height
		const isMiss = isLeftOf || isRightOf || isAbove || isBelow
		if (isMiss) continue

		const zone = getZoneAtX({ rect, x: point.x })
		return { note, zone }
	}

	return null
}
