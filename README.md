# Protoblast

[![NPM version](http://img.shields.io/npm/v/protoblast.svg)](https://npmjs.org/package/protoblast) 
[![Build Status](https://secure.travis-ci.org/skerit/protoblast.png?branch=master)](http://travis-ci.org/skerit/protoblast)

Extend native objects with helpful methods to speed up development,
or leave the native objects alone and use bound methods.

## Installation

    $ npm install protoblast

## Features

* Targeted for node.js & optimal performance, but perfectly usable in the browser
* A way to use all new methods without modifying native prototypes

## Todo

* Write documentation (currently a WIP)
* Write more unit tests (coverage is currently around 60%)
* Finish browser unit tests
* ...

## Use

You can use Protoblast in 2 ways.

### Modify the native prototypes

This is the easiest way to use all the new methods & shims.
Ideal for internal or big projects.

```javascript
require('protoblast')();

// Now new native methods have been added
var arr = [5,9,3,4,1];

arr.flashsort();
// [1, 3, 4, 5, 9]
```

### Use bound functions

You can also get an object that has pre-bound all the new methods,
without modifying anything.

It's more verbose, but should be the way to use Protoblast in redistributable
modules.

```javascript
var Blast = require('protoblast')(false);

// Now new native methods have been added
var arr = [5,9,3,4,1];

Blast.Bound.Array.flashsort(arr);
// [1, 3, 4, 5, 9]
```