import { AwiInterceptor } from '@/types'
import { Response } from '@/contracts/Response'

export interface Client {

  /**
   * Provides a way to intercept any request directly. The callback takes in an
   * instance of AwiRequest and alters its contents. The return value is
   * disregarded.
   *
   * @param interceptor The function that alters the event.
   * @return The instance for chaining
   */
  use (interceptor: AwiInterceptor) : Client

  /**
   * Perform the transformed request.
   *
   * @return The desired response
   * @throws TODO
   */
  send<T extends Response> () : Promise<T>

  /**
   * Get request execution shorthand.
   *
   * @param path The path to use for the request
   * TODO: Add hash?
   * @return The desired response
   * @throws TODO
   */
  get<T extends Response> (path?: string) : Promise<T>

  // TODO: More methods.

  /**
   * Discars any previously defined interceptors for the given instance. This is
   * just utility that is not to be used often.
   */
  discard () : Client

  /**
   * Discards any listeners assigned to the instance. TODO
   */
  // deafen () : Awiable

}
