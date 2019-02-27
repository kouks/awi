import { Request } from '@/contracts/Request'
import { Status } from '@/enumerations/Status'
import { Executor } from '@/contracts/Executor'
import { Response } from '@/contracts/Response'
import { ResponseType } from '@/enumerations/ResponseType'

import {
  RequestFailedException,
  RequestAbortedException,
  RequestTimedOutException,
  InvalidRequestUrlException,
  RequestInvalidatedException,
} from '@/exceptions'

export class XhrExecutor implements Executor {

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
        this.buildRequestUri(request),
        true,
        request.authentication.username, // TODO: Check if this works.
        request.authentication.password,
      )

      // Assign the timeout, 0 (which is default) is no timeout.
      this.xhr.timeout = request.timeout

      // Set the response type.
      this.xhr.responseType = request.responseType.toString() as XMLHttpRequestResponseType

      // Assign headers to the request.
      Array.from(request.headers.entries())
        .forEach(([key, value]) => this.xhr.setRequestHeader(key, value))

      // Assign a listener for the request state change.
      this.xhr.onreadystatechange = () => {
        if (this.xhr.readyState !== this.xhr.DONE) {
          return
        }

        const response: T = {
          body: request.responseType === ResponseType.TEXT ? this.xhr.responseText : this.xhr.response,
          status: this.xhr.status as Status,
          headers: this.parseHeaders(this.xhr),
        } as T

        return response.status < Status.BAD_REQUEST
          ? resolve(response)
          : reject(response)
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
   * Build a URI from the request instance.
   * TODO: This should be extracted up.
   *
   * @param request The reuest instance to use
   * @return The resulting URI
   * @throws {InvalidRequestUrlException} If the provided base and path cannot
   * be parsed to a URL
   */
  private buildRequestUri (request: Request) : string {
    try {
      // Trim slashes from the provided base and path and also consider either
      // path or base to be the full URL.
      const base: string = (request.base || '').replace(/^\/*(.*?)\/*$/, '$1')
      const path: string = (request.path || '').replace(/^\/*(.*)/, '$1')

      const url: URL = new URL(
        `${base === '' ? '' : path === '' ? base : base + '/'}${path}`,
      )

      // Assign desired query parameters.
      Array.from(request.query.entries())
        .forEach(([key, value]) => url.searchParams.set(key, value))

      return url.toString()
    } catch {
      throw new InvalidRequestUrlException(request)
    }
  }

  /**
   * Parse raw headers into a javascript object.
   * TODO: This should be extracted up.
   *
   * @param raw The raw state of the request
   * @return The parsed headers
   */
  private parseHeaders (raw: XMLHttpRequest) : Map<string, string> {
    // Headers that we do not want to concatenate.
    const doNotConcatenate: string[] = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent',
    ]

    // Initialize the header map.
    const headers: Map<string, string> = new Map()

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
        if (headers.has(key) && doNotConcatenate.find(i => i === key) !== undefined) {
          return
        }

        return headers.has(key)
          ? headers.set(key, `${headers.get(key)}, ${value}`)
          : headers.set(key, value)
      })

    return headers
  }

}
