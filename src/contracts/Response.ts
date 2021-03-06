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
  status: number

  /**
   * The response headers.
   */
  headers: Record<string, string>
}
