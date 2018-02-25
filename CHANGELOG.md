## 0.5.2 (WIP)

* Fix prototype pollution in `Object.merge`
* When a `next` method of `Function.parallel` or `Function.series` is called multiple times an error will be thrown

## 0.5.1 (2018-02-24)

* `Function.regulate` will throw an error if no function is given
* `Blast.require`'d files will now be added to the client script
* All files required by Blast are now loaded using `"use strict";`
* Fixed many strict errors
* Setting `module.exports` in a Blast file function will have the expected result (when using `Blast.require`)
* A `Pledge` will now throw an `Error` if there are no rejection listeners for it
* Added `Pledge#silentReject` which won't throw an `Error` in case there are no rejection listeners
* Add context setting as the second parameter to `Blast.nextTick` and `Blast.setImmediate`
* Removed `Blast.setTimeout`

## 0.5.0 (2018-02-17)

* Use `Promise.resolve()` based solution for browser-side `nextTick` implementation (50x faster than using an `Image` error)
* Add support for using Protoblast in a WebWorker
* `Object.divide` will return arrays unchanged
* Added `RegExp.isRegExp`
* `Object.setPath` will now no longer replace functions with objects
* Class namespaces are now functions themselves, will return the class of the same name in the namespace if called
* When inheriting a class that does not yet exist, the static properties of the main namespace class will already be added to the new constructor
* Make sure constitutors added during the `doLoaded` phase are executed
* Add `Pledge#handleCallback` which will handle old-style callbacks
* Added some more NW.js fixes

## 0.4.2 (2018-01-15)

* `JSON.dry` will no longer add `namespace` or `dry_class` properties if `toDry` has already set them
* `JSON.undry` will now accept a dried object that has been parsed using regular `JSON.parse` (this is faster than re-stringifying & undrying it)
* Fixed the space problem in `JSON.dry`
* `Object.walk` will now return an object with all the seen objects and a weakmap containing the seen count
* `Object.walk` can now be called without a task function
* If DRY references to a value has a shorter path, use that in the future
* From now on, `json-dry` is its own package once again
* Added `JSON#toDryObject`, an alias for `Dry.toObject`

## 0.4.1 (2018-01-05)

* Certain characters in URL queries will no longer be encoded, like brackets
* `String#encodeHTML` now correctly encodes characters with 2 codepoints (emojis)
* Fix Crypto on IE11
* Rewrote `Object.exists` to use `Object.path`
* Fix `URL#toString`: hashtags now include the actual `#`
* Use the `innerText` method on browsers to decode HTML entities
* The big HTML entities map is no longer needed on the client side, so it is a normal uncompressed javascript file again
* Fix `Function.timebomb` to actually set the `exploded` property
* Enable cutting out code for the client side
* Remove the string compression code
* `Array#max` and `Array#min` now also accept a path
* Static methods are now also set on the `Bound` objects
* Added `Object.parseDotNotationPath` to turn a path string into an array
* Added `Array#modifyByPath(path, fnc)`
* Use `Buffer.byteLength` to calculate `Content-Length` headers
* The `Pledge` returned by `Function.parallel` and `Function.series` will now be resolved with the return value of the callback, if any

## 0.4.0 (2017-10-12)

* Added `Pledge` class, which is a type of `Promise`
* `Function.parallel` now returns a `Pledge` instance
* `Function.create` now also sets the wrapper arguments, so the `length` property matches
* Added `Informer.setAfterMethod(filter, key, method)`, which is a method that will prevent execution until it has seen the given filter (string or object)
* Fix crash when using recursive objects on `Object.alike(a, b)`
* `Array#flatten` will now preserve the perceived order
* Add support for other HTTP methods in `Request`
* Add experimental `Informer.setCacheMethod` function
* Remove the `#toSource()` methods
* `Benchmark` should now calculate correct overhead cost on node 8.x

## 0.3.10 (2017-09-07)

* Fix `String#fowler()` checksum generation
* Fix `String#numberHash()`, it's now slower than `String#checksum()` but still faster than `String#fowler()`
* `Object.checksum` will now split strings in 2 for checksuming, this decreases collisions without affecting speed
* Use same collision improvement in `Object.checksum` on objects, arrays & regexps.
* `String#checkum` now accepts a `start` and `end` parameter
* `Informer#queryListeners(type, mark_as_seen)` will now honor the `mark_as_seen` parameter
* `Informer#hasBeenSeen` should now also work when no listeners have been attached
* `Informer#unsee` will now also accept filter objects
* Added `FunctionQueue#force(fnc, args, options)` which will forcefully run the given function on the queue, even if the limit is reached.
* Made `FunctionQueue` run more asynchronous when `add`-ing of `force`-ing after it has already started

## 0.3.9 (2017-08-27)

* `String.encodeCookie` will use `encodeURI` for the path & domain
* `Function.methodize` should set the original function as the unmethodized one
* `Function.unmethodize` should set the original function as the methodized one

## 0.3.8 (2017-08-11)

* Add `Function.isNameAllowed(name)` which checks if a name is allowed
* Added very basic `WeakMap` polyfill
* Add `Function.getArgumentNames`
* Allow ability to add Function driers
* Added `Number.isNumeric(input)`
* `Array#sortByPath` will now interpret numbers as new directions
* Added `Array#findByPath(path, value)`
* `URL#addQuery` will no longer iterate over non-plain objects
* Add `limit` parameter to `Object.walk` to limit the recursiveness
* Add `String#splitOnce` and `String#splitLimit`
* Fix `Function.inherits` not adding static methods on time
* Fix `Math.removeOutliers` so it isn't too generous
* Add `String#splitOnce(separator)` and `String#splitLimit(separator, times)`

