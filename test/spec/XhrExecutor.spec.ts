import { expect } from 'chai'
import * as sinon from 'sinon'

import {
  Awi,
  Status,
  Response,
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

  it('executes a simple GET request', async () => {
    // Given.
    server.respondWith((xhr) => {
      xhr.respond(Status.OK, {}, JSON.stringify({ ok: true }))
    })

    // When.
    const response = await new Awi()
      .get<Response>('http://server.api/1')

    // Then.
    expect(response.status)
      .to.equal(Status.OK)
    expect(response.body)
      .to.have.property('ok').that.is.true
  })

})
