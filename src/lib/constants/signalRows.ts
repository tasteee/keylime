const SIGNAL_IDS_0 = ['N1-2', 'N2-2', 'N3-2', 'N4-2', 'N5-2', 'N6-2', 'N7-2', 'N8-2']
const SIGNAL_IDS_1 = ['N1-1', 'N2-1', 'N3-1', 'N4-1', 'N5-1', 'N6-1', 'N7-1', 'N8-1']
const SIGNAL_IDS_2 = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8']
const SIGNAL_IDS_3 = ['N1+1', 'N2+1', 'N3+1', 'N4+1', 'N5+1', 'N6+1', 'N7+1', 'N8+1']
const SIGNAL_IDS_4 = ['N1+2', 'N2+2', 'N3+2', 'N4+2', 'N5+2', 'N6+2', 'N7+2', 'N8+2']
export const SIGNAL_IDS = [SIGNAL_IDS_0, SIGNAL_IDS_1, SIGNAL_IDS_2, SIGNAL_IDS_3, SIGNAL_IDS_4].flat().reverse()

export const SIGNAL_ROWS: SignalRowsT = {
	N1: {
		id: 'N1',
		label: 'N1',
		totalIndex: 16,
		index: 7,
		octave: 0,
		signalIds: []
	},
	N2: {
		id: 'N2',
		label: 'N2',
		totalIndex: 17,
		index: 6,
		octave: 0,
		signalIds: []
	},
	N3: {
		id: 'N3',
		label: 'N3',
		totalIndex: 18,
		index: 5,
		octave: 0,
		signalIds: []
	},
	N4: {
		id: 'N4',
		label: 'N4',
		totalIndex: 19,
		index: 4,
		octave: 0,
		signalIds: []
	},
	N5: {
		id: 'N5',
		label: 'N5',
		totalIndex: 20,
		index: 3,
		octave: 0,
		signalIds: []
	},
	N6: {
		id: 'N6',
		label: 'N6',
		totalIndex: 21,
		index: 2,
		octave: 0,
		signalIds: []
	},
	N7: {
		id: 'N7',
		label: 'N7',
		totalIndex: 22,
		index: 1,
		octave: 0,
		signalIds: []
	},
	N8: {
		id: 'N8',
		label: 'N8',
		totalIndex: 23,
		index: 0,
		octave: 0,
		signalIds: []
	},

	'N1+1': {
		id: 'N1+1',
		label: 'N1',
		totalIndex: 24,
		index: 7,
		octave: 1,
		signalIds: []
	},
	'N2+1': {
		id: 'N2+1',
		label: 'N2',
		totalIndex: 25,
		index: 6,
		octave: 1,
		signalIds: []
	},
	'N3+1': {
		id: 'N3+1',
		label: 'N3',
		totalIndex: 26,
		index: 5,
		octave: 1,
		signalIds: []
	},
	'N4+1': {
		id: 'N4+1',
		label: 'N4',
		totalIndex: 27,
		index: 4,
		octave: 1,
		signalIds: []
	},
	'N5+1': {
		id: 'N5+1',
		label: 'N5',
		totalIndex: 28,
		index: 3,
		octave: 1,
		signalIds: []
	},
	'N6+1': {
		id: 'N6+1',
		label: 'N6',
		totalIndex: 29,
		index: 2,
		octave: 1,
		signalIds: []
	},
	'N7+1': {
		id: 'N7+1',
		label: 'N7',
		totalIndex: 30,
		index: 1,
		octave: 1,
		signalIds: []
	},
	'N8+1': {
		id: 'N8+1',
		label: 'N8',
		totalIndex: 31,
		index: 0,
		octave: 1,
		signalIds: []
	},

	'N1+2': {
		id: 'N1+2',
		label: 'N1',
		totalIndex: 32,
		index: 7,
		octave: 2,
		signalIds: []
	},
	'N2+2': {
		id: 'N2+2',
		label: 'N2',
		totalIndex: 33,
		index: 6,
		octave: 2,
		signalIds: []
	},
	'N3+2': {
		id: 'N3+2',
		label: 'N3',
		totalIndex: 34,
		index: 5,
		octave: 2,
		signalIds: []
	},
	'N4+2': {
		id: 'N4+2',
		label: 'N4',
		totalIndex: 35,
		index: 4,
		octave: 2,
		signalIds: []
	},
	'N5+2': {
		id: 'N5+2',
		label: 'N5',
		totalIndex: 36,
		index: 3,
		octave: 2,
		signalIds: []
	},
	'N6+2': {
		id: 'N6+2',
		label: 'N6',
		totalIndex: 37,
		index: 2,
		octave: 2,
		signalIds: []
	},
	'N7+2': {
		id: 'N7+2',
		label: 'N7',
		totalIndex: 38,
		index: 1,
		octave: 2,
		signalIds: []
	},
	'N8+2': {
		id: 'N8+2',
		label: 'N8',
		totalIndex: 39,
		index: 0,
		octave: 2,
		signalIds: []
	},

	'N1-1': {
		id: 'N1-1',
		label: 'N1',
		totalIndex: 0,
		index: 7,
		octave: -1,
		signalIds: []
	},
	'N2-1': {
		id: 'N2-1',
		label: 'N2',
		totalIndex: 1,
		index: 6,
		octave: -1,
		signalIds: []
	},
	'N3-1': {
		id: 'N3-1',
		label: 'N3',
		totalIndex: 2,
		index: 5,
		octave: -1,
		signalIds: []
	},
	'N4-1': {
		id: 'N4-1',
		label: 'N4',
		totalIndex: 3,
		index: 4,
		octave: -1,
		signalIds: []
	},
	'N5-1': {
		id: 'N5-1',
		label: 'N5',
		totalIndex: 4,
		index: 3,
		octave: -1,
		signalIds: []
	},
	'N6-1': {
		id: 'N6-1',
		label: 'N6',
		totalIndex: 5,
		index: 2,
		octave: -1,
		signalIds: []
	},
	'N7-1': {
		id: 'N7-1',
		label: 'N7',
		totalIndex: 6,
		index: 1,
		octave: -1,
		signalIds: []
	},
	'N8-1': {
		id: 'N8-1',
		label: 'N8',
		totalIndex: 7,
		index: 0,
		octave: -1,
		signalIds: []
	},

	'N1-2': {
		id: 'N1-2',
		label: 'N1',
		totalIndex: 8,
		index: 7,
		octave: -2,
		signalIds: []
	},
	'N2-2': {
		id: 'N2-2',
		label: 'N2',
		totalIndex: 9,
		index: 6,
		octave: -2,
		signalIds: []
	},
	'N3-2': {
		id: 'N3-2',
		label: 'N3',
		totalIndex: 10,
		index: 5,
		octave: -2,
		signalIds: []
	},
	'N4-2': {
		id: 'N4-2',
		label: 'N4',
		totalIndex: 11,
		index: 4,
		octave: -2,
		signalIds: []
	},
	'N5-2': {
		id: 'N5-2',
		label: 'N5',
		totalIndex: 12,
		index: 3,
		octave: -2,
		signalIds: []
	},
	'N6-2': {
		id: 'N6-2',
		label: 'N6',
		totalIndex: 13,
		index: 2,
		octave: -2,
		signalIds: []
	},
	'N7-2': {
		id: 'N7-2',
		label: 'N7',
		totalIndex: 14,
		index: 1,
		octave: -2,
		signalIds: []
	},
	'N8-2': {
		id: 'N8-2',
		label: 'N8',
		totalIndex: 15,
		index: 0,
		octave: -2,
		signalIds: []
	}
}
