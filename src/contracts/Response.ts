import { Status } from '@/enumerations/Status'

export interface Response {

  /**
   * The response body. This is an 'any' type by default as the response can be
   * anything but developers are encouraged to extend this interface and type
   * their own responses.
   */
  body: any

  /**
   * The response status.
   */
  status: Status

  /**
   * The response headers.
   */
  headers: { [key: string]: string }

}
