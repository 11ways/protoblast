# ![protoblast](https://protoblast.develry.be/media/static/protoblast-small.png?width=30) Protoblast

[![NPM version](http://img.shields.io/npm/v/protoblast.svg)](https://npmjs.org/package/protoblast) 
[![Build Status](https://travis-ci.org/skerit/protoblast.svg?branch=master)](https://travis-ci.org/skerit/protoblast)
[![Coverage Status](https://codecov.io/gh/skerit/protoblast/branch/master/graph/badge.svg)](https://codecov.io/gh/skerit/protoblast)

Extend native objects with helpful methods to speed up development,
or leave the native objects alone and use bound methods.

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