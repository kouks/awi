import { Interceptor } from '@/types'
import { Response } from '@/contracts/Response'

export interface Client {

  /**
   * Provides a way to intercept any request directly. The callback takes in an
   * instance of Request and alters its contents. The return value is
   * disregarded.
   *
   * @param interceptor The function that alters the event.
   * @return The instance for chaining
   */
  use (interceptor: Interceptor) : Client

  /**
   * Perform the transformed request.
   *
   * @return The desired response
   * @throws {HttpException} If somethig goes wrong when executing the request
   */
  send<T extends Response> () : Promise<T>

  /**
   * Get, delete, head and options request execution shorthands.
   *
   * @param path The path to use for the request
   * @return The desired response
   * @throws {HttpException} If somethig goes wrong when executing the request
   */
  get<T extends Response> (path?: string) : Promise<T>
  delete<T extends Response> (path?: string) : Promise<T>
  head<T extends Response> (path?: string) : Promise<T>
  options<T extends Response> (path?: string) : Promise<T>

  /**
   * Post, put and patch request execution shorthands.
   *
   * @param path The path to use for the request
   * @param body The body to be sent with the request
   * @return The desired response
   * @throws {HttpException} If somethig goes wrong when executing the request
   */
  post<T extends Response> (path?: string, body?: any) : Promise<T>
  put<T extends Response> (path?: string, body?: any) : Promise<T>
  patch<T extends Response> (path?: string, body?: any) : Promise<T>

  /**
   * Discars any previously defined interceptors for the given instance. This is
   * just utility that is not to be used often.
   */
  discard () : Client

  /**
   * Discards any listeners assigned to the instance. TODO: Listeners?
   */
  // deafen () : Client

}
