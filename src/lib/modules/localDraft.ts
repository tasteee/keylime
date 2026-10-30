// Unsaved edits live in this browser until the user saves.
// Nothing here touches the network, so editing costs no requests.
// A draft is only used if the server copy hasn't changed since
// the draft started (same baseUpdatedAt).

const DRAFT_PREFIX = 'keylime:draft:'

type DraftT = {
  savedAt: number
  baseUpdatedAt: string
  project: ProjectT
}

const toIsoText = (value: Date | string): string => new Date(value).toISOString()

export const writeDraft = (project: ProjectT, baseUpdatedAt: Date | string) => {
  try {
    const draft: DraftT = { savedAt: Date.now(), baseUpdatedAt: toIsoText(baseUpdatedAt), project }
    localStorage.setItem(`${DRAFT_PREFIX}${project.id}`, JSON.stringify(draft))
  } catch {
    // Storage full or blocked. Editing still works, it just won't survive a reload.
  }
}

export const readDraft = (projectId: string, serverUpdatedAt: Date | string): ProjectT | null => {
  try {
    const text = localStorage.getItem(`${DRAFT_PREFIX}${projectId}`)
    if (!text) return null
    const draft = JSON.parse(text) as DraftT
    const isSameBase = draft.baseUpdatedAt === toIsoText(serverUpdatedAt)
    if (!isSameBase) {
      clearDraft(projectId)
      return null
    }
    return draft.project
  } catch {
    return null
  }
}

export const clearDraft = (projectId: string) => {
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${projectId}`)
  } catch {
    // Nothing to clear.
  }
}
