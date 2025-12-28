// import type {
// 	ServerLoadDecorator,
// 	ActionsDecorator,
// 	ApiDecorator,
// 	RemoteFunctionDecorator
// } from 'vite-plugin-sveltekit-decorators'

// export const loadDecorator: ServerLoadDecorator = (originalFunction, metadata) => {
// 	return async (event) => {
// 		console.log(`Loading ${metadata.functionName}...`)
// 		const result = await originalFunction(event)
// 		console.log(`Loaded ${metadata.functionName} successfully`)
// 		return result
// 	}
// }

// export const actionsDecorator: ActionsDecorator = (originalFunction, metadata) => {
// 	return async (event) => {
// 		console.log(`Executing action ${metadata.action}...`)
// 		return await originalFunction(event)
// 	}
// }

// export const apiDecorator: ApiDecorator = (originalFunction, metadata) => {
// 	return async (event) => {
// 		console.log(`API ${metadata.method} request to ${metadata.functionName}`)
// 		return await originalFunction(event)
// 	}
// }

// export const remoteFunctionDecorator: RemoteFunctionDecorator = (originalFunction, metadata) => {
// 	return async (...args) => {
// 		console.log(`Calling remote function ${metadata.functionName}...`)
// 		const result = await originalFunction(...args)
// 		console.log(`Remote function ${metadata.functionName} completed`)
// 		return result
// 	}
// }
