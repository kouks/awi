import { Interceptor } from '@/types'
import { ResponseType } from './enumerations/ResponseType'

/**
 * An interceptor to normalize all headers.
 */
export const normalizeHeaders: Interceptor = async (request) => {
  request.headers = Object.keys(request.headers)
    .reduce((carry, key) => ({ ...carry, [key.toLowerCase()]: request.headers[key] }), {})
}

/**
 * An interceptor to assign a default accept header.
 */
export const assignDefaultAcceptHeader: Interceptor = async (request) => {
  // Skip is user has already defined the header.
  if (request.headers['accept'] !== undefined) {
    return
  }

  if (request.response.type === ResponseType.JSON) {
    return request.headers['accept'] = 'application/json'
  }

  request.headers['accept'] = 'text/plain'
}

/**
 * An interceptor to assign a default content header and parse the request
 * payload.
 */
export const handleRequestPayload: Interceptor = async (request) => {
  // Delete any content headers if no body is passed.
  if (request.body === null) {
    delete request.headers['content-type']
    delete request.headers['content-length']

    return
  }

  // Set the content type to application/json if the passed body is an object.
  if (typeof request.body === 'object') {
    request.headers['content-type'] = 'application/json;charset=utf-8'
    request.body = JSON.stringify(request.body)
  }

  request.headers['content-length'] = request.body.length
}

// TODO: Test all of this.
