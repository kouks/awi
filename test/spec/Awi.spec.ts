import api from 'xhr-mock'
import { expect } from 'chai'

import { Awi } from '@/Awi'

describe('Awi', () => {

  it('is awesome', async () => {
    expect(new Awi).to.be.ok
  })

  it('idk', async () => {

    // api.get('http://test.api', (req, res) => {
    //   console.log(req, res)
    //   return res.status(200)
    // })

    await new Awi()
      // .use(async req => req.executor = new MockExecutor())
      .use(async req => req.base = 'http://localhost:3000')
      .get()
      .then(console.log)

  })

})
