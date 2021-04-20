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
  query: Record<string, string>

  /**
   * The headers sent with the request.
   */
  headers: Record<string, string>

  /**
   * The request timeout in milliseconds.
   */
  timeout: number

  /**
   * The authentication object.
   */
  authentication: {
    username: string | null
    password: string | null
  }

  /**
   * The response configuration object.
   */
  response: {
    type: ResponseType
    encoding: string
  }

  /**
   * The executor instance to perform the request.
   */
  executor: Optional<Executor>
}
