import { URL } from 'url'
import * as http from 'http'
import * as https from 'https'
import { Request } from '@/contracts/Request'
import { Response } from '@/contracts/Response'
import { ResponseType } from '@/enumerations/ResponseType'
import { AbstractExecutor } from '@/executors/AbstractExecutor'

import {
  RequestFailedException,
  RequestAbortedException,
  RequestTimedOutException,
  InvalidRequestUrlException,
} from '@/exceptions'

export class HttpExecutor extends AbstractExecutor {
  /**
   * {@inheritdoc}
   */
  public async send<T extends Response>(request: Request): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Build the request URL.
      const url: URL = this.buildUrl(request)
      let requestTimedOut: boolean = false
      let requestTimer: NodeJS.Timeout

      // Unfortunately, node types don't provide us with declarations for the
      // http and https libraries.
      const protocol: any = url.protocol === 'https:' ? https : http

      // We need to remove the authentication header to avoid any collision if
      // basic auth was provided.
      if (url.username || url.password) {
        delete request.headers['authorization']
      }

      const client: http.ClientRequest = protocol.request(
        {
          hostname: url.hostname,
          port: url.port,
          protocol: url.protocol,
          path: `${url.pathname}${url.search}`,
          method: String(request.method),
          headers: request.headers,
          auth: `${url.username}:${url.password}`,
        },
        (response: http.IncomingMessage) => {
          // Do not handle the response if the request has timed out.
          if (requestTimedOut) {
            return
          }

          // Clear the request timer.
          clearTimeout(requestTimer)

          // If the request was aborted, throw an exception.
          if (client.aborted) {
            throw new RequestAbortedException(request)
          }

          // The response stream buffer.
          const buffer: Buffer[] = []

          // Handle a chunk of data.
          response.on('data', (chunk) => buffer.push(chunk))

          // Handle any errors thrown while reading the data.
          response.on('error', (reason) => {
            if (requestTimedOut) {
              return
            }

            throw new RequestFailedException(request, reason)
          })

          // Finalize the stream.
          response.on('end', () => {
            // The default response body is of any type.
            const body: any = {
              [ResponseType.BUFFER]: (data: Buffer) => data,
              [ResponseType.JSON]: (data: Buffer) => JSON.parse(data.toString(request.response.encoding) || 'null'),
              [ResponseType.TEXT]: (data: Buffer) => data.toString(request.response.encoding),
            }[request.response.type](Buffer.concat(buffer))

            this.finalize<T>(
              resolve,
              reject,
              body,
              response.statusCode as number,
              response.headers as Record<string, string>
            )
          })
        }
      )

      // Handle any errors during the request.
      client.on('error', (reason) => {
        if (requestTimedOut) {
          return
        }

        // Clear the request timer.
        clearTimeout(requestTimer)

        reject(new RequestFailedException(request, reason))
      })

      // Account for the request timeout.
      if (request.timeout > 0) {
        requestTimer = setTimeout(() => {
          requestTimedOut = true

          reject(new RequestTimedOutException(request))
        }, request.timeout)
      }

      // Send the request.
      client.end(request.body)
    })
  }

  /**
   * Build the URL using the node APIs.
   *
   * @param request The reuqest to use
   * @return The URl object
   * @throws {InvalidRequestUrlException} If the URL can't be built
   */
  private buildUrl(request: Request): URL {
    try {
      // Trim slashes from the provided base and path and also consider either
      // path or base to be the full URL.
      const base: string = (request.base || '').replace(/^\/*(.*?)\/*$/, '$1')
      const path: string = (request.path || '').replace(/^\/*(.*)/, '$1')

      const url: URL = new URL(`${base === '' ? '' : path === '' ? base : base + '/'}${path}`)

      // Assign authentication credentials if not provided manually.
      url.username = request.authentication.username || url.username
      url.password = request.authentication.password || url.password

      // Assign desired query parameters.
      Object.keys(request.query).forEach((key) => url.searchParams.set(key, request.query[key]))

      return url
    } catch {
      throw new InvalidRequestUrlException(request)
    }
  }
}
