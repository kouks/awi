import { expect } from 'chai'
import { start } from '../server'

import {
  Awi,
  Status,
  Request,
  Response,
  AbstractExecutor,
  InvalidRequestUrlException,
} from '@'

describe('[e2e] Node client', () => {
  let server: any

  before(() => {
    // Create a node.js server.
    server = start()
  })

  after(() => {
    // Close the server after all tests have run.
    server.close()
  })

  it('executes a basic GET request', async () => {
    // When.
    const response = await api().get()

    // Then.
    expect(response.body)
      .to.deep.equal({ message: 'Hello World'})
  })

})

const api = () => new Awi()
  .use(async req => req.base = 'http://localhost:3000')
