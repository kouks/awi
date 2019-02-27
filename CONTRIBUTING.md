# Contributing

When contributing to this repository, please first discuss the change you wish
to make via issue, email, or any other method with the owners of this repository
before making a change.

Please note we have a code of conduct, please follow it in all your interactions
with the project.

## Issue Creation

There are 2 issue templates available. When reporting a bugfix, try providing us
with as much info as possible, the issue template should give you a general
idea. Use the feature request template if you have an enhancement idea for Awi.
For any other enquiries, feel free to create a custom issue or contact the owner
directly via email at kouks.koch@gmail.com.

## Pull Request Process

Any pull requests including bugfixes and new features should be open on the
`master` branch.

* Make sure to pull latest changes from the `master` branch and resolve any
conflicts before opening the PR
* Increment the version of the package. This project uses the [SemVer][semver]
scheme
* Fill out the provided PR template consciously, providing us with as much
information as possbile; each pull request should also reference an issue
* All PRs have to pass a continuous integration pipeline checking for correct
builds, tests and [code style][codestyle]
* At least one approving review has to be present on the PR before you can merge
it

## Code Style

Awi uses the `tslint:recomemnded` code style setting for typescript with minor
adjustments. Most of these adjustments are enforced by the build script but the
rules mentioned below need to be followed explicitly.

### Documentation blocks

* Method and property descriptions and tags MUST have a line break at 80
characters
* Method and property descriptions MUST end with a period
* All tags MUST NOT end with a period
* `@param` tags MUST correspond to the method arguments
* `@return` tags MUST be written in first person
* `@return` tags MUST be present on all methods except those that return `void`
or `Promise<void>` where they MUST NOT be present
* `@throws` tags MUST be present where necessary
* `@throws` tags MUST specify the exception type in curly brackets followed by
an explanation starting with 'If'
* Overridden or implemented methods MUST have their documentation on the
abstract, and the final method documentation MUST include `{@inheritdoc}`

### Imports and exports

* Imports MUST be ordered by their line length
* Imports MUST not exceed 80 characters in line length, if this happens, imports
MUST be split on multiple lines, one class on each line which MUST be ordered
according to their line length
* Files MUST NOT export default
* Only one member SHOULD be exported per file

### Miscellaneous

* Classes and interfaces MUST be padded with blank lines
* Methods returing a `Promise<T>` MUST be declared `async`
* `any` types MUST NOT be used unless necessary in which case a clarifying
comment MUST be present to explain why the `any` type must have been used
* Method with declaration line length more than 80 characters MUST split its
parameters on multiple lines, one parameter per line

[codestyle]: #code-style
[semver]: https://semver.org/
