// GitHub Pages has no server. Remove server-only files so
// the client never requests __data.json or /api routes.
import { readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

const serverOnlyPaths = ['src/hooks.server.ts', 'src/+decorators.server.ts', 'src/routes/api']

const isServerRouteFile = (fileName) => /^\+(layout|page)\.server\./.test(fileName)

const removeServerRouteFiles = (directoryPath) => {
	const entryNames = readdirSync(directoryPath)
	for (const entryName of entryNames) {
		const entryPath = join(directoryPath, entryName)
		const isDirectory = statSync(entryPath).isDirectory()
		if (isDirectory) removeServerRouteFiles(entryPath)
		if (isServerRouteFile(entryName)) rmSync(entryPath)
	}
}

for (const serverOnlyPath of serverOnlyPaths) rmSync(serverOnlyPath, { recursive: true, force: true })
removeServerRouteFiles('src/routes')
console.log('Removed server-only files for the Pages build.')
