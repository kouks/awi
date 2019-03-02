import { Method } from '@/enumerations/Method'
import { Executor } from '@/contracts/Executor'
import { Optional } from '@bausano/data-structures'
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
  query: { [key: string]: string }

  /**
   * The headers sent with the request.
   */
  headers: { [key: string]: string }

  /**
   * The request timeout in milliseconds.
   */
  timeout: number

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
   * The response configuration object.
   */
  response: {
    /**
     * The desired response type.
     */
    type: ResponseType,

    /**
     * The desired response encoding.
     */
    encoding: string,
  }

  /**
   * The executor instance to perform the request.
   */
  executor: Optional<Executor>

}
