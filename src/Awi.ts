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
    if (path !== undefined) {
      this.use(async req => req.path = path)
    }

    return this.use(async req => req.method = Method.GET)
      .send<T>()
  }

  /**
   * {@inheritdoc}
   */
  public discard () : Client {
    this.interceptors = []

    return this
  }

}
