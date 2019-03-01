import { expect } from 'chai'

import {
  Awi,
  Method,
  Status,
  Response,
  XhrExecutor,
  HttpExecutor,
  ResponseType,
  RequestFailedException,
  RequestAbortedException,
  RequestTimedOutException,
  InvalidRequestUrlException,
  RequestInvalidatedException,
} from '@'

describe('HttpExecutor', () => {

  it('works', async () => {

    const response = await new Awi()
      .use(async req => req.executor = new HttpExecutor)
      .post('https://jsonplaceholder.typicode.com/todos')

  })

})
