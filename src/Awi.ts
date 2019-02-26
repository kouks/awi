import { AwiInterceptor } from '@/types'
import { Client } from '@/contracts/Client'
import { Request } from '@/contracts/Request'
import { Method } from '@/enumerations/Method'
import { Response } from '@/contracts/Response'
import { XhrExecutor } from '@/executors/XhrExecutor'
import { ResponseType } from './enumerations/ResponseType'

export class Awi implements Client {

  /**
   * The array of interceptors to be applied.
   */
  private interceptors: AwiInterceptor[] = []

  /**
   * The current request of the request object.
   */
  private request: Request = {
    base: '',
    path: '',
    method: Method.GET,
    body: null,
    query: new Map(),
    headers: new Map(),
    timeout: 0,
    responseType: ResponseType.JSON,
    authentication: {
      username: null,
      password: null,
    },
    executor: new XhrExecutor(),
  }

  /**
   * {@inheritdoc}
   */
  public use (interceptor: AwiInterceptor) : Client {
    this.interceptors.push(interceptor)

    return this
  }

  /**
   * {@inheritdoc}
   */
  public async send<T extends Response> () : Promise<T> {
    return this.interceptors.reduce(
      (carry, intercept) => carry.then(() => intercept(this.request)),
      Promise.resolve(),
    )
      .then(() => this.request.executor.send<T>(this.request))
  }

  /**
   * {@inheritdoc}
   *
   * // TODO: Query?
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

  /**
   * {@inheritdoc}
   */
  public discard () : Client {
    this.interceptors = []

    return this
  }

}
