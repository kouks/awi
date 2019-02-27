import * as http from 'http'
import * as https from 'https'
import { Request } from '@/contracts/Request'
import { Executor } from '@/contracts/Executor'
import { Response } from '@/contracts/Response'

export class HttpExecutor implements Executor {

  /**
   * {@inheritdoc}
   */
  public async send<T extends Response> (request: Request) : Promise<T> {

    return new Promise<T>((resolve, reject) => {
      //
    })
  }

}


const coinapi = () => new awi.Awi()
  .use(async req => req.base = 'htttps://rest.coinapi.io/v1')
  .use(async req => req.query.add('apiKey', apiKey))



return coinapi()
 .use(async req => req.query.add('time', date))
 .get('exchangerate/BTC/USD')
