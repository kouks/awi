import * as nock from 'nock'
import { expect } from 'chai'

import {
  Awi,
  Status,
  Response,
  ResponseType,
  RequestFailedException,
  RequestAbortedException,
  RequestTimedOutException,
} from '@'

import { Some } from '@bausano/data-structures'
import { HttpExecutor } from '@/executors/HttpExecutor'

describe('HttpExecutor', () => {

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe('HttpExecutor\'s request builder', () => {

    it('executes a simple GET request', async () => {
      // Given.
      nock('http://server.api')
        .get('/')
        .reply(200, { ok: true })

      // When.
      const response = await http()
        .get<Response>('http://server.api')

      // Then.
      expect(response.body)
        .to.deep.equal({ ok: true })
      expect(response.status)
        .to.equal(Status.OK)
    })

    it('assigns correct headers to the request', async () => {
      // Given.
      nock('http://server.api', {
        reqheaders: { 'x-awi-status': 'awesome', 'accept': 'application/json' }
      })
        .get('/')
        .reply(200)

      // When.
      const response = await http()
        .use(async req => req.headers['x-awi-status'] = 'awesome')
        .get<Response>('http://server.api')

      // Then.
      expect(response.status)
        .to.equal(Status.OK)
    })

    it('assigns authentication credentials to the request', async () => {
      // Given.
      nock('http://server.api')
        .get('/')
        .basicAuth({ user: 'awi', pass: 'secret' })
        .reply(200)

      // When.
      const response = await http()
        .use(async req => req.authentication = { username: 'awi', password: 'secret' })
        .get<Response>('http://server.api')

      // Then.
      expect(response.status)
        .to.equal(Status.OK)
    })

    it('assigns a response type', async () => {
      // Given.
      nock('http://server.api')
        .get('/')
        .reply(200, { ok: true })

      // When.
      const response = await http()
        .use(async req => req.response.type = ResponseType.TEXT)
        .get<Response>('http://server.api')

      // Then.
      expect(JSON.parse(response.body))
        .to.deep.equal({ ok: true })
    })

    it('sends body with a POST request', async () => {
      // Given.
      nock('http://server.api')
        .post('/')
        .reply(200, (_: string, body: any) => body)

      // When.
      const response = await http()
        .use(async req => req.body = { ok: true })
        .post<Response>('http://server.api')

      // Then.
      expect(response.body)
        .to.deep.equal({ ok: true })
    })

    it('uses the https protocol driver when appropriate', async () => {
      // Given.
      nock('https://server.api')
        .get('/')
        .reply(200, { ok: true })

      // When.
      const response = await http()
        .get<Response>('https://server.api')

      // Then.
      expect(response.body)
        .to.deep.equal({ ok: true })
      expect(response.status)
        .to.equal(Status.OK)
    })

  })

  describe('HttpExecutor\'s response parser', () => {

    it('correctly parses a json response', async () => {
      // Given.
      nock('http://server.api')
        .get('/')
        .reply(200, { ok: true })

      // When.
      const response = await http()
        .get<Response>('http://server.api')

      // Then.
      expect(response.body)
        .to.have.property('ok').that.is.true
    })

    it('correctly parses a text response', async () => {
      // Given.
      nock('http://server.api')
        .get('/')
        .reply(200, { ok: true })

      // When.
      const response = await http()
        .use(async req => req.response.type = ResponseType.TEXT)
        .get<Response>('http://server.api')

      // Then.
      expect(response.body)
        .to.equal('{"ok":true}')
    })

    it('correctly parses basic response headers', async () => {
      // Given.
      nock('http://server.api')
        .get('/')
        .reply(200, undefined, { 'content-type': 'application/json' })

      // When.
      const response = await http()
        .get<Response>('http://server.api')

      // Then.
      expect(response.headers['content-type'])
        .to.equal('application/json')
    })

    it('parses response headers to lower case', async () => {
      // Given.
      nock('http://server.api')
        .get('/')
        .reply(200, undefined, { 'Content-Type': 'application/json' })

      // When.
      const response = await http()
        .get<Response>('http://server.api')

      // Then.
      expect(response.headers['content-type'])
        .to.equal('application/json')
    })

    it('rejects the promise if the response has a 400+ status', async () => {
      // Given.
      nock('http://server.api')
        .get('/')
        .reply(400)

      // When.
      const client = http()
        .get<Response>('http://server.api')

      // Then.
      await expect(client)
        .to.eventually.be.rejected
        .and.to.have.property('status').that.equals(Status.BAD_REQUEST)
    })

  })

  describe('HttpExecutor\'s exception handler', () => {

    it('rejects when a request fails due to network issues', async () => {
      // Given.
      nock('http://server.api')
        .get('/')
        .replyWithError({ ok: false })

      // When.
      const client = http()
        .get<Response>('http://server.api')

      // Then.
      await expect(client)
        .to.eventually.be.rejectedWith(RequestFailedException)
    })

    it('rejects when a request fails due to a timeout', async () => {
      // Given.
      nock('http://server.api')
        .get('/')
        .delay(8)
        .reply(200)

      // When.
      const client = http()
        .get<Response>('http://server.api')

      // Then.
      await expect(client)
        .to.eventually.be.rejectedWith(RequestTimedOutException)
    })

    it('rejects with a timeout when a failure is received after the timeout', async () => {
      // Given.
      nock('http://server.api')
        .get('/')
        .delay(8)
        .replyWithError({ ok: false })

      // When.
      const client = http()
        .get<Response>('http://server.api')

      // Then.
      await expect(client)
        .to.eventually.be.rejectedWith(RequestTimedOutException)
    })

  })

})

const http = () => new Awi()
  .use(async req => req.timeout = 4)
  .use(async req => req.executor = new Some(new HttpExecutor))
