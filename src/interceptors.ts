import { Interceptor } from '@/types'
import { Some } from '@bausano/data-structures'
import { InvalidRequestUrlException } from './exceptions'
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
  // Skip if user has already defined the header.
  if (request.headers['accept'] !== undefined) {
    return
  }

  if (request.response.type === ResponseType.JSON) {
    return request.headers['accept'] = 'application/json'
  }

  request.headers['accept'] = 'text/plain */*'
}

/**
 * An interceptor to remove the authorization header if the authentication
 * configuration is set.
 */
export const removeConflictingAuthorizationHeader: Interceptor = async (request) => {
  // Check if either credentials exist.
  if (request.authentication.username !== null || request.authentication.password !== null) {
    delete request.headers['authorization']
  }
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
}

/**
 * Determines which executor should be used by default based on the
 * environment. Note that the executor neeeds to be imported dynamically as the
 * other driver would always break the code.
 */
export const determineDefaultExecutor: Interceptor = async (request) => {
  // If the process variable exists and it is in instance of the process class,
  // we can be quite sure that we are in a node environment.
  if (typeof process !== 'undefined' && String(process) === '[object process]') {
    return request.executor = new Some(new (await import('./executors/HttpExecutor')).HttpExecutor())
  }

  // If there is a window object and the XMLHttpRequest class exists, we are
  // most likely in a browser.
  if (typeof window !== 'undefined' && typeof XMLHttpRequest !== 'undefined') {
    return request.executor = new Some(new (await import('./executors/XhrExecutor')).XhrExecutor())
  }
}

/**
 * An interceptor to build an instance of URL from the provided request.
 */
export const buildUrlObject: Interceptor = async (request) => {
  // If the URL already exists, leave it.
  if (request.url.isSome()) {
    return
  }

  try {
    // Trim slashes from the provided base and path and also consider either
    // path or base to be the full URL.
    const base: string = (request.base || '').replace(/^\/*(.*?)\/*$/, '$1')
    const path: string = (request.path || '').replace(/^\/*(.*)/, '$1')

    const url: URL = new URL(
      `${base === '' ? '' : path === '' ? base : base + '/'}${path}`,
    )

    // Assign authentication credentials if not provided manually.
    url.username = request.authentication.username || url.username
    url.password = request.authentication.password || url.password

    // Assign desired query parameters.
    Object.keys(request.query)
      .forEach(key => url.searchParams.set(key, request.query[key]))

    return request.url = new Some(url)
  } catch {
    throw new InvalidRequestUrlException(request)
  }
}
