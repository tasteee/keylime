// TODO: Publish this as an npm package.
// https://npmjs.com/package/the-awaited

export class TheAwaitedReturnT<ReturnT = any> extends Array<Error | null | ReturnT> {
	error: Error | null
	data: ReturnT | null

	constructor(error: Error | null, data: ReturnT | null) {
		super(error, data)
		this.error = error
		this.data = data
	}
}

export const awaited = async <T = any>(promise: any): Promise<TheAwaitedReturnT<T>> => {
	try {
		const data = await promise
		return new TheAwaitedReturnT<T>(null, data)
	} catch (error) {
		const errorObject = error instanceof Error ? error : new Error(String(error))
		return new TheAwaitedReturnT<T>(errorObject, null)
	}
}

/*

## Usage

import { awaited } from 'the-awaited'

// This async function has a 50/50 chance of failing.

const doSomethingThatMightFailOrPass = async () => {
  const determinator = Math.random()
  const didSucceed = determinator > 0.5
  if (!didSucceed) throw new Error('You died.')
  return { didSucceed, noun: 'girl' }
}

// You can access the error and/or resulting data of an async function
// by treating the returned value from `awaited` as an iterable, accessing
// any possible thrown error as the first element of the array, and the resulting
// data (if no error occured) as the second element, as seen here in these examples
// meant to be easy for even beginners to understand:

const iteratorExample0 = async () => {
  const theAwaited = doSomethingThatMightFailOrPass()
  const result = await awaited(theAwaited)
  if (result[0]) return handleTheError(result[0])
  return handleTheData(result[1])
}

const iteratorExample1 = async () => {
  const theAwaited = doSomethingThatMightFailOrPass()
  const result = await awaited(theAwaited)
  const error = result[0]
  const data = result[1]
  if (error) return handleTheError(error)
  return handleTheData(data)
}

const iteratorExample2 = async () => {
  const theAwaited = doSomethingThatMightFailOrPass()
  const result = await awaited(theAwaited)
  const [error, data] = result
  if (error) return handleTheError(error)
  return handleTheData(data)
}

// Alternatively, you can treat the returned value as an object
// with `error` and `data` properties, as seen in these examples that
// also aim to be as clear as possible for beginners:

const objectExample0 = async () => {
  const theAwaited = doSomethingThatMightFailOrPass()
  const result = await awaited(theAwaited)
  if (result.error) return handleTheError(result.error)
  return handleTheData(result.data)
}

const objectExample1 = async () => {
  const theAwaited = doSomethingThatMightFailOrPass()
  const result = await awaited(theAwaited)
  const error = result.error
  const data = result.data
  if (error) return handleTheError(error)
  return handleTheData(data)
}

// If you don't like "error" and "data", fuck it, throw some
// Sriacha on it and call it mexican cuisine:

import { awaited } from 'the-awaited'

export const toAwaited = async (promise) => {
 const result = await awaited(promise)
 return { theError: result.error, theData: result.data }
}

const customToAwaitedExample = async () => {
  const theAwaited = doSomethingThatMightFailOrPass()
  const result = await toAwaited(theAwaited)
  if (result.theError) return handleTheError(result.theError)
  return handleTheData(result.theData)
}
*/