## 0.3.7 (2017-07-03)

* Added `Object.isSelfContained`, which returns true in case of Date, RegExp, String objects, ...
* `Object.merge` will now treat RegExps and Dates as a single variable, and not as an object that also needs to be merged
* Added `Math.calculateDistance` to calculate the distance between 2 sets of coordinates
* Added `Array#shuffle`, which shuffles an array in place
* Added `SeededRng` class for random numbers that repeat
* Added `get_stream` option to `Request#http_request`, which returns the correct output stream (same `res` object or `gzip`) instead of the body
* `Blast.fetch` is now also available in the browser
* `Object.isPlainObject` will now return true for objects without a prototype
* Redirected requests will no longer fail when being redirected to a path without hostname
* `String#fowler` should now produce correct hashes
* Make `Crypto.randomBytes` return an Int8Array in the browser

## 0.3.6 (2017-04-17)

* Inheritance schedule fixes
* Fix URL class in Cordova
* Added `Blast.isEdge` to detect and fix Edge issues
* More attempts to fix the URL class in IE/Edge
* Fix multiple inheritance shallowly inheriting second parent
* `JSON.undry` will now parse `null` strings correctly
* `Function.throttle` has a new parameter `reset_on_call`, to delay execution as long as it's being called on.
* Classes will now constitute in an expected order. Classes that inherit a not-yet-existing parent won't be pushed to the end of the queue anymore.
* `Object.size()` will now always return a number
* `Object.size()` will now also work on RegExp and Date objects
* The `Request` class will callback with an error for status codes >= 400
* Added `Number#formatMoney(decimal_count, decimal_separator, thousand_separator)`
* The `Function.thrower` dummy callback will no longer throw falsy values

## 0.3.5 (2017-01-21)

* Fixed `String#endsWith` so empty strings will return true
* Make `String#endsWith` and `String#startsWith` shims
* Protoblast with complain about overwriting properties when in debug mode

## 0.3.4 (2017-01-21)

* Fix bug in `Object.checksum` using `valueOf` on an object without prototype
* Fix constructors not getting static methods when in non-native-modifying mode
* Fix: `unmethodize` and `methodize` shouldn't get stuck in a loop because of the function name
* Test: creating an anonymous function is a bit harder in new node versions
* Improve `Object.alike` performance and add tests
* Added 4th parameter to `Function.inherits` that skips constitutors when falsy
* Fixed bug where constitutors would be executed twice for delayed inheritance
* Add `String.decodeAttributes`

## 0.3.3 (2016-10-14)

* `JSON.dry` now also honours the `space` parameter

## 0.3.2 (2016-10-04)

* `asyncLoop` functions (like Function.while) will now execute test
  and task function in the same tick, in stead of first checking
  the test, then doing the task on the next tick
* `Object.checksum` no longer skips undefined values in objects
* fix: child classes with a different namespace than the parent
  are now actually stored in that namespace
* `String#decodeHTML()` should now handle hexadecimal entities properly
* Make sure an Object has the `hasOwnProperty` method before using it in JSON-Dry
* `Object.checksum` should also checksumize RegExps correctly
* `RegExp.interpret` now also accepts flags as second parameter
* Decompress HTML entities on-the-fly

## 0.3.1 (2016-07-02)

* Fix protoblast version bug
* Add static `Number.calculateNormalizeFactors` and `Number.normalize` methods
* Add `Math.removeOutliers(arr)` which returns a new array without outliers
* Add `Number.denormalize`

## 0.3.0 (2016-06-22)

* Added `Informer#unsee` method, so 'after' and such can be reset
* Added `Number#bitAt` method, to return the bit at the specified position
* `Array#clip` 'highest' value is now optional
* `Array#employ` has been removed
* `Function.benchmark` will now calculate overhead based on self-created dummies
* If another Protoblast instance is detected during loading, it will only be
  returned if the major & minor version is the same and the patch is higher.
  Otherwise, a new instance is created. This is only the case in the
  non-global-modifying mode.

## 0.2.1 (2016-06-06)

* Add `queue_drop` option to FunctionQueue, which will limit amount of items
  in a function queue by dropping older added tasks
* Add `Array.likeArray` to determine if an object is like an array
* `Object.dissect` will only add numeric array properties to the result
* Added `Blast.setTimeout` and `Blast.setSchedule` for more precise timers
* Add `String.randomMac` to generate a random mac address
* Add `Function.getNamespace` to get/create a namespace object
* `Blast.DEBUG` is now true if there is a DEBUG environment variable

## 0.2.0 (2016-05-02)

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
* When the function passed to `Object.walk` returns false, it won't recurse
* Added `Object.getPropertyDescriptor`, which will look for a descriptor
  up the prototype chain
* Getter and setter functions will now also receive a `super` property
  reference to the function they're overriding
* `Function.setStatic` properties can now be overwritten
* `Function.setStatic` can now optionally not be inherited
* Add `Blast.createObjectId` for the browser
* Checksumming a null value won't throw an error anymore
* `Object.merge` should now correctly assign objects over primitive values

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
* `Array.cast` will handle select elements properly from now on
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
