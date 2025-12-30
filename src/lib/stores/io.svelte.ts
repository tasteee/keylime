import projectStore from './project.svelte'
import { asCleanAsync } from '$lib/modules/promises'

type MessageT = {
	id: string
	// note: failedToSaveProject is the same as failedToUpdateProject, but different "kind" so we know if the failure came from the project settings dialog or the save button.
	kind:
		| 'failedToSaveProject'
		| 'failedToLoadProject'
		| 'failedToDownloadMidi'
		| 'failedToCloneProject'
		| 'failedToFollowUser'
		| 'failedToFavoriteProject'
		| 'failedToUnfavoriteProject'
		| 'failedToUnfollowUser'
		| 'failedToCreateNewProject'
		| 'failedToUpdateProject'
	color: 'neutral' | 'red' | 'orange' | 'green'
	title: string
	body: string
	timeout?: number
	actionText?: string
	onAction?: () => void
	onClear?: () => void
	createdAt: number
}

// for example, user clicks save, save fails.
// we add message color red title "failed saving" body "failed to save project"
// timeout 10000, actionText "Retry" onAction retryFunction to retry saving.
// not all messages have timeout, or action, and handling clear is optional too.

// ALL messages that will ever be sent should be predetermined with creators.
// all message objects should have template class.

class FailedToSaveProjectMessage {
	color = 'red'
	title = 'Failed to Save Project'
	body = 'There was an error saving your project. Please try again.'
	timeout = 10000
	actionText = 'Retry'

	@asCleanAsync
	action = async () => {
		const saveResult = await projectStore.save()
		// TODO: if fails again...???
	}
}

class IOStore {
	messages = $state([]) as MessageT[]
}
