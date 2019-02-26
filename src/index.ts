
// config.ts

// export const base = () => new Client()
//   .use(async req => req.base = 'http://myapi.io/v1')
//   .use(async req => req.headers['Content-Type'] = 'application/json')

// export const authenticated = () => base()
//   .use(async req => req.headers['Authorization'] = `Bearer ${localStorage.token}`)

// // request.ts

// import { base, authenticated } from 'config'

// const data = await base()
//   .use(async req => req.path = 'todos')
//   .get()
//   .then(async res => res.data)

// // Or

// const data = await base('todos').get()
//   .then(async res => res.data)

// // Or

// const user = await authenticated('user').get()
//   .then(async res => res.data)

// new Awi()
