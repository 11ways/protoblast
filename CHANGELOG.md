## 0.1.2 (WIP)

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

## 0.1.1 (2014-06-23)

* Added basic client-side support
* Added toSource methods
* Added Object.uneval support (also in Protoblast.uneval)
* Added unit tests

## 0.1.0 (2014-06-20)

* Moved code from Alchemy MVC
* Added RegExp, Number and Function blasts