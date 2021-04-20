import { Request } from '@/contracts/Request'

export interface HttpException {
  /**
   * The request that failed.
   */
  request: Request
}

export abstract class AwiHttpException extends Error implements HttpException {
  /**
   * {@inheritdoc}
   */
  public abstract request: Request

  /**
   * Stringify the provided request for the exception.
   *
   * @param request The request to be stringified
   * @return The stringified version of the request
   */
  protected static stringifyRequest(request: Request): string {
    return `${String(request.method)} ${request.base} ${request.path}`
  }
}

export class RequestAbortedException extends AwiHttpException {
  /**
   * @param request The request in question
   */
  constructor(public request: Request) {
    super(`The request [${AwiHttpException.stringifyRequest(request)}] has been aborted.`)
  }
}

export class RequestFailedException extends AwiHttpException {
  /**
   * @param request The request in question
   */
  constructor(public request: Request, public reason: Error) {
    super(`The request [${AwiHttpException.stringifyRequest(request)}] has failed due to: ${reason.message}.`)
  }
}

export class RequestTimedOutException extends AwiHttpException {
  /**
   * @param request The request in question
   */
  constructor(public request: Request) {
    super(`The request [${AwiHttpException.stringifyRequest(request)}] exceeded the [${request.timeout}ms] timeout.`)
  }
}

export class InvalidRequestUrlException extends AwiHttpException {
  /**
   * @param request The request in question
   */
  constructor(public request: Request) {
    super(`The request [${AwiHttpException.stringifyRequest(request)}] has an invalid URL.`)
  }
}

export abstract class AwiConfigurationException extends Error {
  //
}

export class NoExecutorProvidedException extends AwiConfigurationException {
  /**
   * Exception constructor.
   */
  constructor() {
    super('There is no valid executor assigned to the request configuration.')
  }
}
