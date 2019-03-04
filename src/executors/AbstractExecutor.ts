import { Request } from '@/contracts/Request'
import { Status } from '@/enumerations/Status'
import { Executor } from '@/contracts/Executor'
import { Response } from '@/contracts/Response'

export abstract class AbstractExecutor implements Executor {

  /**
   * {@inheritdoc}
   */
  public abstract async send<T extends Response> (request: Request) : Promise<T>

  /**
   * Finalize the execution of a request.
   *
   * @param resolve A callback that resolves the request promise
   * @param reject A callback that reject the request promise
   * @param body The body of the response
   * @param status The response status
   * @param headers The response headers
   */
  protected finalize<T extends Response> (
    resolve: (response?: T | PromiseLike<T>) => void,
    reject: (response?: T | PromiseLike<T>) => void,
    body: any,
    status: Status,
    headers: { [key: string]: string },
  ) : void {
    const response: T = {
      body,
      status,
      headers,
    } as T

    response.status < Status.BAD_REQUEST
      ? resolve(response)
      : reject(response)
  }

}
