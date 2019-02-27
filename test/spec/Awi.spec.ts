import { expect } from 'chai'

import {
  Awi,
  Status,
  Request,
  Executor,
  Response,
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
    })

    it('has a working DELETE helper', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .delete<MockResponse>('resource')

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
    })

    it('has a working HEAD helper', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .head<MockResponse>('resource')

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
    })

    it('has a working OPTIONS helper', async () => {
      // When.
      const response = await new Awi()
        .use(async req => req.executor = new MockExecutor)
        .options<MockResponse>('resource')

      // Then.
      expect(response.body)
        .to.have.property('path').that.equals('resource')
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
        .to.have.property('body').that.deep.equals({ body: 'test' })
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
        .to.have.property('body').that.deep.equals({ body: 'test' })
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
        .to.have.property('body').that.deep.equals({ body: 'test' })
    })

  })

})

class MockExecutor implements Executor {
  async send<T extends Response> (request: Request) : Promise<T> {
    return {
      body: request,
      status: Status.OK,
      headers: new Map
    } as T
  }
}

interface MockResponse extends Response {
  body: Request
}
