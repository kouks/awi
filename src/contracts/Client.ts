import { Interceptor } from '@/types'
import { Response } from '@/contracts/Response'
import { Optional } from '@bausano/data-structures'

export interface Client {
  /**
   * Provides a way to intercept any request directly. The callback takes in an
   * instance of Request and alters its contents. The return value is
   * disregarded.
   *
   * @param interceptor The function that alters the event
   * @param priority The priority of the interceptor, interceptors with higher
   * priority are executed first
   * @return The instance for chaining
   */
  use(interceptor: Interceptor, priority?: number): Client

  /**
   * Perform the transformed request.
   *
   * @return The desired response
   * @throws {HttpException} If something goes wrong when executing the request
   */
  send<T extends Response>(): Promise<T>

  /**
   * Get, delete, head and options request execution shorthands.
   *
   * @param path The path to use for the request
   * @return The desired response
   * @throws {HttpException} If something goes wrong when executing the request
   */
  get<T extends Response>(path?: string): Promise<T>
  delete<T extends Response>(path?: string): Promise<T>
  head<T extends Response>(path?: string): Promise<T>
  options<T extends Response>(path?: string): Promise<T>

  /**
   * Post, put and patch request execution shorthands.
   *
   * @param path The path to use for the request
   * @param body The body to be sent with the request
   * @return The desired response
   * @throws {HttpException} If something goes wrong when executing the request
   */
  post<T extends Response>(path?: string, body?: any): Promise<T>
  put<T extends Response>(path?: string, body?: any): Promise<T>
  patch<T extends Response>(path?: string, body?: any): Promise<T>

  /**
   * A request helper that only returns the body of the response.
   *
   * @param path The path to use for the request
   * @return The desired response
   * @throws {HttpException} If something goes wrong when executing the request
   */
  body<T>(path?: string): Promise<T>

  /**
   * A request helper that only returns the body of the response and instead of
   * rejecting the promise, it resolves an `Optional<T>`.
   *
   * @param path The path to use for the request
   * @return The desired response wrapped in an optional
   * @throws {HttpException} If something goes wrong when executing the request
   */
  optional<T>(path?: string): Promise<Optional<T>>
}
