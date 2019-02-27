import { Executor } from '@/contracts/Executor'
import { Method } from '@/enumerations/Method'
import { ResponseType } from '@/enumerations/ResponseType'

export interface Request {

  /**
   * The request base URL.
   */
  base: string

  /**
   * The request path.
   */
  path: string

  /**
   * The request method.
   */
  method: Method

  /**
   * The request body. This has to be an 'any' type by default as the user can
   * send anything.
   */
  body: any

  /**
   * The query added to the request.
   */
  query: Map<string, string>

  /**
   * The headers sent with the request.
   */
  headers: Map<string, string>

  /**
   * The request timeout in milliseconds.
   */
  timeout: number

  /**
   * The desired response type.
   */
  responseType: ResponseType

  /**
   * The authentication object.
   */
  authentication: {
    /**
     * The user to be used for the authentication.
     */
    username: string | null,

    /**
     * The password to be used for the authentication.
     */
    password: string | null,
  }

  /**
   * The executor instance to perform the request.
   */
  executor: Executor

}
