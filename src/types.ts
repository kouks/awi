import { Request } from '@/contracts/Request'

/**
 * The heart of Awi - the interceptor type used in every .use call. It takes the
 * current state of the request and the users callback edits the contents.
 */
export type Interceptor = (request: Request) => Promise<any>
