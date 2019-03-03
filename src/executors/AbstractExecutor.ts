import { Request } from '@/contracts/Request'
import { Executor } from '@/contracts/Executor'
import { Response } from '@/contracts/Response'
import { InvalidRequestUrlException } from '@/exceptions'

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
    status: number,
    headers: { [key: string]: string },
  ) : void {
    const response: T = {
      body,
      status,
      headers,
    } as T

    response.status < 400
      ? resolve(response)
      : reject(response)
  }

  /**
   * Build a URL from the request instance.
   *
   * @param request The reuest instance to use
   * @return The resulting URL
   * @throws {InvalidRequestUrlException} If the provided base and path cannot
   * be parsed to a URL
   */
  protected buildRequestUrl (request: Request) : URL {
    try {
      // Trim slashes from the provided base and path and also consider either
      // path or base to be the full URL.
      const base: string = (request.base || '').replace(/^\/*(.*?)\/*$/, '$1')
      const path: string = (request.path || '').replace(/^\/*(.*)/, '$1')

      const url: URL = new URL(
        `${base === '' ? '' : path === '' ? base : base + '/'}${path}`,
      )

      // Assign authentication credentials if not provided manually.
      url.username = request.authentication.username || url.username
      url.password = request.authentication.password || url.password

      // Assign desired query parameters.
      Object.keys(request.query)
        .forEach(key => url.searchParams.set(key, request.query[key]))

      return url
    } catch {
      throw new InvalidRequestUrlException(request)
    }
  }

}
