import * as nock from 'nock'
import { expect } from 'chai'

import {
  Awi,
  Some,
  Response,
  ResponseType,
  RequestFailedException,
  RequestTimedOutException,
  InvalidRequestUrlException,
} from '@'

import { HttpExecutor } from '@/executors/HttpExecutor'

describe('HttpExecutor', () => {
  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe("HttpExecutor's request builder", () => {
    it('executes a simple GET request', async () => {
      // Given.
      nock('http://server.api').get('/').reply(200, { ok: true })

      // When.
      const response = await http().get<Response>('http://server.api')

      // Then.
      expect(response.body).to.deep.equal({ ok: true })
      expect(response.status).to.equal(200)
    })

    it('assigns correct headers to the request', async () => {
      // Given.
      nock('http://server.api', {
        reqheaders: { 'x-awi-status': 'awesome', accept: 'application/json' },
      })
        .get('/')
        .reply(200)

      // When.
      const response = await http()
        .use(async (req) => (req.headers['x-awi-status'] = 'awesome'))
        .get<Response>('http://server.api')

      // Then.
      expect(response.status).to.equal(200)
    })

    it('assigns authentication credentials to the request', async () => {
      // Given.
      nock('http://server.api').get('/').basicAuth({ user: 'awi', pass: 'secret' }).reply(200)

      // When.
      const response = await http()
        .use(async (req) => (req.authentication = { username: 'awi', password: 'secret' }))
        .get<Response>('http://server.api')

      // Then.
      expect(response.status).to.equal(200)
    })

    it('assigns a response type', async () => {
      // Given.
      nock('http://server.api').get('/').reply(200, { ok: true })

      // When.
      const response = await http()
        .use(async (req) => (req.response.type = ResponseType.TEXT))
        .get<Response>('http://server.api')

      // Then.
      expect(JSON.parse(response.body)).to.deep.equal({ ok: true })
    })

    it('sends body with a POST request', async () => {
      // Given.
      nock('http://server.api')
        .post('/')
        .reply(201, (_: string, body: any) => body)

      // When.
      const response = await http()
        .use(async (req) => (req.body = { ok: true }))
        .post<Response>('http://server.api')

      // Then.
      expect(response.body).to.deep.equal({ ok: true })
      expect(response.status).to.equal(201)
    })

    it('uses the https protocol driver when appropriate', async () => {
      // Given.
      nock('https://server.api').get('/').reply(200, { ok: true })

      // When.
      const response = await http().get<Response>('https://server.api')

      // Then.
      expect(response.body).to.deep.equal({ ok: true })
      expect(response.status).to.equal(200)
    })
  })

  describe("HttpExecutor's response parser", () => {
    it('correctly parses a json response', async () => {
      // Given.
      nock('http://server.api').get('/').reply(200, { ok: true })

      // When.
      const response = await http().get<Response>('http://server.api')

      // Then.
      expect(response.body).to.have.property('ok').that.is.true
    })

    it('defaults to text if it cannot parse a json response', async () => {
      // Given.
      nock('http://server.api').get('/').reply(200, 'text')

      // When.
      const response = await http().get<Response>('http://server.api')

      // Then.
      expect(response.body).equal('text')
    })

    it('correctly parses a text response', async () => {
      // Given.
      nock('http://server.api').get('/').reply(200, { ok: true })

      // When.
      const response = await http()
        .use(async (req) => (req.response.type = ResponseType.TEXT))
        .get<Response>('http://server.api')

      // Then.
      expect(response.body).to.equal('{"ok":true}')
    })

    it('correctly parses a buffer response', async () => {
      // Given.
      nock('http://server.api').get('/').reply(200, { ok: true })

      // When.
      const response = await http()
        .use(async (req) => (req.response.type = ResponseType.BUFFER))
        .get<Response>('http://server.api')

      // Then.
      expect(response.body.toString('utf8')).to.equal('{"ok":true}')
    })

    it('correctly parses basic response headers', async () => {
      // Given.
      nock('http://server.api').get('/').reply(200, undefined, { 'content-type': 'application/json' })

      // When.
      const response = await http().get<Response>('http://server.api')

      // Then.
      expect(response.headers['content-type']).to.equal('application/json')
    })

    it('parses response headers to lower case', async () => {
      // Given.
      nock('http://server.api').get('/').reply(200, undefined, { 'Content-Type': 'application/json' })

      // When.
      const response = await http().get<Response>('http://server.api')

      // Then.
      expect(response.headers['content-type']).to.equal('application/json')
    })

    it('rejects the promise if the response has a 400+ status', async () => {
      // Given.
      nock('http://server.api').get('/').reply(400)

      // When.
      const client = http().get<Response>('http://server.api')

      // Then.
      await expect(client).to.eventually.be.rejected.and.to.have.property('status').that.equals(400)
    })
  })

  describe("HttpExecutor's exception handler", () => {
    it('rejects when a request fails due to network issues', async () => {
      // Given.
      nock('http://server.api').get('/').replyWithError({ ok: false })

      // When.
      const client = http().get<Response>('http://server.api')

      // Then.
      await expect(client).to.eventually.be.rejectedWith(RequestFailedException)
    })

    it('rejects when a request fails due to a timeout', async () => {
      // Given.
      nock('http://server.api').get('/').delay(8).reply(200)

      // When.
      const client = http().get<Response>('http://server.api')

      // Then.
      await expect(client).to.eventually.be.rejectedWith(RequestTimedOutException)
    })

    it('rejects with a timeout when a failure is received after the timeout', async () => {
      // Given.
      nock('http://server.api').get('/').delay(8).replyWithError({ ok: false })

      // When.
      const client = http().get<Response>('http://server.api')

      // Then.
      await expect(client).to.eventually.be.rejectedWith(RequestTimedOutException)
    })
  })

  describe("HttpExecutor's URL builder", () => {
    it('correctly builds the url when both base and path are provided', async () => {
      // Given.
      nock('http://server.api').get('/todos').reply(200)

      // When.
      const response = await http()
        .use(async (req) => (req.base = 'http://server.api'))
        .get<Response>('todos')

      // Then.
      expect(response.status).to.equal(200)
    })

    it('correctly builds the url when base is omitted', async () => {
      // Given.
      nock('http://server.api').get('/todos').reply(200)

      // When.
      const response = await http().get<Response>('http://server.api/todos')

      // Then.
      expect(response.status).to.equal(200)
    })

    it('correctly builds the url when path is omitted', async () => {
      // Given.
      nock('http://server.api').get('/todos').reply(200)

      // When.
      const response = await http()
        .use(async (req) => (req.base = 'http://server.api/todos'))
        .get<Response>()

      // Then.
      expect(response.status).to.equal(200)
    })

    it('correctly assigns query parameters', async () => {
      // Given.
      nock('http://server.api').get('/').query({ awi: 'awesome', key: '123' }).reply(200)

      // When.
      const response = await http()
        .use(async (req) => (req.query = { awi: 'awesome', key: '123' }))
        .get<Response>('http://server.api')

      // Then.
      expect(response.status).to.equal(200)
    })

    it('rejects when the request URL is invalid', async () => {
      // When.
      const client = http().get<Response>('invalid-url')

      // Then.
      await expect(client).to.eventually.be.rejectedWith(InvalidRequestUrlException)
    })

    it('correctly builds base with no ending slash is provided', async () => {
      // Given.
      nock('http://server.api').get('/p/a/t/h').reply(200)

      // When.
      const response = await http()
        .use(async (req) => (req.base = 'http://server.api/p/a'))
        .get<Response>('t/h')

      // Then.
      expect(response.status).to.equal(200)
    })
  })
})

const http = () =>
  new Awi().use(async (req) => (req.timeout = 4)).use(async (req) => (req.executor = new Some(new HttpExecutor())))
