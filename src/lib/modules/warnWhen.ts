import warning from 'tiny-warning'

type WarningHandlerT<DataT = any> = (data: DataT) => string | null

const preparedWarnings = new Map<string, WarningHandlerT>()

type WarnWhenFunctionT = {
	(condition: any, message: string): void
	prepare: <DataT = any>(key: string, handler: WarningHandlerT<DataT>) => void
	test: <DataT = any>(key: string, data: DataT) => void
}

const warnWhen: WarnWhenFunctionT = (condition: any, message: string) => {
	warning(!condition, message)
}

warnWhen.prepare = <DataT = any>(key: string, handler: WarningHandlerT<DataT>) => {
	preparedWarnings.set(key, handler)
}

warnWhen.test = <DataT = any>(key: string, data: DataT) => {
	const handler = preparedWarnings.get(key)
	if (!handler) return warning(false, `[warnWhen.test] Warning key "${key}" has not been prepared`)
	const message = handler(data)
	if (message === null) return
	warning(false, message)
}

export { warnWhen }
