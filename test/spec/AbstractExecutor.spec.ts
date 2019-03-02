import { expect } from 'chai'

import {
  Awi,
  Status,
  Request,
  Response,
  AbstractExecutor,
  InvalidRequestUrlException,
} from '@'

import { Some } from '@bausano/data-structures'

describe('AbstractExecutor', () => {

  describe('AbstractExecutor\'s request builder', () => {

    it('correctly builds the url', async () => {
      // When.
      const response = await mock()
        .use(async req => req.base = 'http://server.api')
        .get<MockResponse>('todos')

      // Then.
      expect(response.body)
        .to.equal('http://server.api/todos')
    })

    it('correctly builds the url when base is omitted', async () => {
      // When.
      const response = await mock()
        .get<MockResponse>('http://server.api/todos')

      // Then.
      expect(response.body)
        .to.equal('http://server.api/todos')
    })

    it('correctly builds the url when path is omitted', async () => {
      // When.
      const response = await mock()
        .use(async req => req.base = 'http://server.api/todos')
        .get<MockResponse>()

      // Then.
      expect(response.body)
        .to.equal('http://server.api/todos')
    })

    it('correctly assigns query parameters', async () => {
      // When.
      const response = await mock()
        .use(async req => req.query = { awi: 'awesome', key: '123' })
        .get<MockResponse>('http://server.api')

      // Then.
      expect(response.body)
        .to.equal('http://server.api/?awi=awesome&key=123')
    })

    it('correctly encodes query parameters', async () => {
      // When.
      const response = await mock()
        .use(async req => req.query = { encoded: '&awi=awesome' })
        .get<MockResponse>('http://server.api')

      // Then.
      expect(response.body)
        .to.equal('http://server.api/?encoded=%26awi%3Dawesome')
    })

  })

  describe('AbstractExecutor\'s exception handler', () => {

    it('rejects when the request URL is invalid', async () => {
      // When.
      const process = mock()
        .get<Response>('invalid-url')

      // Then.
      await expect(process)
        .to.eventually.be.rejectedWith(InvalidRequestUrlException)
        .and.to.satisfy((e: InvalidRequestUrlException) => e.request.path === 'invalid-url')
    })

  })

})

const mock = () => new Awi()
  .use(async req => req.executor = new Some(new MockExecutor))

class MockExecutor extends AbstractExecutor {
  async send<T extends Response> (request: Request) : Promise<T> {
    return {
      body: this.buildRequestUrl(request).toString(),
      status: Status.OK,
      headers: {}
    } as T
  }
}

interface MockResponse extends Response {
  body: string
}
