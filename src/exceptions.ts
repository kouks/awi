import { Request } from './contracts/Request'

export class AwiException extends Error {

  /**
   * Stringify the provided request for the exception.
   *
   * @param request The request to be stringified
   * @return The stringified version of the request
   */
  protected static stringifyRequest (request: Request) : string {
    return `${request.method.toString()} ${request.base} ${request.path}`
  }

}

export class RequestInvalidatedException extends AwiException {

  /**
   * @param request The request in question
   */
  constructor (public request: Request) {
    super(`The request [${AwiException.stringifyRequest(request)}] has been invalidated.`)
  }

}

export class RequestAbortedException extends AwiException {

  /**
   * @param request The request in question
   */
  constructor (public request: Request) {
    super(`The request [${AwiException.stringifyRequest(request)}] has been aborted.`)
  }

}

export class RequestFailedException extends AwiException {

  /**
   * @param request The request in question
   */
  constructor (public request: Request) {
    super(`The request [${AwiException.stringifyRequest(request)}] has failed.`)
  }

}

export class RequestTimedOutException extends AwiException {

  /**
   * @param request The request in question
   */
  constructor (public request: Request) {
    super(`The request [${AwiException.stringifyRequest(request)}] exceeded the [${request.timeout}ms] timeout.`)
  }

}

export class InvalidRequestUrlException extends AwiException {

  /**
   * @param request The request in question
   */
  constructor (public request: Request) {
    super(`The request [${AwiException.stringifyRequest(request)}] has an invalid URL.`)
  }

}
