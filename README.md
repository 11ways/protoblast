# ![protoblast](http://protoblast.develry.be/media/static/protoblast-small.svg?width=30) Protoblast

[![NPM version](http://img.shields.io/npm/v/protoblast.svg)](https://npmjs.org/package/protoblast) 
[![Build Status](https://secure.travis-ci.org/skerit/protoblast.png?branch=master)](http://travis-ci.org/skerit/protoblast) 
[![Coverage Status](https://coveralls.io/repos/github/skerit/protoblast/badge.svg?branch=master)](https://coveralls.io/github/skerit/protoblast?branch=master)

Extend native objects with helpful methods to speed up development,
or leave the native objects alone and use bound methods.

## Installation

    $ npm install protoblast

## Documentation

For more information and API documentation, visit the [Protoblast homepage](http://protoblast.develry.be).

## Getting Started

You can use Protoblast in 2 ways.

### Modify the native prototypes

This is the easiest way to use all the new methods & shims.
Ideal for internal or big projects.

```javascript
// Require protoblast and execute the returned function
require('protoblast')();

var arr = [5,9,3,4,1];

// New native methods, like flashsort, will have been added
arr.flashsort();
// [1, 3, 4, 5, 9]
```

### Use bound functions

You can also get an object that has pre-bound all the new methods,
without modifying anything.

It's more verbose, but should be the way to use Protoblast in redistributable
modules.

```javascript
// Require protoblast and execute the returned function with `false` as parameter
var Blast = require('protoblast')(false);

var arr = [5,9,3,4,1];

// Native objects will have been left alone, they can be accessed like this:
Blast.Bound.Array.flashsort(arr);
// [1, 3, 4, 5, 9]
```