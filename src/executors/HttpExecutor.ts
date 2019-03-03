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
} from '@/exceptions'

export class HttpExecutor extends AbstractExecutor {

  /**
   * {@inheritdoc}
   */
  public async send<T extends Response> (request: Request) : Promise<T> {
    return new Promise<T>((resolve, reject) => {

      const url: URL = this.buildRequestUrl(request)
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

      const client: http.ClientRequest = protocol.request({
        hostname: url.hostname,
        port: url.port,
        protocol: url.protocol,
        path: `${url.pathname}${url.search}`,
        method: String(request.method),
        headers: request.headers,
        auth: `${url.username}:${url.password}`,
      }, (response: http.IncomingMessage) => {
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
        response.on('data', chunk => buffer.push(chunk))

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
            response.headers as { [key: string]: string },
          )
        })
      })

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

}
