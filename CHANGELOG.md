## 0.1.4 (WIP)

* Everything is now defined with `configurable` and `writable` set to true
* Added Array#include and Array#flatten (which behaves differently then Object.flatten)
* Turned URL#toString into a shim
* Added Array#employ, for when Array#map is too verbose
* Added Function.until, .doUntil and .while (sharing code with .doWhile)
* BUGFIX: String#dissect will no longer throw an error on empty strings
* Added Function.benchmarkCSSRule for the browser
* Added Function#setProperty, for property getters & setters
* Added Function#prepareProperty, which sets the value through a getter
  on first get, and removes the getter after that
* Added Function#setStatic methods
* Added Object.inject (assign for non-enumerables) and multiple inheritance
* Allow Deck to return sorted arrays without cloning (slicing) them
* Improve performance of Object.hasProperty
* Extended classes also inherit static properties (but do not share instances)

## 0.1.3 (2014-09-15)

* Added Array#sum(property, map)
* Math.deviation should actually have been 'standardDeviation'
* Added the correct Math.deviation
* Math.variance has been modified, now accepts second parameter for bias
* Added a (fast!) Math.pearson correlation score function, based on 
  Matt West's <matt.west@kojilabs.com> original function
* Added Math.spearman
* Added Array#flashsort() for faster sorting
* All Math functions that need sorting now use flashsort
* Added Math benchmarks
* Added clipping functions to Number, Array and Math
* Added Object.size(variable)
* Added String#slug()
* Fixed lots of bugs in Function.series and Function.parallel
* Fixed all `arguments` leaks, greatly improving performance
* Fixed IE bugs, added Function#name getter for IE
* Added Selenium/Saucelabs testing
* Blast.defineValue can now take an array of names to assign same value to
  multiple properties
* Added Informer class, an advanced event emitter based on HawkEvents
* Added URL class (for node.js & IE9) + URL.parse()
* Added Blast.inherits function, like node's util.inherits
* Added Object.checksum and Object.alike
* Informer can now handle async events
* Added RegExp.execAll
* Function.series forces asynchronicity by default (by using setImmediate),
  but if wanted this can be disabled by passing a boolean false as first arg
* Added shim for ES6's Array#fill(value, start, end)
* Added Function.inherits, Function#extend and Function#setMethod
* Added shim for ES6's String#codePointAt(position)
* Fixed typo in variable name in flashsort
* Added String compression, using Pieroxy's original lz-string
* Added String#escapeUnicode(), to get the complete escaped string
* Removed the HTML Entities from the string_entities script file,
  and added a (compressed) file called 'string_compressed_entities.js'

## 0.1.2 (2014-08-28)

* Added Array#insert(index, value, ...)
* Added Object.hasProperty(obj, propertyName)
* Added String#truncate(length, word, ellipsis)
* Added String#stripTags()
* Added Date.isDate(variable)
* Object.path(obj, path) now also accepts an array or multiple arguments
* Add Array.range(start, stop, step) method, which behaves like Python's range()
* Add Array#closest(goal) method to find the closest value to the given goal
* Added String#before(needle, first) and String#after(needle, first)
* Added String#beforeLast(needle) and String#afterLast(needle)
* Added Object.isObject(obj)
* Added Object.isPlainObject(obj)
* Added Object.isPrimitiveObject(obj)
* Added String.serializeAttributes(obj)
* Added String#encodeHTML and String#decodeHTML
* Added Object.flatten(obj)
* Added Array#unique()
* Added Function#curry()
* Added Iterator class and Array#createIterator()
* Added Deck class (ordered object)
* Added unit tests for Iterator & Deck
* Added String#dissect(open, close)
* Added RegExp.interpret(pattern)
* Added RegExp#getPattern()
* Added RegExp#getFlags()
* Added RegExp.combine(r1, r2, ... rn)
* Added Function#tokenize(addType, throwErrors)
* Added Function.tokenize(source, addType, throwErrors) and Function.getTokenType(str)
* Added JSONPath, added Object.extract using that class
* Added Number.random(min, max)
* Speed up String#count and add String#replaceAll that doesn't use regexes
* Added Math methods: mean, median, variance and (standard) deviation
* Started adding Benchmarking functions
* Added (asynchronous) function flow controls
* Added Number#humanize method
* Update inflection rules (Ben Lin's From node.inflection, https://github.com/dreamerslab/node.inflection)

## 0.1.1 (2014-06-23)

* Added basic client-side support
* Added toSource methods
* Added Object.uneval support (also in Protoblast.uneval)
* Added unit tests

## 0.1.0 (2014-06-20)

* Moved code from Alchemy MVC
* Added RegExp, Number and Function blasts
