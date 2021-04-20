import * as Koa from 'koa'
import * as Router from 'koa-router'

const app = new Koa()
const router = new Router()

router.get('/', (ctx) => (ctx.body = { message: 'Hello World' }))

app.use(router.routes()).use(router.allowedMethods())

export const start = () => app.listen(3000)
