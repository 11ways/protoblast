## 0.2.0 (WIP)

* Minor version bump because of added namespaces to `Function.inherits`
* `JSON.clone` will now also look for `#dryClone(wm)` and `#clone()` methods
* `JSON.clone` second parameter is an optional method name to use for cloning
* Fix bug in `JSONPath`
* `String#fillPlaceholders` can now remove used values from the given object
* Add `Date#setTimestring` to set the time in order of '12:00:00'
* The date 't' format should now return the number of days in the given month
* Added `JSON.safeParse`
* `Function.hinder` can now call pushed tasks with an error and other data
* `toDry` methods no longer need to return a 'path' property for undrying

## 0.1.12 (2016-02-03)

* Begin adding NW.js support
* `Date#format('L')` now returns a boolean instead of a string
* Always modify prototypes of classes made by Protoblast itself (URL fixes)

## 0.1.11 (2016-01-08)

* `String#slug` now removes diacritics and separator repeats
* Improve `Object.merge`, still not ready for release though
* Add `getChildren` method to class functions
* Make class constitutions happen in order
  (child constitution would happen before the parent's)
* Don't use broken URLConstructor objects on legacy browsers
* `Array#include` now appends when no index is given
* `Date.create` now accepts a value
* `Date.difference` now uses `Date.create` instead of `new Date`
* `Array#include` correctly handles single argument
* Added `Object.first`
* Use `#valueOf()` when getting object checksums,
  fixes `Date` instances getting the same checksums
* Add `String#fixHTML` and `String#truncateHTML`
* Fix JSON-dry special char bug
* Decode HTML when slugifying a string
* Improve `Object.setPath`
* Add `Object.formPath` and `Object.setFormPath`
* `JSON.clone` is now much more performant than the old method
* Properties set on a Deck instance now also get JSON-dried
* Fix pushed tasks in `Function.hinder` object

## 0.1.10 (2015-08-27)

* Add `Blast.loaded`, which will execute after initial scripts have finished
* `Function.constitute` will still execute ASAP, but using `Blast.loaded`
* `Array.cast` will handle <select> elements properly from now on
* `JSON.dry` uses JSON-js from now on, so `toDry` can come before `toJSON`
* Add `JSON.registerDrier` and `JSON.registerUndrier`
* Add link to homepage http://protoblast.develry.be

## 0.1.9 (2015-07-29)

* Add FunctionQueue#destroy()
* FunctionQueue's throttle & limit functionality now can be combined to
  execute functions in batches
* Object#path doesn't split individual arguments anymore
* Added Function.throttle(fnc, ms, immediate)
* FunctionQueue's will only be sorted when dirty
* Bugfixes in non-global mode
* Class constructors now have a `children` array property,
  with direct descendants only
* Static class properties are now also added to already existing children
* `Object.setPath` now also creates arrays when encountering numeric keys
* `Informer` properties are still created when first requested, but no longer 
  with `Object.defineProperty`
* Fixed bug where FunctionQueue's lastEnd time was not being set

## 0.1.8 (2015-05-16)

* Added Function.forEach.parallel
* Added Informer#forwardEvent
* Added Math.lowpass and Math.interpolate
* Added Math.plotdate and Date.difference
* Make it possible to set class-wide event listeners
* Add tryCatch function
* Informer event functions now also have a reference to the original context
  under the 'that' property
* Object.isPrimitiveObject checks if constructor exists before getting its name
* Object.checksum handles circular references from now on
* Add FunctionQueue class, which can be created through Function.createQueue()
* Add throttle & sorting to the FunctionQueue

## 0.1.7 (2015-03-04)

* Fixed event listeners stop() context function

## 0.1.6 (2015-02-27)

* Add option to capitalize each word when using String#titleize
* Function#prepareProperty now passes along a function to the given setter
  which queues given functions to run after the property has been set.
  This happens synchronously (otherwise setImmediate should be used).
* Function inheritance now uses nextTick instead of setImmediate
* Add Object.walk, the recursive version of Object.each
* Object.hasProperty should no longer fail on non-objects
* Allow 'Infinity' for cookie expires & maxage values
* Add JSON.clone, to quickly clone something using regular JSON
* Fix JSON.dry, had problems with the chain when using toJSON
* Fix: Function.doUntil runs while the test is falsy, not truthy
* Add Function.regulate and Function.count, improve String#encodeHTML

## 0.1.5 (2014-12-14)

* Make sure Function.series does not fire the callback multiple times
* Modify Array#unique to allow a path be checked for duplicates
* Add Array#sortByPath to save the user from writing unwieldy sort functions
* Add the wrapper created with Function.create to the source function
* Add Informer.isInformer & Iterator.isIterator static methods
* Add Math.overlaps() to see if 2 ranges overlap
* Add String#normalizeAcronyms, which removes dots from acronyms

## 0.1.4 (2014-12-07)

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
* Extended classes are also saved in Blast.Classes
* Function.inherits now allows strings. If the given class name isn't available
  yet, it will be extended once it is.
* Added String#controllerClassName and String#modelClassName
* Add Date#stripTime and Date#stripDate
* If an Informer event is emitted and the last argument is a function,
  it will always be seen as a callback. If you just want to emit a function
  a null will have to be appended
* Informer listeners can now have a context attached
* Add Deck#clone() method
* Add Deck#has(key) method
* Deck#get(key, def) now can set the key's value if it has not been set yet
* Add Deck.create() static method
* Add Object.setPath({}, path, value)
* Add JSON.dry and JSON.undry (circular & reviver support)
* Add String#assign and String#assignments
* Add Iterator#reset, to go back to the beginning
* Deck now implements the ES6 iterator protocol by inheriting our Iterator class
* Function.parallel now also has a non-async mode
* Add Function.hinder, which executes a worker and only afterwards executes
  other tasks added to it
* Add Function.thrower, a dummy function that can throw an error
* Add static String methods: encodeURI, decodeURI, decodeJSONURI, decodeCookie
* Add basic Crypto class, for generating UIDs
* Add Function.timebomb(timer, callback)
* Add String#fowler, which generates a fnv1-a hash
* Add Date methods to simplify date manipulation
* Add Date#format method
* Add Function.forEach method

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
