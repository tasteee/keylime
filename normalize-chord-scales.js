import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const normalizeChordScales = async () => {
  const chordsPath = join(process.cwd(), 'src/lib/constants/chords.json')
  const fileContent = await readFile(chordsPath, 'utf-8')
  const chords = JSON.parse(fileContent)

  const filteredChords = chords.filter((chord) => {
    const hasNo5InType = chord.type && chord.type.includes('no5')
    const hasNo5InSymbol = chord.symbol && chord.symbol.includes('no5')
    const isNo5Chord = hasNo5InType || hasNo5InSymbol
    return !isNo5Chord
  })

  const normalizedChords = filteredChords.map((chord) => {
    const hasScalesArray = Array.isArray(chord.scales)

    if (!hasScalesArray) {
      return {
        ...chord,
        scales: []
      }
    }

    const lowercasedScales = chord.scales.map((scale) => {
      const isString = typeof scale === 'string'
      if (!isString) return scale
      return scale.toLowerCase()
    })

    return {
      ...chord,
      scales: lowercasedScales
    }
  })

  const jsonOutput = JSON.stringify(normalizedChords, null, 2)
  await writeFile(chordsPath, jsonOutput, 'utf-8')

  const removedCount = chords.length - normalizedChords.length

  console.log('✓ Successfully normalized chord scales')
  console.log(`  Processed ${normalizedChords.length} chords`)
  console.log(`  Removed ${removedCount} no5 chords`)
}

normalizeChordScales().catch((error) => {
  console.error('Error normalizing chord scales:', error)
  process.exit(1)
})
