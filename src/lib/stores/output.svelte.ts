class OutputStore {
  type = $state('Instrument') as string;
  instrument = $state('piano') as string;
  midiDeviceName = $state('') as string;
  midiChannel = $state('1') as string;
  minVelocity = $state(70) as number;
  maxVelocity = $state(80) as number;
  volume = $state(70) as number;
}

const output = new OutputStore();
export default output;
