import GENERAL_CONFIG from '$lib/constants/general.json'
import store from 'store'

const getInitialMinVelocity = () => {
	const storedMinVelocity = store.get('output.minVelocity')
	return storedMinVelocity !== undefined ? storedMinVelocity : GENERAL_CONFIG.DEFAULT_OUTPUT_MIN_VELOCITY
}

const getInitialMaxVelocity = () => {
	const storedMaxVelocity = store.get('output.maxVelocity')
	return storedMaxVelocity !== undefined ? storedMaxVelocity : GENERAL_CONFIG.DEFAULT_OUTPUT_MAX_VELOCITY
}

class OutputStore {
	type = $state('Instrument') as string
	instrument = $state('piano') as string
	midiDeviceName = $state('') as string
	midiChannel = $state('1') as string
	minVelocity = $state(getInitialMinVelocity()) as number
	maxVelocity = $state(getInitialMaxVelocity()) as number
	volume = $state(70) as number
}

const output = new OutputStore()
export default output
