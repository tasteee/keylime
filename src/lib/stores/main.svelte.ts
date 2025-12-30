class MainStore {
	isInputFocused = $state(false)
	private focusTimeoutId: ReturnType<typeof setTimeout> | null = null

	setInputFocused = () => {
		if (this.focusTimeoutId) clearTimeout(this.focusTimeoutId)

		this.focusTimeoutId = setTimeout(() => {
			this.isInputFocused = true
			this.focusTimeoutId = null
		}, 35)
	}

	setInputBlurred = () => {
		if (this.focusTimeoutId) {
			clearTimeout(this.focusTimeoutId)
			this.focusTimeoutId = null
		}

		this.isInputFocused = false
	}
}

const mainStore = new MainStore()
export default mainStore
