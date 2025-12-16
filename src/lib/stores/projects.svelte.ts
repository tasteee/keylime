import { browser } from '$app/environment'

export type ProjectSummaryT = {
	id: string
	title: string
	description: string
	updatedAt: Date
	bpm: number
	key: string
	scale: string
}

const MOCK_PROJECTS: ProjectSummaryT[] = [
	{
		id: 'proj_1',
		title: 'Summer Vibes',
		description: 'Upbeat pop track with catchy chords',
		updatedAt: new Date('2023-06-15T10:30:00'),
		bpm: 120,
		key: 'C',
		scale: 'Major'
	},
	{
		id: 'proj_2',
		title: 'Lo-Fi Study',
		description: 'Chill beats for relaxing',
		updatedAt: new Date('2023-06-14T15:45:00'),
		bpm: 85,
		key: 'Eb',
		scale: 'Minor'
	},
	{
		id: 'proj_3',
		title: 'Cyberpunk Theme',
		description: 'Dark synthwave progression',
		updatedAt: new Date('2023-06-10T09:20:00'),
		bpm: 140,
		key: 'F#',
		scale: 'Phrygian'
	}
]

class ProjectsStore {
	projects = $state<ProjectSummaryT[]>([])

	constructor() {
		if (browser) {
			// Load from local storage or use mock
			this.projects = MOCK_PROJECTS
		}
	}

	addProject = (project: ProjectSummaryT) => {
		this.projects = [project, ...this.projects]
	}

	deleteProject = (id: string) => {
		this.projects = this.projects.filter((p) => p.id !== id)
	}

	createProject = () => {
		const newProject: ProjectSummaryT = {
			id: crypto.randomUUID(),
			title: 'New Project',
			description: '',
			updatedAt: new Date(),
			bpm: 120,
			key: 'C',
			scale: 'Major'
		}
		this.addProject(newProject)
		return newProject.id
	}
}

const projectsStore = new ProjectsStore()
export default projectsStore
