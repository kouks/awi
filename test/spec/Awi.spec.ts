import { expect } from 'chai'

import {
  Awi,
  Method,
  Status,
  Request,
  Executor,
  Response,
  ResponseType,
} from '@'

describe('Awi client', () => {

  it('is awesome', async () => {
    expect(new Awi).to.be.ok
  })

  it('correctly executes interceptors', async () => {
    // When.
    const response = await new Awi()
      .use(async req => req.executor = new MockExecutor)
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
    const response = await new Awi()
      .use(async req => req.executor = new MockExecutor)
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
    const response = await new Awi()
      .use(async req => req.executor = new MockExecutor)
      .use(async req => req.base = 'http://localhost', 5)
      .use(async req => req.base = 'http://otherhost', 10)
      .send<MockResponse>()

    // Then.
    expect(response.body)
      .to.have.property('base').that.equals('http://localhost')
  })

  it('can discard all interceptors', async () => {
    // When.
    const response = await new Awi()
      .use(async req => req.base = 'http://localhost')
      .discard()
      .use(async req => req.executor = new MockExecutor)
      .send<MockResponse>()

    // Then.
    expect(response.body)
      .to.have.property('base').that.equals('')
  })

  describe('Awi\'s request method sugar', () => {

    it('has a working GET helper', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .get<MockResponse>('resource')

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
      expect(response.body)
        .to.have.property('method').that.equals(Method.GET)
    })

    it('has a working DELETE helper', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .delete<MockResponse>('resource')

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
      expect(response.body)
        .to.have.property('method').that.equals(Method.DELETE)
    })

    it('has a working HEAD helper', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .head<MockResponse>('resource')

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
      expect(response.body)
        .to.have.property('method').that.equals(Method.HEAD)
    })

    it('has a working OPTIONS helper', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .options<MockResponse>('resource')

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
      expect(response.body)
        .to.have.property('method').that.equals(Method.OPTIONS)
    })

    it('has a working POST helper', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
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
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
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
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .patch<MockResponse>('resource', { body: 'test' })

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
      expect(response.body)
        .to.have.property('body').that.equals('{"body":"test"}')
      expect(response.body)
        .to.have.property('method').that.equals(Method.PATCH)
    })

  })

  describe('Awi\'s default interceptors', () => {

    it('include an interceptor to normalize header names', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .use(async req => req.headers['X-Custom-Header'] = 'test')
        .get<MockResponse>('resource')

      // Then.
      expect(response.body.headers)
        .to.have.property('x-custom-header').that.equals('test')
      expect(response.body.headers)
        .not.to.have.property('X-Custom-Header')
    })

    it('include an interceptor to assign a default accept header', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .use(async req => req.response.type = ResponseType.JSON)
        .get<MockResponse>('resource')

      // Then.
      expect(response.body.headers)
        .to.have.property('accept').that.equals('application/json')
    })

    it('do not collide with user defined headers', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .use(async req => req.headers['accept'] = 'application/xml')
        .get<MockResponse>('resource')

      // Then.
      expect(response.body.headers)
        .to.have.property('accept').that.equals('application/xml')
    })

    it('remove any content headers if no body is passed', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .use(async req => req.headers['content-type'] = 'application/json')
        .use(async req => req.headers['content-length'] = '13')
        .post<MockResponse>('resource')

      // Then.
      expect(response.body.headers)
        .not.to.have.property('content-type')
      expect(response.body.headers)
        .not.to.have.property('content-ength')
    })

    it('assign correct content type header if body is passed', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .use(async req => req.body = { ok: true })
        .post<MockResponse>('resource')

      // Then.
      expect(response.body.headers)
        .to.have.property('content-type').that.equals('application/json;charset=utf-8')
    })

    it('normalizes the body of the request', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .use(async req => req.body = { ok: true })
        .post<MockResponse>('resource')

      // Then.
      expect(response.body.body)
        .to.equal('{"ok":true}')
    })

  })

})

class MockExecutor implements Executor {
  async send<T extends Response> (request: Request) : Promise<T> {
    return {
      body: request,
      status: Status.OK,
      headers: {}
    } as T
  }
}

interface MockResponse extends Response {
  body: Request
}
