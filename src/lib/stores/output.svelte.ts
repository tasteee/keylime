import GENERAL_CONFIG from '$lib/constants/general.json'
import store from 'store'


const getInitialMinVelocity = () => {
  const storedMinVelocity = store.get('output.minVelocity')
  return storedMinVelocity !== undefined
    ? storedMinVelocity
    : GENERAL_CONFIG.DEFAULT_OUTPUT_MIN_VELOCITY
}

const getInitialMaxVelocity = () => {
  const storedMaxVelocity = store.get('output.maxVelocity')
  return storedMaxVelocity !== undefined
    ? storedMaxVelocity
    : GENERAL_CONFIG.DEFAULT_OUTPUT_MAX_VELOCITY
}

export type ChordPreviewModeT = 'chord' | 'pattern'

const getInitialChordPreviewMode = (): ChordPreviewModeT => {
  const storedMode = store.get('output.chordPreviewMode')
  return storedMode === 'pattern' ? 'pattern' : 'chord'
}

const DEFAULT_METRONOME_VOLUME = 50

const getInitialIsMetronomeEnabled = (): boolean => {
  const storedValue = store.get('output.isMetronomeEnabled')
  return storedValue === true
}

const getInitialMetronomeVolume = (): number => {
  const storedVolume = store.get('output.metronomeVolume')
  const isValidVolume = typeof storedVolume === 'number'
  return isValidVolume ? storedVolume : DEFAULT_METRONOME_VOLUME
}

class OutputStore {
  // What clicking a chord plays: the chord outright, or the pattern over it.
  chordPreviewMode = $state(getInitialChordPreviewMode()) as ChordPreviewModeT;
  type = $state('Instrument') as string;
  instrument = $state('piano') as string;
  midiDeviceName = $state('') as string;
  midiChannel = $state('1') as string;
  minVelocity = $state(getInitialMinVelocity()) as number;
  maxVelocity = $state(getInitialMaxVelocity()) as number;
  volume = $state(70) as number;
  isMetronomeEnabled = $state(getInitialIsMetronomeEnabled()) as boolean;
  metronomeVolume = $state(getInitialMetronomeVolume()) as number;
}

const output = new OutputStore();
export default output;
