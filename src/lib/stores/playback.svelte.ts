import { SplendidGrandPiano, Soundfont } from 'smplr';
import output from './output.svelte.js';

import { OutputChannel, WebMidi } from 'webmidi';

const getRandomBetween = (min, max) => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getMidiOutput = () => {
	if (output.type !== 'MIDI') return null;
	if (!output.midiChannel) return output;
	if (output.midiChannel === 'All') return output;
	const midiOutput = WebMidi.getOutputByName(output.midiDeviceName);
	const channel = parseInt(output.midiChannel, 10);
	return midiOutput.channels[channel] as OutputChannel;
};

class PlaybackStore {
	context = $state(null) as unknown as AudioContext;
	piano = $state(null) as unknown as SplendidGrandPiano;

	load = () => {
		this.context = new AudioContext();
		this.piano = new SplendidGrandPiano(this.context);
	};

	play = (note: string) => {
		console.log('play note', note);
		const midiOutput = getMidiOutput();
		const velocity = getRandomBetween(output.minVelocity, output.maxVelocity);
		if (!midiOutput) return this.piano.start({ note, velocity });
		return midiOutput.playNote(note, { attack: velocity / 1000 });
	};

	stop = (note: string) => {
		const midiOutput = getMidiOutput();
		if (!midiOutput) return this.piano.stop({ note });
		return midiOutput.stopNote(note);
	};
}

const playbackStore = new PlaybackStore();
export default playbackStore;
