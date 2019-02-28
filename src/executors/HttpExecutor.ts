import * as http from 'http'
import * as https from 'https'
import { Request } from '@/contracts/Request'
import { Status } from '@/enumerations/Status'
import { Response } from '@/contracts/Response'
import { AbstractExecutor } from './AbstractExecutor'
import { ResponseType } from '@/enumerations/ResponseType'

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
      // const protocol = url.protocol === 'https:' ? https : http
      let requestTimedOut: boolean = false

      const process: http.ClientRequest = https.request({
        hostname: url.hostname,
        protocol: url.protocol,
        path: `${url.pathname}${url.search}`,
        method: request.method.toString(),
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

          this.finalize(
            resolve,
            reject,
            request.responseType === ResponseType.BUFFER ? data : data.toString('utf8'), // TODO: Encoding config.
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
   * TODO: Implement this
   *
   * @param headers
   * @return The parsed headers
   */
  private parseHeaders (headers: http.IncomingHttpHeaders) : Map<string, string> {
    return new Map()
  }

}
