<h1 align="center">
  <img src="https://protoblast.develry.be/media/static/protoblast-small.png" width=30 alt="Protoblast logo"/>
  <b>Protoblast</b>
</h1>
<div align="center">
  <!-- CI - TravisCI -->
  <a href="https://travis-ci.org/skerit/protoblast">
    <img src="https://travis-ci.org/skerit/protoblast.svg?branch=master" alt="Mac/Linux Build Status" />
  </a>

  <!-- CI - AppVeyor -->
  <a href="https://ci.appveyor.com/project/skerit/protoblast">
    <img src="https://img.shields.io/appveyor/ci/skerit/protoblast/master.svg?label=Windows" alt="Windows Build status" />
  </a>

  <!-- Coverage - Codecov -->
  <a href="https://codecov.io/gh/skerit/protoblast">
    <img src="https://img.shields.io/codecov/c/github/skerit/protoblast/master.svg" alt="Codecov Coverage report" />
  </a>

  <!-- DM - Snyk -->
  <a href="https://snyk.io/test/github/skerit/protoblast?targetFile=package.json">
    <img src="https://snyk.io/test/github/skerit/protoblast/badge.svg?targetFile=package.json" alt="Known Vulnerabilities" />
  </a>

  <!-- DM - David -->
  <a href="https://david-dm.org/skerit/protoblast">
    <img src="https://david-dm.org/skerit/protoblast/status.svg" alt="Dependency Status" />
  </a>
</div>

<div align="center">
  <!-- Version - npm -->
  <a href="https://www.npmjs.com/package/protoblast">
    <img src="https://img.shields.io/npm/v/protoblast.svg" alt="Latest version on npm" />
  </a>

  <!-- License - MIT -->
  <a href="https://github.com/skerit/protoblast#license">
    <img src="https://img.shields.io/github/license/skerit/protoblast.svg" alt="Project license" />
  </a>
</div>
<br>
<div align="center">
  Extend native objects with helpful methods to speed up development
</div>
<div align="center">
  <sub>
    Coded with ❤️ by <a href="#authors">Jelle De Loecker</a>.
  </sub>
</div>

## Installation

    $ npm install protoblast

## Documentation

For more information and API documentation, visit the [Protoblast homepage](https://protoblast.develry.be).

## Getting Started

You can use Protoblast in 2 ways.

### Modify the native prototypes

This is the easiest way to use all the new methods & shims.
Ideal for internal or big projects.

```javascript
// Require protoblast and execute the returned function
require('protoblast')();

var str = 'Get what we want';

// New native methods, like after, will have been added
str.after('what');
// ' we want'
```

### Use bound functions

You can also get an object that has pre-bound all the new methods,
without modifying anything.

It's more verbose, but should be the way to use Protoblast in redistributable
modules.

```javascript
// Require protoblast and execute the returned function with `false` as parameter
var Blast = require('protoblast')(false);

var str = 'Get what we want';

// Native objects will have been left alone, they can be accessed like this:
Blast.Bound.String.after(str, 'what');
// ' we want'
```
