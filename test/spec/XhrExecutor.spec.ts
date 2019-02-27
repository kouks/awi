import { expect } from 'chai'
import * as sinon from 'sinon'

import {
  Awi,
  Method,
  Status,
  Response,
  ResponseType,
  RequestFailedException,
  RequestAbortedException,
  RequestTimedOutException,
  InvalidRequestUrlException,
  RequestInvalidatedException,
} from '@'

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
        req.respond(Status.OK, {}, JSON.stringify({ ok: true, method: req.method }))
      })

      // When.
      const response = await new Awi()
        .get<Response>('http://server.api')

      // Then.
      expect(response.status)
        .to.equal(Status.OK)
      expect(response.body)
        .to.have.property('ok').that.is.true
      expect(response.body)
        .to.have.property('method').that.equals(Method.GET)
    })

    it('assigns correct headers to the request', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {}, JSON.stringify(req.requestHeaders))
      })

      // When.
      const response = await new Awi()
        .use(async req => req.headers.set('accept', 'application/json'))
        .get<Response>('http://server.api')

      // Then.
      expect(response.body)
        .to.have.property('accept').that.equals('application/json')
    })

    it('assigns authentication credentials to the request', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {}, JSON.stringify({
          username: req.username,
          password: req.password,
        }))
      })

      // When.
      const response = await new Awi()
        .use(async req => req.authentication.username = 'awi')
        .use(async req => req.authentication.password = 'secret')
        .get<Response>('http://server.api')

      // Then.
      expect(response.body)
        .to.have.property('username').that.equals('awi')
      expect(response.body)
        .to.have.property('password').that.equals('secret')
    })

    it('assigns a timeout to the request', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {}, JSON.stringify({
          timeout: (req as any).timeout,
        }))
      })

      // When.
      const response = await new Awi()
        .use(async req => req.timeout = 1000)
        .get<Response>('http://server.api')

      // Then.
      expect(response.body.timeout)
        .to.equal(1000)
    })

    it('assigns a response type', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {}, JSON.stringify({
          responseType: (req as any).responseType,
        }))
      })

      // When.
      const response = await new Awi()
        .use(async req => req.responseType = ResponseType.JSON)
        .get<Response>('http://server.api')

      // Then.
      expect(response.body.responseType)
        .to.equal(ResponseType.JSON)
    })

    it('sends body with a POST request', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.ACCEPTED, {}, JSON.stringify({
          ...(req.requestBody as any),
          method: req.method
        }))
      })

      // When.
      const response = await new Awi()
        .use(async req => req.body = { ok: true })
        .post<Response>('http://server.api')

      // Then.
      expect(response.status)
        .to.equals(Status.ACCEPTED)
      expect(response.body)
        .to.have.property('ok').that.is.true
      expect(response.body)
        .to.have.property('method').that.equals(Method.POST)
    })

    it('correctly builds the url', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {}, JSON.stringify({ url: req.url }))
      })

      // When.
      const response = await new Awi()
        .use(async req => req.base = 'http://server.api')
        .get('todos')

      // Then.
      expect(response.body)
        .to.have.property('url').that.equals('http://server.api/todos')
    })

    it('correctly builds the url when base is omitted', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {}, JSON.stringify({ url: req.url }))
      })

      // When.
      const response = await new Awi()
        .get('http://server.api/todos')

      // Then.
      expect(response.body)
        .to.have.property('url').that.equals('http://server.api/todos')
    })

    it('correctly builds the url when path is omitted', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {}, JSON.stringify({ url: req.url }))
      })

      // When.
      const response = await new Awi()
        .use(async req => req.base = 'http://server.api/todos')
        .get()

      // Then.
      expect(response.body)
        .to.have.property('url').that.equals('http://server.api/todos')
    })

    it('correctly assigns query parameters', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {}, JSON.stringify({ url: req.url }))
      })

      // When.
      const response = await new Awi()
        .use(async req => req.query.set('awi', 'awesome'))
        .use(async req => req.query.set('key', '123'))
        .get('http://server.api')

      // Then.
      expect(response.body)
        .to.have.property('url').that.equals('http://server.api/?awi=awesome&key=123')
    })

    it('correctly encodes query parameters', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {}, JSON.stringify({ url: req.url }))
      })

      // When.
      const response = await new Awi()
        .use(async req => req.query.set('encoded', '&awi=awesome'))
        .get('http://server.api')

      // Then.
      expect(response.body)
        .to.have.property('url').that.equals('http://server.api/?encoded=%26awi%3Dawesome')
    })

  })

  describe('XhrExecutor\'s response parser', () => {

    it('correctly parses a json response', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {}, JSON.stringify({ ok: true }))
      })

      // When.
      const response = await new Awi()
        .get<Response>('http://server.api')

      // Then.
      expect(response.body)
        .to.have.property('ok').that.is.true
    })

    it('correctly parses a text response', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {}, 'awi')
      })

      // When.
      const response = await new Awi()
        .use(async req => req.responseType = ResponseType.TEXT)
        .get<Response>('http://server.api')

      // Then.
      expect(response.body)
        .to.equal('awi')
    })

    it('correctly parses basic response headers', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, { 'content-type': 'application/json' }, '')
      })

      // When.
      const response = await new Awi()
        .get<Response>('http://server.api')

      // Then.
      expect(response.headers.get('content-type'))
        .to.equal('application/json')
    })

    it('parses response headers to lower case', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, { 'Content-Type': 'application/json' }, '')
      })

      // When.
      const response = await new Awi()
        .get<Response>('http://server.api')

      // Then.
      expect(response.headers.get('content-type'))
        .to.equal('application/json')
    })

    it('correctly deduplicates response headers', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {
          'Cache-Control': 'max-age=86400',
          'Cache-control': 'public',
          'cache-control': 'immutable',
        }, '')
      })

      // When.
      const response = await new Awi()
        .get<Response>('http://server.api')

      // Then.
      expect(response.headers.get('cache-control'))
        .to.equal('max-age=86400, public, immutable')
    })

    it('ignores headers that should not be deduplicated', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {
          'Content-Type': 'application/json',
          'content-type': 'text/plain',
        }, '')
      })

      // When.
      const response = await new Awi()
        .get<Response>('http://server.api')

      // Then.
      expect(response.headers.get('content-type'))
        .to.equal('application/json')
    })

    it('rejects the promise if the response has a 400+ status', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.BAD_REQUEST, {}, '')
      })

      // When.
      const process = new Awi()
        .get<Response>('http://server.api')

      // Then.
      await expect(process)
        .to.eventually.be.rejected
        .and.to.have.property('status').that.equals(Status.BAD_REQUEST)
    })

  })

  describe('XhrExecutor\'s exception handler', () => {

    it('rejects when the request URL is invalid', async () => {
      // When.
      const process = new Awi()
        .get<Response>('invalid-url')

      // Then.
      await expect(process)
        .to.eventually.be.rejectedWith(InvalidRequestUrlException)
        .and.to.satisfy((e: InvalidRequestUrlException) => e.request.path === 'invalid-url')
    })

    it('rejects when request fails due to network issues', (done) => {
      // Given.
      server.respondWith((req) => {
        // Then.
        try {
          expect(req.onerror).to.throw(RequestFailedException)
          done()
        } catch (e) { done(e) }
      })

      // When.
      new Awi()
        .get<Response>('http://server.api')
        .catch(() => undefined)
    })

    it('rejects when request fails due to being aborted', (done) => {
      // Given.
      server.respondWith((req) => {
        // Then.
        try {
          expect((req as any).onabort).to.throw(RequestAbortedException)
          done()
        } catch (e) { done(e) }
      })

      // When.
      new Awi()
        .get<Response>('http://server.api')
        .catch(() => undefined)
    })

    it('rejects when request fails due to a timeout', (done) => {
      // Given.
      server.respondWith((req) => {
        // Then.
        try {
          expect((req as any).ontimeout).to.throw(RequestTimedOutException)
          done()
        } catch (e) { done(e) }
      })

      // When.
      new Awi()
        .get<Response>('http://server.api')
        .catch(() => undefined)
    })

    it('does not allow to reuse a request', async () => {
      // Given.
      server.respondWith((req) => {
        req.respond(Status.OK, {}, '')
      })

      const client = new Awi()

      await client.get<Response>('http://server.api')

      // When.
      const process = client.get<Response>('http://server.api')

      // Then.
      await expect(process)
        .to.eventually.be.rejectedWith(RequestInvalidatedException)
    })

  })

})
