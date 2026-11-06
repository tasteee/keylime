export const getProgressionTotalDuration = (progressionItems: ProgressionItemT[]): number => {
  if (!progressionItems.length) return 0
  return progressionItems.reduce((total, item) => total + item.durationBeats, 0)
}

type CalculateStartTimesArgsT = {
  items: ProgressionItemT[]
}

export const calculateStartTimes = (args: CalculateStartTimesArgsT): ProgressionItemT[] => {
  let accumulatedTime = 0
  return args.items.map((item) => {
    const itemWithStartTime = {
      ...item,
      startTime: accumulatedTime
    }
    accumulatedTime += item.durationBeats
    return itemWithStartTime
  })
}
