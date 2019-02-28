import { expect } from 'chai'

import {
  Awi,
  Method,
  Status,
  Response,
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
      .get('https://jsonplaceholder.typicode.com/todos/1')

    console.log(response)

  })

})
