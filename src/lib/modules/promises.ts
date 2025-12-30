import { awaited, type TheAwaitedReturnT } from './the-awaited'

export type CleanAsyncReturnT<SuccessReturnT> = {
	error: string | null
	data: SuccessReturnT | null
}

export const cleanAsync = <ReturnT>(fn: (...args: any[]) => Promise<ReturnT>) => {
	return async (...args: any[]): Promise<CleanAsyncReturnT<ReturnT>> => {
		const result = await awaited(fn(...args))
		if (result.error) return { error: result.error.message, data: null }
		return { error: null, data: result.data }
	}
}

export const asCleanAsync = <OriginalFunctionT extends (...args: any[]) => Promise<any>>(
	target: any,
	propertyKey: string
): any => {
	let originalMethod: any

	return {
		enumerable: true,
		configurable: true,

		get() {
			return originalMethod
		},

		set(fn: OriginalFunctionT) {
			type UnwrappedReturnT = Awaited<ReturnType<OriginalFunctionT>>
			type WrappedReturnT = Promise<CleanAsyncReturnT<UnwrappedReturnT>>

			originalMethod = async (...args: Parameters<OriginalFunctionT>): WrappedReturnT => {
				const result = await awaited(fn.apply(this, args))
				if (result.error) {
					return { error: result.error.message, data: null } as any
				}
				return { error: null, data: result.data } as any
			}
		}
	}
}
