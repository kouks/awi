import { Request } from '@/contracts/Request'

/**
 * The heart of Awi - the interceptor type used in every `.use` call. It takes
 * the current state of the request and the user's callback edits its contents.
 */
export type Interceptor = (request: Request) => Promise<any>
