import { SIGNAL_IDS, SIGNAL_ROWS } from '$lib/constants/signalRows'
import mainStore from './main.svelte'
import { generateChord, applyVoicingAndInversion } from '$lib/helpers/chords'
import { Note } from 'tonal'

// Total progression grid is divided into 64 units
// Each unit = 1/64 of the progression width
const TOTAL_UNITS = 64

class ProgressionStore {
  baseItems: ProgressionItemT[] = $state([])
  selectedItemId: string | null = $state(null)

  // Regenerate all items with startTime calculated
  items = $derived.by(() => {
    let accumulatedStartTime = 0

    return this.baseItems.map((item) => {
      // Calculate startTime based on accumulated duration of previous items
      const startTime = accumulatedStartTime
      accumulatedStartTime += item.durationBeats

      // Return item with calculated startTime
      return {
        ...item,
        startTime
      } as ProgressionItemT
    })
  })

  // Backwards compatibility - returns only chords
  chords = $derived.by(() => {
    return this.items.filter((item) => item.type === 'chord') as ProgressionChordT[]
  })

  getItem = (id: string): ProgressionItemT | undefined => {
    const finder = (item: ProgressionItemT) => item.id === id
    return this.baseItems.find(finder)
  }

  getChord = (id: string): ProgressionChordT | undefined => {
    const item = this.getItem(id)
    if (item?.type === 'chord') return item
    return undefined
  }

  getTotalDuration = (): number => {
    if (!this.baseItems.length) return 0
    return this.baseItems.reduce((total, item) => total + item.durationBeats, 0)
  }

  addChord = (chord: ChordT) => {
    const chordWithTimelineData: ProgressionChordT = {
      ...chord,
      type: 'chord',
      startTime: 0, // Will be calculated in derived
      durationBeats: 4 // Default to 4 beats
    }

    // Insert after selected item if one exists, otherwise append to end
    const hasSelectedItem = this.selectedItemId !== null
    if (hasSelectedItem) {
      const selectedIndex = this.baseItems.findIndex((item) => item.id === this.selectedItemId)
      if (selectedIndex !== -1) {
        const newItems = [...this.baseItems]
        newItems.splice(selectedIndex + 1, 0, chordWithTimelineData)
        this.baseItems = newItems
      } else {
        this.baseItems = [...this.baseItems, chordWithTimelineData]
      }
    } else {
      this.baseItems = [...this.baseItems, chordWithTimelineData]
    }

    // Automatically select the newly added chord
    this.selectedItemId = chordWithTimelineData.id
  }

  addRest = () => {
    const restItem: ProgressionRestT = {
      id: `rest-${Date.now()}`,
      type: 'rest',
      symbol: 'REST',
      rootNote: 'REST',
      startTime: 0, // Will be calculated in derived
      durationBeats: 4 // Default to 4 beats
    }

    // Insert after selected item if one exists, otherwise append to end
    const hasSelectedItem = this.selectedItemId !== null
    if (hasSelectedItem) {
      const selectedIndex = this.baseItems.findIndex((item) => item.id === this.selectedItemId)
      if (selectedIndex !== -1) {
        const newItems = [...this.baseItems]
        newItems.splice(selectedIndex + 1, 0, restItem)
        this.baseItems = newItems
      } else {
        this.baseItems = [...this.baseItems, restItem]
      }
    } else {
      this.baseItems = [...this.baseItems, restItem]
    }

    // Automatically select the newly added rest
    this.selectedItemId = restItem.id
  }

  removeItem = (id: string) => {
    const wasSelected = this.selectedItemId === id
    this.baseItems = this.baseItems.filter((item) => item.id !== id)

    // Only deselect if the selected item was deleted and no items remain
    if (wasSelected) {
      const hasItemsRemaining = this.baseItems.length > 0
      if (hasItemsRemaining) {
        // Select the last item in the progression
        const lastItem = this.baseItems[this.baseItems.length - 1]
        this.selectedItemId = lastItem.id
      } else {
        // No items left, deselect
        this.selectedItemId = null
      }
    }
  }

  // Backwards compatibility
  removeChord = (id: string) => {
    this.removeItem(id)
  }

  updateItem = (updatedItem: Partial<ProgressionItemT>) => {
    this.baseItems = this.baseItems.map((item) => {
      const isTargetItem = item.id === updatedItem.id
      if (!isTargetItem) return item

      const mergedItem = { ...item, ...updatedItem }
      return mergedItem as ProgressionItemT
    })
  }

  // Backwards compatibility
  updateChord = (updatedChord: Partial<ProgressionChordT>) => {
    this.updateItem(updatedChord)
  }

  selectItem = (id: string | null) => {
    this.selectedItemId = id
  }

  // Backwards compatibility
  selectChord = (id: string | null) => {
    this.selectItem(id)
  }

  deleteSelectedItem = () => {
    const hasSelectedItem = this.selectedItemId !== null
    if (hasSelectedItem) {
      this.removeItem(this.selectedItemId as string)
    }
  }

  // Backwards compatibility
  deleteSelectedChord = () => {
    this.deleteSelectedItem()
  }

  duplicateSelectedItem = () => {
    const hasSelectedItem = this.selectedItemId !== null
    if (!hasSelectedItem) return

    const originalItem = this.getItem(this.selectedItemId as string)
    if (!originalItem) return

    const duplicatedItem: ProgressionItemT = {
      ...originalItem,
      id: `${originalItem.id}-${Date.now()}`,
      startTime: 0 // Will be calculated in derived
    } as ProgressionItemT

    // Insert right after the selected item
    const selectedIndex = this.baseItems.findIndex((item) => item.id === this.selectedItemId)
    if (selectedIndex !== -1) {
      const newItems = [...this.baseItems]
      newItems.splice(selectedIndex + 1, 0, duplicatedItem)
      this.baseItems = newItems
    } else {
      this.baseItems = [...this.baseItems, duplicatedItem]
    }

    this.selectedItemId = duplicatedItem.id
  }

  // Backwards compatibility
  duplicateSelectedChord = () => {
    this.duplicateSelectedItem()
  }

  reorderItem = (args: { itemId: string; newIndex: number }) => {
    const itemIndex = this.baseItems.findIndex(item => item.id === args.itemId)
    if (itemIndex === -1) return

    const item = this.baseItems[itemIndex]
    const newItems = [...this.baseItems]
    newItems.splice(itemIndex, 1)
    newItems.splice(args.newIndex, 0, item)

    this.baseItems = newItems
  }

  // Backwards compatibility
  reorderChord = (args: { chordId: string; newIndex: number }) => {
    this.reorderItem({ itemId: args.chordId, newIndex: args.newIndex })
  }
}

const progressionStore = new ProgressionStore()
export { progressionStore }