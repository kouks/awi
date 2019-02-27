import { Request } from '@/contracts/Request'
import { Response } from '@/contracts/Response'

export interface Executor {

  /**
   * Send the requst and receive the typed response.
   *
   * @param request The request object to use
   * @return The desired response
   * @throws {Error} If somethig goes wrong when executing the request
   */
  send<T extends Response> (request: Request) : Promise<T>

}
