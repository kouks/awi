import { Interceptor } from '@/types'
import { Client } from '@/contracts/Client'
import { Request } from '@/contracts/Request'
import { Method } from '@/enumerations/Method'
import { Response } from '@/contracts/Response'
import { ResponseType } from '@/enumerations/ResponseType'
import { Optional, Some, None } from '@bausano/data-structures'

import {
  buildUrlObject,
  normalizeHeaders,
  handleRequestPayload,
  determineDefaultExecutor,
  assignDefaultAcceptHeader,
  removeConflictingAuthorizationHeader,
} from '@/interceptors'

import {
  NoExecutorProvidedException,
} from './exceptions'

export class Awi implements Client {

  /**
   * The array of interceptors to be applied.
   */
  private interceptors: Array<{
    /**
     * The interceptor to be used.
     */
    interceptor: Interceptor,

    /**
     * The interceptor's priority.
     */
    priority: number,
  }> = [
    { interceptor: determineDefaultExecutor, priority: 10 },
    { interceptor: buildUrlObject, priority: 1 },
    { interceptor: normalizeHeaders, priority: 1 },
    { interceptor: assignDefaultAcceptHeader, priority: 1 },
    { interceptor: removeConflictingAuthorizationHeader, priority: 1 },
    { interceptor: handleRequestPayload, priority: 1 },
  ]

  /**
   * The current state of the request object.
   *
   * TODO: This might be extracted
   */
  private request: Request = {
    base: '',
    path: '',
    url: new None(),
    method: Method.GET,
    body: null,
    query: {},
    headers: {},
    timeout: 0,
    authentication: {
      username: null,
      password: null,
    },
    response: {
      type: ResponseType.JSON,
      encoding: 'utf8',
    },
    executor: new None(),
  }

  /**
   * {@inheritdoc}
   */
  public use (interceptor: Interceptor, priority: number = 5) : Client {
    this.interceptors.push({ interceptor, priority })

    return this
  }

  /**
   * {@inheritdoc}
   */
  public async send<T extends Response> () : Promise<T> {
    return this.interceptors.sort((a, b) => b.priority - a.priority)
      .map(bundle => bundle.interceptor)
      .reduce(
        (carry, intercept) => carry.then(() => intercept(this.request)),
        Promise.resolve(),
      ).then(() => this.request.executor.expect(new NoExecutorProvidedException()).send<T>(this.request))
  }

  /**
   * {@inheritdoc}
   */
  public async get<T extends Response> (path?: string) : Promise<T> {
    return this.prepare(Method.GET, path).send<T>()
  }

  /**
   * {@inheritdoc}
   */
  public async delete<T extends Response> (path?: string) : Promise<T> {
    return this.prepare(Method.DELETE, path).send<T>()
  }

  /**
   * {@inheritdoc}
   */
  public async head<T extends Response> (path?: string) : Promise<T> {
    return this.prepare(Method.HEAD, path).send<T>()
  }

  /**
   * {@inheritdoc}
   */
  public async options<T extends Response> (path?: string) : Promise<T> {
    return this.prepare(Method.OPTIONS, path).send<T>()
  }

  /**
   * {@inheritdoc}
   */
  public async post<T extends Response> (path?: string, body?: any) : Promise<T> {
    return this.prepare(Method.POST, path, body).send<T>()
  }

  /**
   * {@inheritdoc}
   */
  public async put<T extends Response> (path?: string, body?: any) : Promise<T> {
    return this.prepare(Method.PUT, path, body).send<T>()
  }

  /**
   * {@inheritdoc}
   */
  public async patch<T extends Response> (path?: string, body?: any) : Promise<T> {
    return this.prepare(Method.PATCH, path, body).send<T>()
  }

  /**
   * {@inheritdoc}
   */
  public async body<T> (path?: string) : Promise<T> {
    if (path !== undefined) {
      this.use(async req => req.path = path)
    }

    return this.send<{ body: T } & Response>()
      .then(response => response.body)
  }

  /**
   * {@inheritdoc}
   */
  public async optional<T> (path?: string) : Promise<Optional<T>> {
    return this.body<T>(path)
      .then(body => new Some<T>(body))
      .catch((error) => {
        if (error instanceof Error) {
          throw error
        }

        return new None<T>()
      })
  }

  /**
   * Prepare the request by adding interceptors from the helper method
   * arguments.
   *
   * @param method The method to use
   * @param path The request path
   * @param body The request body
   * @return Awi instance for chaining
   */
  private prepare (method: Method, path?: string, body?: any) : Client {
    if (path !== undefined) {
      this.use(async req => req.path = path)
    }

    if (body !== undefined) {
      this.use(async req => req.body = body)
    }

    return this.use(async req => req.method = method)
  }

}
