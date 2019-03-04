import { expect } from 'chai'

import {
  Awi,
  None,
  Some,
  Method,
  Request,
  Executor,
  Response,
  RequestFailedException,
} from '@'

describe('Awi client', () => {

  it('is awesome', async () => {
    expect(new Awi).to.be.ok
  })

  it('has default interceptors', async () => {
    expect((new Awi() as any).interceptors)
      .to.be.an('array')
      .and.to.have.lengthOf(5)
  })

  it('correctly executes interceptors', async () => {
    // When.
    const response = await mock()
      .use(async req => req.base = 'http://localhost')
      .use(async req => req.path = 'resource')
      .send<MockResponse>()

    // Then.
    expect(response.body)
      .to.have.property('base').that.equals('http://localhost')
    expect(response.body)
      .to.have.property('path').that.equals('resource')
  })

  it('executes interceptors in the right order', async () => {
    // When.
    const response = await mock()
      .use(async req => req.base = 'http://localhost')
      .use(async req => req.path = 'resource')
      .use(async req => req.base = 'http://otherhost')
      .send<MockResponse>()

    // Then.
    expect(response.body)
      .to.have.property('base').that.equals('http://otherhost')
    expect(response.body)
      .to.have.property('path').that.equals('resource')
  })

  it('executes interceptors in the right order with priority', async () => {
    // When.
    const response = await mock()
      .use(async req => req.base = 'http://localhost', 5)
      .use(async req => req.base = 'http://otherhost', 10)
      .send<MockResponse>()

    // Then.
    expect(response.body)
      .to.have.property('base').that.equals('http://localhost')
  })

  describe('Awi\'s request method sugar', () => {

    it('has a working GET helper', async () => {
      // When.
      const response = await mock()
        .get<MockResponse>('resource')

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
      expect(response.body)
        .to.have.property('method').that.equals(Method.GET)
    })

    it('has a working DELETE helper', async () => {
      // When.
      const response = await mock()
        .delete<MockResponse>('resource')

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
      expect(response.body)
        .to.have.property('method').that.equals(Method.DELETE)
    })

    it('has a working HEAD helper', async () => {
      // When.
      const response = await mock()
        .head<MockResponse>('resource')

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
      expect(response.body)
        .to.have.property('method').that.equals(Method.HEAD)
    })

    it('has a working OPTIONS helper', async () => {
      // When.
      const response = await mock()
        .options<MockResponse>('resource')

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
      expect(response.body)
        .to.have.property('method').that.equals(Method.OPTIONS)
    })

    it('has a working POST helper', async () => {
      // When.
      const response = await mock()
        .post<MockResponse>('resource', { body: 'test' })

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
      expect(response.body)
        .to.have.property('body').that.equals('{"body":"test"}')
      expect(response.body)
        .to.have.property('method').that.equals(Method.POST)
    })

    it('has a working PUT helper', async () => {
      // When.
      const response = await mock()
        .put<MockResponse>('resource', { body: 'test' })

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
      expect(response.body)
        .to.have.property('body').that.equals('{"body":"test"}')
      expect(response.body)
        .to.have.property('method').that.equals(Method.PUT)
    })

    it('has a working PATCH helper', async () => {
      // When.
      const response = await mock()
        .patch<MockResponse>('resource', { body: 'test' })

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
      expect(response.body)
        .to.have.property('body').that.equals('{"body":"test"}')
      expect(response.body)
        .to.have.property('method').that.equals(Method.PATCH)
    })

    it('has a working body helper', async () => {
      // When.
      const body = await mock()
        .body<Request>('resource')

      // Then.
      expect(body)
        .to.have.property('path').that.equals('resource')
    })

    it('has a working optional helper', async () => {
      // When.
      const body = await mock()
        .optional<Request>('resource')

      // Then.
      expect(body)
        .to.be.an.instanceOf(Some)
      expect(body.unwrap())
        .to.have.property('path').that.equals('resource')
    })

    it('has a working optional helper that returns none on 400+ requests', async () => {
      // When.
      const body = await mock()
        .optional<Request>('invalid')

      // Then.
      expect(body)
        .to.be.an.instanceOf(None)
    })

    it('has a working optional helper that rejects if requets errored', async () => {
      // When.
      const client = mock()
        .optional<Request>('error')

      // Then.
      await expect(client)
        .to.eventually.be.rejectedWith(RequestFailedException)
    })

  })

})

const mock = () => new Awi()
  .use(async req => req.executor = new Some(new MockExecutor))
  .use(async req => req.base = 'http://localhost')

class MockExecutor implements Executor {
  async send<T extends Response> (request: Request) : Promise<T> {
    if (request.path === 'error') {
      throw new RequestFailedException(request, new Error)
    }

    if (request.path === 'invalid') {
      throw {
        body: request,
        status: 400,
        headers: {}
      } as T
    }

    return {
      body: request,
      status: 200,
      headers: {}
    } as T
  }
}

interface MockResponse extends Response {
  body: Request
}
