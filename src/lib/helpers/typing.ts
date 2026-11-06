// Zest fields keep their <input> inside a shadow root, so a window
// listener sees a retargeted event.target (the z-input host). Look
// through the whole composed path to find a real text field.
export const isTypingInTextField = (event: Event): boolean => {
	const eventPath = event.composedPath()
	return eventPath.some((node) => node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)
}
