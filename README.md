
# Awi

[![npm](https://badge.fury.io/js/awi.svg)](https://www.npmjs.com/package/awi)
[![Travis CI](https://travis-ci.org/kouks/awi.svg?branch=master)](https://travis-ci.org/kouks/awi)
[![coverage](https://codecov.io/gh/kouks/awi/branch/master/graph/badge.svg)](https://codecov.io/gh/kouks/awi)


Versatile, modern and lightweight http client based on promises.

## Installation

```bash
npm i -S awi
```

```html
<script src="https://cdn.jsdelivr.net/npm/awi/dist/awi.js"></script>
```

## Usage

### Basics

The most basic of requests can be executed seamlessly with Awi. Simply create
a new instance and call the `get` sugar method with the desired URL. This call
returns an instance of Awi's `Response` interface that has the response body,
status and headers easily accessible.

```typescript
import { Awi, Response } from 'awi'

const response: Response = await new Awi()
  .get('http://server.api/todos')

console.assert(typeof response.body === 'object')
console.assert(typeof response.headers === 'object')
console.assert(response.status === 200)
```

Awi is at its best when used in TypeScript as you can type-hint all responses
and get type checks and nice auto-completion from your IDE.

```typescript
import { Awi, Response } from 'awi'

interface TodoResponse extends Response {
  body: { title: string, completed: boolean }
}

const response: Response = await new Awi()
  .get<TodoResponse>('http://server.api/todos/1')

console.assert(typeof response.body.title === 'string')
console.assert(typeof response.body.completed === 'boolean')
```

Awi provides syntax sugar for all basic request methods. `POST`, `PUT` and
`PATCH` helpers optionally take the body of the request as their second
argument.

```typescript
import { Awi, Response } from 'awi'

const response: Response = await new Awi()
  .post('http://server.api/todos', { title: 'Start using Awi.', completed: true })

console.assert(response.status === 201)
```

Upon receiving a 400+ response status, Awi automatically rejects the promise so
that you don't have to do arbitrary checks for the response status via `if`
statements.

```typescript
import { Awi } from 'awi'

await new Awi()
  .post('http://server.api/todos', { completed: false })
  .catch(response => console.assert(response.status === 422))
```

Awi also provides a `body` helper to avoid repeating the infamous
`.then(res => res.body)` promise callback. This helper accepts a generic type
to type-hint the response body.

> Note that this helper sends a `GET` request by default. If you desire to use
> a different request method, the method needs to be specified using
> an [interceptor](#interceptors).

> Also note that if the promise is rejected, the whole response object is
> returned.

```typescript
import { Awi, Response } from 'awi'

interface Todo {
  title: string
  completed: boolean
}

interface TodoResponse extends Response {
  body: Todo
}

const todo: Todo = await new Awi()
  .body<Todo>('http://server.api/todos/1')

console.assert(typeof todo.title === 'string')
console.assert(typeof todo.completed === 'boolean')
```

Thanks to [@bausano](https://github.com/bausano) and his awesome
[data structures package](https://github.com/bausano/ts-data-structures), Awi
has an `optional` helper that returns the body of the response as an
`Optional<T>` rather than rejecting the promise.

> Note that this helper sends a `GET` request by default. If you desire to use
> a different request method, the method needs to be specified using
> an [interceptor](#interceptors).

> Also note that if the request fails due to network issues or misconfiguration,
> the promise is still rejected.

```typescript
import { Awi, Response } from 'awi'
import { Optional } from '@bausano/data-structures'

interface Todo {
  title: string
  completed: boolean
}

interface TodoResponse extends Response {
  body: Todo
}

const todo: Optional<Todo> = await new Awi()
  .optional<Todo>('http://server.api/todos/1')

console.assert(todo instanceof Optional)
```

### Interceptors

Request interceptors are what makes Awi stand out. Inspired by
[Koa](https://koajs.com/), Awi provides a `use` method that accepts an
asynchronous callback that modifies the request object.

```typescript
import { Awi, Response } from 'awi'

const response: Response = await new Awi()
  .use(async req => req.base = 'http://server.api')
  .use(async req => req.path = 'todos')
  .get()

console.assert(response.status === 200))
```

> All properties that can be modified on the request object are available in
> Awi's [API reference](https://github.com/kouks/awi/wiki/Request).

Every request in Awi is uniquely defined by the array of interceptors assigned
to the request. All Awi's helper methods are nothing more but a sugar for
assigning interceptors. All requests can be sent without using the helpers via
the `send` method.

```typescript
import { Awi, Method, Response } from 'awi'

const response: Response = await new Awi()
  .use(async req => req.base = 'http://server.api')
  .use(async req => req.path = 'todos')
  .use(async req => req.method = Method.GET)
  .send()

console.assert(response.status === 200))
```

> Although this approach is rather lenghty and using helpers is much cleaner, it
> provides a straightforward way to extend Awi and/or create request templates.

As you can see, the interceptor concept provides a way to create request
templates for your application in a very nice and reusable way. This can be
especially useful when making authorized requests.

```typescript
import { Awi, Response } from 'awi'

// Define the template to be reused.
const auth = () => new Awi()
  .use(async req => req.base = 'http://server.api')
  .use(async req => req.headers['authorization'] = `Bearer ${localStorage.token}`)

// Use the template and provide further parameters.
const response: Response = await auth()
  .get('user')

console.assert(response.status === 200))
```

### API Reference

All of Awi's functionality is summed up on the [wiki page](https://github.com/kouks/awi/wiki/API-Reference).

## License

MIT


<!--
lightweight
extendable
flexible
-->
