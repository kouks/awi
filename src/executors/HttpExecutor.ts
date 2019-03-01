import * as http from 'http'
import * as https from 'https'
import { Request } from '@/contracts/Request'
import { Status } from '@/enumerations/Status'
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
      // TODO: Figure this out
      // const protocol: any = url.protocol === 'https:' ? https : http
      let requestTimedOut: boolean = false

      const process: http.ClientRequest = https.request({
        hostname: url.hostname,
        protocol: url.protocol,
        path: `${url.pathname}${url.search}`,
        method: request.method.toString(),
        headers: request.headers,
      }, (response) => {
        // Do not handle the response if the request has timed out.
        if (requestTimedOut) {
          return
        }

        // If the request was aborted, throw an exception.
        if (process.aborted) {
          throw new RequestAbortedException(request)
        }

        // The response stream buffer.
        const buffer: Buffer[] = []

        // Handle a chunk of data.
        response.on('data', chunk => buffer.push(chunk))

        // Handle any errors thrown while reading the data.
        response.on('error', () => {
          if (requestTimedOut) {
            return
          }

          throw new RequestFailedException(request)
        })

        // Finalize the stream.
        response.on('end', () => {
          const data: Buffer = Buffer.concat(buffer)

          // The default response body is of any type.
          const body: any = request.response.type === ResponseType.BUFFER
            ? data
            : request.response.type === ResponseType.JSON
            ? JSON.parse(data.toString(request.response.encoding))
            : data.toString(request.response.encoding)

          this.finalize<T>(
            resolve,
            reject,
            body,
            response.statusCode as Status,
            this.parseHeaders(response.headers),
          )
        })
      })

      // Handle any errors during the request.
      process.on('error', () => {
        if (requestTimedOut) {
          return
        }

        throw new RequestFailedException(request)
      })

      // Account for the request timeout.
      if (request.timeout > 0) {
        setTimeout(() => {
          requestTimedOut = true

          throw new RequestTimedOutException(request)
        }, request.timeout)
      }

      // TODO: Handle streams?

      // Send the request.
      process.end(request.body)
    })
  }

  /**
   * Parse raw headers into a javascript object.
   *
   * @param headers
   * @return The parsed headers
   */
  private parseHeaders (headers: http.IncomingHttpHeaders) : { [key: string]: string } {
    return headers as { [key: string]: string }
  }

}
