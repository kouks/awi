import { Request } from '@/contracts/Request'
import { Status } from '@/enumerations/Status'
import { Response } from '@/contracts/Response'
import { AbstractExecutor } from '@/executors/AbstractExecutor'

import {
  RequestFailedException,
  RequestAbortedException,
  RequestTimedOutException,
  RequestInvalidatedException,
} from '@/exceptions'

export class XhrExecutor extends AbstractExecutor {

  /**
   * The native http request client.
   */
  private xhr: XMLHttpRequest = new XMLHttpRequest()

  /**
   * {@inheritdoc}
   */
  public async send<T extends Response> (request: Request) : Promise<T> {
    // Check if the XHR is a fresh instance.
    if (this.xhr.readyState !== this.xhr.UNSENT) {
      throw new RequestInvalidatedException(request)
    }

    return new Promise<T>((resolve, reject) => {
      // Open the request.
      this.xhr.open(
        request.method.toString(),
        this.buildRequestUrl(request).toString(),
        true,
      )

      // Assign the timeout, 0 (which is default) is no timeout.
      this.xhr.timeout = request.timeout

      // Set the response type.
      this.xhr.responseType = request.response.type.toString() as XMLHttpRequestResponseType

      // Assign headers to the request.
      Object.keys(request.headers)
        .forEach(key => this.xhr.setRequestHeader(key, request.headers[key]))

      // Assign a listener for the request state change.
      this.xhr.onreadystatechange = () => {
        if (this.xhr.readyState !== this.xhr.DONE) {
          return
        }

        // TODO: Handle body in mutations?
        // TODO: Response type stream?
        this.finalize<T>(
          resolve,
          reject,
          this.xhr.response,
          this.xhr.status as Status,
          this.parseHeaders(this.xhr),
        )
      }

      // When the request is explicitly aborted.
      this.xhr.onabort = () => {
        throw new RequestAbortedException(request)
      }

      // When the request failed due to network issues.
      this.xhr.onerror = () => {
        throw new RequestFailedException(request)
      }

      // When the request failed due to a timeout.
      this.xhr.ontimeout = () => {
        throw new RequestTimedOutException(request)
      }

      this.xhr.send(request.body)
    })
  }

  /**
   * Parse raw headers into a javascript object.
   *
   * @param raw The raw state of the request
   * @return The parsed headers
   */
  private parseHeaders (raw: XMLHttpRequest) : { [key: string]: string } {
    // Headers that we do not want to concatenate. Thanks axios.
    const doNotConcatenate: string[] = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent',
    ]

    // Initialize the header map.
    const headers: { [key: string]: string } = {}

    // Populate the header map.
    raw.getAllResponseHeaders().split('\n')
      .map(header => header.split(':'))
      .forEach((header) => {
        // If the header is invalid, skip.
        if (header.length !== 2) {
          return
        }

        const key: string = header[0].toLowerCase().trim()
        const value: string = header[1].trim()

        // If the header already exists and we do not want to concatenate, skip.
        if (headers[key] !== undefined && doNotConcatenate.find(i => i === key) !== undefined) {
          return
        }

        return headers[key] === undefined
          ? headers[key] = value
          : headers[key] = `${headers[key]}, ${value}`
      })

    return headers
  }

}
