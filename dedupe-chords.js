const { Chord } = require('tonal');
const fs = require('fs');
const path = require('path');

// Read the scaleChords.json file
const scaleChordPath = path.join(__dirname, 'src/lib/constants/scaleChords.json');
const scaleChords = JSON.parse(fs.readFileSync(scaleChordPath, 'utf8'));

// Normalize chord names (same logic as in chords.ts)
const normalizeChordName = (name) => {
  const rootMatch = name.match(/^[A-G][#b]?/);
  if (!rootMatch) return name;

  const root = rootMatch[0];
  let chordType = name.slice(root.length);

  // Handle parenthesized extensions
  const parenMatch = chordType.match(/^(.+)\((\d+|[#b]?\d+)\)$/);
  if (parenMatch) {
    const baseChord = parenMatch[1];
    const extension = parenMatch[2];

    const isMajor7With11 = baseChord.match(/maj7$/i) && extension === '11';
    if (isMajor7With11) {
      chordType = baseChord + '#11';
    } else {
      const hasSeventhChord = baseChord.match(/7$/);
      if (hasSeventhChord) {
        const baseWithoutSeven = baseChord.slice(0, -1);
        chordType = baseWithoutSeven + extension;
      } else {
        chordType = baseChord + extension;
      }
    }
  }

  return root + chordType;
};

// Get chord notes
const getChordNotes = (chordName) => {
  const normalized = normalizeChordName(chordName);
  const chord = Chord.get(normalized);

  if (chord.empty || chord.notes.length === 0) {
    return null;
  }

  // Sort notes to create a consistent signature
  return chord.notes.slice().sort().join(',');
};

// Process each scale
const dedupedScales = {};
const stats = {};

for (const [scaleName, chords] of Object.entries(scaleChords)) {
  const seen = new Map(); // Map of note signature -> first chord name with those notes
  const uniqueChords = [];
  const duplicates = [];

  for (const chordName of chords) {
    const notesSignature = getChordNotes(chordName);

    if (!notesSignature) {
      console.log(`⚠️  ${scaleName}: "${chordName}" could not be resolved`);
      uniqueChords.push(chordName);
      continue;
    }

    if (seen.has(notesSignature)) {
      const originalChord = seen.get(notesSignature);
      duplicates.push(`${chordName} (same as ${originalChord})`);
    } else {
      seen.set(notesSignature, chordName);
      uniqueChords.push(chordName);
    }
  }

  dedupedScales[scaleName] = uniqueChords;

  stats[scaleName] = {
    original: chords.length,
    unique: uniqueChords.length,
    removed: chords.length - uniqueChords.length,
    duplicates: duplicates
  };
}

// Print statistics
console.log('\n=== Deduplication Statistics ===\n');
let totalOriginal = 0;
let totalUnique = 0;
let totalRemoved = 0;

for (const [scaleName, stat] of Object.entries(stats)) {
  totalOriginal += stat.original;
  totalUnique += stat.unique;
  totalRemoved += stat.removed;

  if (stat.removed > 0) {
    console.log(`${scaleName}:`);
    console.log(`  ${stat.original} → ${stat.unique} chords (removed ${stat.removed})`);
    if (stat.duplicates.length > 0) {
      console.log(`  Duplicates removed:`);
      stat.duplicates.forEach(dup => console.log(`    - ${dup}`));
    }
    console.log('');
  }
}

console.log('=== Summary ===');
console.log(`Total chords: ${totalOriginal} → ${totalUnique}`);
console.log(`Total removed: ${totalRemoved}`);
console.log('');

// Write the deduplicated file
fs.writeFileSync(scaleChordPath, JSON.stringify(dedupedScales, null, 2));
console.log(`✅ Updated ${scaleChordPath}`);
