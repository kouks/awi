import { expect } from 'chai'
import * as sinon from 'sinon'

import {
  Awi,
  Some,
  Method,
  Response,
  ResponseType,
  RequestFailedException,
  RequestAbortedException,
  RequestTimedOutException,
  InvalidRequestUrlException,
} from '@'

import { XhrExecutor } from '@/executors/XhrExecutor'

describe('XhrExecutor', () => {
  let server: sinon.SinonFakeServer

  beforeEach(() => {
    server = sinon.fakeServer.create()
    server.respondImmediately = true
  })

  afterEach(() => {
    server.restore()
  })

  describe('XhrExecutor\'s request builder', () => {

    it('executes a simple GET request', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {}, JSON.stringify({ ok: true, method: req.method }))
      })

      // When.
      const response = await xhr()
        .get<Response>('http://server.api')

      // Then.
      expect(response.status)
        .to.equal(200)
      expect(response.body)
        .to.have.property('ok').that.is.true
      expect(response.body)
        .to.have.property('method').that.equals(Method.GET)
    })

    it('assigns correct headers to the request', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {}, JSON.stringify(req.requestHeaders))
      })

      // When.
      const response = await xhr()
        .use(async req => req.headers['accept'] = 'application/json')
        .get<Response>('http://server.api')

      // Then.
      expect(response.body)
        .to.have.property('accept').that.equals('application/json')
    })

    it('assigns authentication credentials to the request', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {}, JSON.stringify({
          url: req.url
        }))
      })

      // When.
      const response = await xhr()
        .use(async req => req.authentication.username = 'awi')
        .use(async req => req.authentication.password = 'secret')
        .get<Response>('http://server.api')

      // Then.
      expect(response.body)
        .to.have.property('url').that.equals('http://awi:secret@server.api/')
    })

    it('assigns a timeout to the request', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {}, JSON.stringify({
          timeout: (req as any).timeout,
        }))
      })

      // When.
      const response = await xhr()
        .use(async req => req.timeout = 1000)
        .get<Response>('http://server.api')

      // Then.
      expect(response.body.timeout)
        .to.equal(1000)
    })

    it('assigns a response type', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {}, JSON.stringify({
          responseType: (req as any).responseType,
        }))
      })

      // When.
      const response = await xhr()
        .use(async req => req.response.type = ResponseType.JSON)
        .get<Response>('http://server.api')

      // Then.
      expect(response.body.responseType)
        .to.equal(ResponseType.JSON)
    })

    it('sends body with a POST request', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(201, {}, JSON.stringify({
          body: req.requestBody,
          method: req.method
        }))
      })

      // When.
      const response = await xhr()
        .use(async req => req.body = { ok: true })
        .post<Response>('http://server.api')

      // Then.
      expect(response.status)
        .to.equal(201)
      expect(response.body)
        .to.have.property('body').that.equals('{"ok":true}')
      expect(response.body)
        .to.have.property('method').that.equals(Method.POST)
    })

  })

  describe('XhrExecutor\'s response parser', () => {

    it('correctly parses a json response', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {}, JSON.stringify({ ok: true }))
      })

      // When.
      const response = await xhr()
        .get<Response>('http://server.api')

      // Then.
      expect(response.body)
        .to.have.property('ok').that.is.true
    })

    it('correctly parses a text response', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {}, 'awi')
      })

      // When.
      const response = await xhr()
        .use(async req => req.response.type = ResponseType.TEXT)
        .get<Response>('http://server.api')

      // Then.
      expect(response.body)
        .to.equal('awi')
    })

    it('correctly parses a buffer response', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {}, 'awi')
      })

      // When.
      const response = await xhr()
        .use(async req => req.response.type = ResponseType.BUFFER)
        .get<Response>('http://server.api')

      // Then.
      expect(new TextDecoder().decode(response.body))
        .to.equal('awi')
    })

    it('correctly parses basic response headers', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, { 'content-type': 'application/json' }, '')
      })

      // When.
      const response = await xhr()
        .get<Response>('http://server.api')

      // Then.
      expect(response.headers['content-type'])
        .to.equal('application/json')
    })

    it('parses response headers to lower case', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, { 'Content-Type': 'application/json' }, '')
      })

      // When.
      const response = await xhr()
        .get<Response>('http://server.api')

      // Then.
      expect(response.headers['content-type'])
        .to.equal('application/json')
    })

    it('correctly deduplicates response headers', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {
          'Cache-Control': 'max-age=86400',
          'Cache-control': 'public',
          'cache-control': 'immutable',
        }, '')
      })

      // When.
      const response = await xhr()
        .get<Response>('http://server.api')

      // Then.
      expect(response.headers['cache-control'])
        .to.equal('max-age=86400, public, immutable')
    })

    it('ignores headers that should not be deduplicated', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {
          'Content-Type': 'application/json',
          'content-type': 'text/plain',
        }, '')
      })

      // When.
      const response = await xhr()
        .get<Response>('http://server.api')

      // Then.
      expect(response.headers['content-type'])
        .to.equal('application/json')
    })

    it('rejects the promise if the response has a 400+ status', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(400, {}, '')
      })

      // When.
      const process = xhr()
        .get<Response>('http://server.api')

      // Then.
      await expect(process)
        .to.eventually.be.rejected
        .and.to.have.property('status').that.equals(400)
    })

  })

  describe('XhrExecutor\'s exception handler', () => {

    it('rejects when a request fails due to network issues', async () => {
      // Given.
      server.respondWith((req) => {
        req.onerror()
      })

      // When.
      const client = xhr()
        .get<Response>('http://server.api')

      // Then.
      await expect(client)
        .to.eventually.be.rejectedWith(RequestFailedException)
    })

    it('rejects when a request fails due to being aborted', async () => {
      // Given.
      server.respondWith((req) => {
        (req as any).onabort()
      })

      // When.
      const client = xhr()
        .get<Response>('http://server.api')

      // Then.
      await expect(client)
        .to.eventually.be.rejectedWith(RequestAbortedException)
    })

    it('rejects when a request fails due to a timeout', async () => {
      // Given.
      server.respondWith((req) => {
        (req as any).ontimeout()
      })

      // When.
      const client = xhr()
        .get<Response>('http://server.api')

      // Then.
      await expect(client)
        .to.eventually.be.rejectedWith(RequestTimedOutException)
    })

  })

  describe('XhrExecutor\'s URL builder', () => {

    it('correctly builds the url when both base and path are provided', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {}, JSON.stringify({ url: req.url }))
      })

      // When.
      const response = await xhr()
        .use(async req => req.base = 'http://server.api')
        .get<Response>('todos')

      // Then.
      expect(response.body.url)
        .to.equal('http://server.api/todos')
    })

    it('correctly builds the url when base is omitted', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {}, JSON.stringify({ url: req.url }))
      })

      // When.
      const response = await xhr()
        .get<Response>('http://server.api/todos')

      // Then.
      expect(response.body.url)
        .to.equal('http://server.api/todos')
    })

    it('correctly builds the url when path is omitted', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {}, JSON.stringify({ url: req.url }))
      })

      // When.
      const response = await xhr()
        .use(async req => req.base = 'http://server.api/todos')
        .get<Response>()

      // Then.
      expect(response.body.url)
        .to.equal('http://server.api/todos')
    })

    it('correctly assigns query parameters', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(200, {}, JSON.stringify({ url: req.url }))
      })

      // When.
      const response = await xhr()
        .use(async req => req.query = { awi: 'awesome', key: '123' })
        .get<Response>('http://server.api')

      // Then.
      expect(response.body.url)
        .to.equal('http://server.api/?awi=awesome&key=123')
    })

    it('rejects when the request URL is invalid', async () => {
      // When.
      const client = xhr()
        .get<Response>('invalid-url')

      // Then.
      await expect(client)
        .to.eventually.be.rejectedWith(InvalidRequestUrlException)
    })

  })

})

const xhr = () => new Awi()
  .use(async req => req.executor = new Some(new XhrExecutor))
