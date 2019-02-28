import { Request } from '@/contracts/Request'

/**
 * The heart of Awi - the interceptor type used in every .use call. It takes the
 * current state of the request and the users callback edits the contents.
 */
export type Interceptor = (request: Request) => Promise<any>

/**
 * A nice utility type for Awi listeners. Every listener can intercept both the
 * request and the response.
 */
// declare type AwiListener = (request: AwiRequest) => Promise<void>
