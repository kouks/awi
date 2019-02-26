import { Status } from '@/enumerations/Status'

export interface Response {

  /**
   * The response body.
   */
  body: any

  /**
   * The response status.
   */
  status: Status

  /**
   * The response headers.
   */
  headers: Map<string, string>

}
