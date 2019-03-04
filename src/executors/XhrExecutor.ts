import { Request } from '@/contracts/Request'
import { Response } from '@/contracts/Response'
import { AbstractExecutor } from '@/executors/AbstractExecutor'

import {
  RequestFailedException,
  RequestAbortedException,
  RequestTimedOutException,
  InvalidRequestUrlException,
} from '@/exceptions'

export class XhrExecutor extends AbstractExecutor {

  /**
   * {@inheritdoc}
   */
  public async send<T extends Response> (request: Request) : Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Create a new instance of the XML HTTP request.
      const xhr: XMLHttpRequest = new XMLHttpRequest()

      // Open the request.
      xhr.open(
        String(request.method),
        request.url.expect(new InvalidRequestUrlException(request)).toString(),
        true,
      )

      // Assign the timeout, 0 (which is default) is no timeout.
      xhr.timeout = request.timeout

      // Set the response type.
      xhr.responseType = String(request.response.type) as XMLHttpRequestResponseType

      // Assign headers to the request.
      Object.keys(request.headers)
        .forEach(key => xhr.setRequestHeader(key, request.headers[key]))

      // Assign a listener for the request state change.
      xhr.onreadystatechange = () => {
        if (xhr.readyState !== xhr.DONE) {
          return
        }

        // TODO: Response type stream?
        this.finalize<T>(
          resolve,
          reject,
          xhr.response,
          xhr.status,
          this.parseHeaders(xhr),
        )
      }

      // When the request is explicitly aborted.
      xhr.onabort = () => reject(new RequestAbortedException(request))

      // When the request failed due to network issues.
      xhr.onerror = () => reject(new RequestFailedException(request, new Error('Request failed.')))

      // When the request failed due to a timeout.
      xhr.ontimeout = () => reject(new RequestTimedOutException(request))

      // Send the request with the desired body.
      xhr.send(request.body)
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
