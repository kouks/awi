import { Interceptor } from '@/types'
import { Client } from '@/contracts/Client'
import { Request } from '@/contracts/Request'
import { Method } from '@/enumerations/Method'
import { Executor } from '@/contracts/Executor'
import { Response } from '@/contracts/Response'
import { XhrExecutor } from '@/executors/XhrExecutor'
import { HttpExecutor } from '@/executors/HttpExecutor'
import { ResponseType } from '@/enumerations/ResponseType'

export class Awi implements Client {

  /**
   * The array of interceptors to be applied.
   */
  private interceptors: Interceptor[] = []

  /**
   * The current request of the request object.
   *
   * TODO: This might be extracted
   * TODO: Default headers
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
    executor: this.determineDefaultExecutor(),
  }

  /**
   * {@inheritdoc}
   */
  public use (interceptor: Interceptor) : Client {
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
  public discard () : Client {
    this.interceptors = []

    return this
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
   * Determines which executor should be used by default based on the
   * environment.
   *
   * TODO: Test this somehow, also can be improved with Optional<T>
   *
   * @return The correct executor instance
   */
  private determineDefaultExecutor () : Executor {
    // typeof window !== 'undefined' && typeof XMLHttpRequest !== 'undefined'
    return typeof process !== 'undefined' && process.toString() === '[object process]'
      ? new HttpExecutor()
      : new XhrExecutor()
  }

}
