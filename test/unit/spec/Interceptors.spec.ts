import { expect } from 'chai'

import {
  buildUrlObject,
  normalizeHeaders,
  handleRequestPayload,
  determineDefaultExecutor,
  assignDefaultAcceptHeader,
  removeConflictingAuthorizationHeader,
} from '@/interceptors'

import {
  None,
  Some,
  Method,
  Request,
  ResponseType,
  InvalidRequestUrlException,
} from '@'

import { XhrExecutor } from '@/executors/XhrExecutor'
import { HttpExecutor } from '@/executors/HttpExecutor'

describe('Awi\'s default interceptors', () => {
  let request: Request

  beforeEach(() => {
    request = {
      base: '',
      path: '',
      url: new None(),
      method: Method.GET,
      body: null,
      query: {},
      headers: {},
      timeout: 0,
      authentication: {
        username: null,
        password: null,
      },
      response: {
        type: ResponseType.JSON,
        encoding: 'utf8',
      },
      executor: new None(),
    }
  })

  describe('normalizeHeaders interceptor', () => {

    it('normalizes header names', async () => {
      // Given.
      request.headers['X-Custom-Header'] = 'test'

      // When
      await normalizeHeaders(request)

      // Then.
      expect(request.headers)
        .to.have.property('x-custom-header').that.equals('test')
      expect(request.headers)
        .not.to.have.property('X-Custom-Header')
    })

  })

  describe('assignDefaultAcceptHeader interceptor', () => {

    it('assigns default accept header for json response type', async () => {
      // Given.
      request.response.type = ResponseType.JSON

      // When
      await assignDefaultAcceptHeader(request)

      // Then.
      expect(request.headers)
        .to.have.property('accept').that.equals('application/json')
    })

    it('assigns default accept header for other response types', async () => {
      // Given.
      request.response.type = ResponseType.TEXT

      // When
      await assignDefaultAcceptHeader(request)

      // Then.
      expect(request.headers)
        .to.have.property('accept').that.equals('text/plain */*')
    })

    it('does not collide with user defined headers', async () => {
      // Given.
      request.headers['accept'] = 'application/xml'

      // When.
      await assignDefaultAcceptHeader(request)

      // Then.
      expect(request.headers)
        .to.have.property('accept').that.equals('application/xml')
    })

  })

  describe('removeConflictingAuthorizationHeader interceptor', () => {

    it('removes conflicting authorization headers', async () => {
      // Given.
      request.headers['authorization'] = 'Bearer 123'
      request.authentication = { username: 'awi', password: 'secret' }

      // When.
      await removeConflictingAuthorizationHeader(request)

      // Then.
      expect(request.headers['authorization'])
        .to.be.undefined
    })

    it('leaves the authorization header if no authentication was provided', async () => {
      // Given.
      request.headers['authorization'] = 'Bearer 123'

      // When.
      await removeConflictingAuthorizationHeader(request)

      // Then.
      expect(request.headers['authorization'])
        .to.be.equal('Bearer 123')
    })

  })

  describe('handleRequestPayload interceptor', () => {

    it('removes any content headers if no body is passed', async () => {
      // Given.
      request.headers['content-type'] = 'application/json'
      request.headers['content-length'] = '13'

      // When.
      await handleRequestPayload(request)

      // Then.
      expect(request.headers)
        .not.to.have.property('content-type')
      expect(request.headers)
        .not.to.have.property('content-ength')
    })

    it('assigns correct content type header if body is passed', async () => {
      // Given.
      request.body = { ok: true }

      // When.
      await handleRequestPayload(request)

      // Then.
      expect(request.headers)
        .to.have.property('content-type').that.equals('application/json;charset=utf-8')
    })

    it('normalizes the body of the request', async () => {
      // Given.
      request.body = { ok: true }

      // When.
      await handleRequestPayload(request)

      // Then.
      expect(request.body)
        .to.equal('{"ok":true}')
    })

  })

  describe('determineDefaultExecutor interceptor', () => {

    it('correctly determines a node environment', async () => {
      // When.
      await determineDefaultExecutor(request)

      // Then.
      expect(request.executor.unwrap())
        .to.be.an.instanceOf(HttpExecutor)
    })

    // TODO: Figure this out.
    // it('correctly determines a web environment', async () => {
    //   // When.
    //   await determineDefaultExecutor(request)

    //   // Then.
    //   expect(request.executor.unwrap())
    //     .to.be.an.instanceOf(XhrExecutor)
    // })

  })

  describe('buildUrlObject interceptor', () => {

    it('correctly builds the url', async () => {
      // Given.
      request.base = 'http://server.api'
      request.path = 'todos'

      // When.
      await buildUrlObject(request)

      // Then.
      expect(request.url.unwrap().toString())
        .to.equal('http://server.api/todos')
    })

    it('accepts the URL object', async () => {
      // Given.
      request.url = new Some(new URL('http://server.api'))

      // When.
      await buildUrlObject(request)

      // Then.
      expect(request.url.unwrap().toString())
        .to.equal('http://server.api/')
    })

    it('correctly build the url when base is omitted', async () => {
      // Given.
      request.path = 'http://server.api/todos'

      // When.
      await buildUrlObject(request)

      // Then.
      expect(request.url.unwrap().toString())
        .to.equal('http://server.api/todos')
    })

    it('correctly build the url when path is omitted', async () => {
      // Given.
      request.base = 'http://server.api/todos'

      // When.
      await buildUrlObject(request)

      // Then.
      expect(request.url.unwrap().toString())
        .to.equal('http://server.api/todos')
    })

    it('correctly assign query parameters', async () => {
      // Given.
      request.base = 'http://server.api'
      request.query = { awi: 'awesome', key: '123' }

      // When.
      await buildUrlObject(request)

      // Then.
      expect(request.url.unwrap().toString())
        .to.equal('http://server.api/?awi=awesome&key=123')
    })

    it('correctly encode query parameters', async () => {
      // Given.
      request.base = 'http://server.api'
      request.query = { encoded: '&awi=awesome' }

      // When.
      await buildUrlObject(request)

      // Then.
      expect(request.url.unwrap().toString())
        .to.equal('http://server.api/?encoded=%26awi%3Dawesome')
    })

    it('reject when the request URL is invalid', async () => {
      // Given.
      request.base = 'invalid-url'

      // When.
      // Then.
      await expect(buildUrlObject(request))
        .to.eventually.be.rejectedWith(InvalidRequestUrlException)
        .and.to.satisfy((e: InvalidRequestUrlException) => e.request.base === 'invalid-url')
    })

    it('accept a number as path', async () => {
      // Given.
      request.base = 'http://server.api'
      request.path = '0'

      // When.
      await buildUrlObject(request)

      // Then.
      expect(request.url.unwrap().toString())
        .to.equal('http://server.api/0')
    })

  })

})
