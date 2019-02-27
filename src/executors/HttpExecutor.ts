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
