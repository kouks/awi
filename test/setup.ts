import 'xhr-mock'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

// Node version of XMLHttpRequest for testing.
;(global as any).XMLHttpRequest = require('xhr2')
