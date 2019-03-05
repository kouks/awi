
## 0.0.8

**Fixed**

* Zero status XHR response bug

## 0.0.7

**Added**

* e2e tests scaffold

**Fixed**

* Port is now passed to the `HttpExecutor`
* Changed structure of unit tests
* Fixed backward compatibility bugs

**Removed**

* The `Status` enumeration

## 0.0.6

**Added**

* `body<T>` and `optional<T>` helpers
* Package documentation

**Fixed**

* Executors are now `Optional<Executor>`

## 0.0.5

**Added**

* `HttpExecutor` to execute requests in a node environment
* Interceptor priority, determined by a number
* Default interceptors to modify headers and determing a default executor

## 0.0.2

First somewhat working release of the package.

**Added**

* `XhrExecutor` to execute requests on web
* All the contracts, `Awi` class, enumerations and types
* Set up pipelines
