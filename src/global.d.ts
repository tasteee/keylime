type SignalRowT = {
	id: string
	label: string
	totalIndex: number
	index: number
	octave: number
	signalIds: string[]
}

type SignalRowsT = {
	[key: string]: SignalRowT
}

type SignalT = {
	id: string
	startTime: number // ticks
	noteIndex: number
	velocity: number
	duration: number // ticks
	octaveOffset: number
	modifiedTime?: number
}
