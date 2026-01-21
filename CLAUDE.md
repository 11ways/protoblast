# Protoblast Development Guide

## Overview

Protoblast is a native object expansion library that adds utility methods to JavaScript built-in types. It provides the foundation for the entire Alchemy ecosystem, including the class inheritance system used by AlchemyMVC, Hawkejs, and other projects.

## Commands
- Run tests: `npm test`
- Run with coverage: `npm run coverage`

## Usage Modes

### Modify Native Prototypes (Default)
```javascript
// Adds methods directly to native objects
require('protoblast')();

'hello world'.after('hello');  // ' world'
```

### Bound Functions Mode
```javascript
// Does not modify native objects - safer for libraries
const Blast = require('protoblast')(false);

Blast.Bound.String.after('hello world', 'hello');  // ' world'
```

## Core Concepts

### Global Variables (when loaded)
- `Blast` - The main Protoblast instance
- `Classes` - All registered classes (e.g., `Classes.Informer`, `Classes.Pledge`)
- `Fn` - Alias for `Blast.Collection.Function`
- `Obj` - Alias for `Blast.Bound.Object`
- `Bound` - Contains bound versions of all methods

These variables are actually NOT globals, they're just made available via the custom module wrapper used by Protoblast.

### Environment Detection
```javascript
Blast.isBrowser    // Running in browser
Blast.isNode       // Running in Node.js
Blast.isServer     // Node.js or Bun
Blast.isBun        // Running in Bun
```

## Adding Methods to Native Types

Each type file (e.g., `lib/string.js`) uses definers created at the top:

```javascript
const defStat = Blast.createStaticDefiner('String'),  // For String.method()
      defProto = Blast.createProtoDefiner('String');  // For 'str'.method()

// Add a static method: String.isLetter(char)
defStat(function isLetter(character) {
    return character.toUpperCase() !== character.toLowerCase();
});

// Add a prototype method: 'hello'.after('he')
defProto(function after(needle) {
    // implementation
});
```

For shimming existing methods only when they don't exist:
```javascript
defProto(function trim() { ... }, true);  // true = shim only
```

## Browser Builds

Code between `// PROTOBLAST START CUT` and `// PROTOBLAST END CUT` is stripped from browser builds. Use this for Node.js-only code:

```javascript
// PROTOBLAST START CUT
const fs = require('fs');
// Node-only implementation
// PROTOBLAST END CUT
```

The `//_PROTOBLAST_ENV_//` marker is replaced with environment configuration during builds.

## Class Inheritance System

Protoblast provides `Function.inherits()` which is the foundation for all Alchemy projects:

```javascript
// Create a new class
const Animal = Function.inherits(function Animal(name) {
    this.name = name;
});

// Add instance method - function name becomes method name
Animal.setMethod(function speak() {
    return this.name + ' makes a sound';
});

// Add static method
Animal.setStatic(function create(name) {
    return new this(name);
});

// Add getter/setter property
Animal.setProperty(function upperName() {
    return this.name.toUpperCase();
});

// Lazy-initialized property (computed once on first access)
Animal.prepareProperty('cache', function() {
    return new Map();
});

// Inherit from Animal with namespace
const Dog = Function.inherits('Animal', 'MyApp', function Dog(name) {
    Dog.super.call(this, name);
});

// Deferred setup (runs after class hierarchy is ready)
Dog.constitute(function setup() {
    // Configure class after all parents are ready
});

// Mark class as abstract
Animal.makeAbstractClass();

// Get all child classes
Animal.getDescendants();        // Returns array of child classes
Animal.getDescendantsDict();    // Returns {type_name: ChildClass} map
Animal.getDescendant('dog');    // Get specific child by type_name
```

### Class Path Format

```javascript
// Function.inherits(parent, namespace, constructor)
Function.inherits('Alchemy.Base', 'MyApp', function MyClass() {});
// -> Classes.MyApp.MyClass

// Without namespace: class goes in parent's namespace
Function.inherits('Alchemy.Base', function MyClass() {});
// -> Classes.Alchemy.MyClass
```

**Namespace vs class as parent:**

If the parent path points to a namespace, it inherits from `Namespace.Namespace`:
```javascript
// Alchemy.Widget is a namespace containing Alchemy.Widget.Widget
Function.inherits('Alchemy.Widget', function MyWidget() {});
// Inherits from: Alchemy.Widget.Widget
// Result: Classes.Alchemy.Widget.MyWidget
```

If the parent path points to a class directly, child goes in parent's namespace:
```javascript
// Alchemy.Base is a class at Classes.Alchemy.Base (not a namespace)
Function.inherits('Alchemy.Base', function MyClass() {});
// Result: Classes.Alchemy.MyClass (NOT Classes.Alchemy.Base.MyClass)
```

## Key Classes

### Informer
Event emitter with queryable filters:
```javascript
const emitter = new Blast.Classes.Informer();

emitter.on('event', callback);                           // Simple event
emitter.on({type: 'user', action: 'login'}, callback);   // Filter-based
emitter.once('ready', callback);                         // Fire once
emitter.after('ready', callback);                        // Fire after event (or immediately if seen)
emitter.emit('event', data);
emitter.hasBeenSeen('ready');
emitter.unsee('ready');
```

### Pledge
Promise implementation with extra features:
```javascript
const Pledge = Blast.Classes.Pledge;

const pledge = new Pledge((resolve, reject) => resolve('value'));

pledge.state;        // 0=pending, 1=resolved, 2=rejected
pledge.isPending();
pledge.done((err, result) => {});  // Node-style callback

// Progress tracking
pledge.addProgressPart(10);
pledge.reportProgressPart(1);

// Variants
new Pledge.Lazy(executor);              // Starts on first .then()
new Pledge.Timeout(executor, 5000);     // Auto-rejects after timeout
new Pledge.Swift(executor);             // Synchronous when possible
```

### Swift (High-Performance Pledge)
For performance-critical code where synchronous execution is preferred:
```javascript
const Swift = Blast.Classes.Pledge.Swift;

Swift.execute(valueOrPromise);  // Returns value directly if resolved
Swift.waterfall(task1, task2, task3);
Swift.parallel([task1, task2]);
Swift.done(value, (err, result) => {});
```

## Async Flow Control

```javascript
// Sequential execution
Function.series([task1, task2, task3], callback);
await Function.series([task1, task2]);

// Parallel execution (optionally limited)
Function.parallel([task1, task2, task3], callback);
Function.parallel(2, [task1, task2, task3], callback);  // Max 2 concurrent

// Pass results through chain
Function.waterfall(
    (next) => next(null, 'value1'),
    (prev, next) => next(null, prev + 'value2'),
    callback
);

// Loop constructs
Function.while(testFn, taskFn, callback);
Function.forEach(data, (value, key, next) => {}, callback);
```

## Lifecycle Hooks

```javascript
Blast.ready(() => { /* All Blast classes available */ });
Blast.loaded(() => { /* All scripts loaded */ });
Blast.queueTick(fn);
Blast.queueImmediate(fn);
```

## Directory Structure

```
lib/
├── init.js                # Entry point, core initialization
├── blast.js               # Blast instance methods
├── function_inheritance.js # Function.inherits() and class system
├── function_flow.js       # series, parallel, waterfall, etc.
├── informer.js            # Event emitter class
├── pledge.js              # Promise implementation
├── string.js              # String prototype extensions
├── array.js               # Array prototype extensions
├── object.js              # Object utilities
├── date.js                # Date extensions
├── json.js                # JSON-Dry integration
└── ...                    # See lib/ for full list
```

## JSON-Dry Integration

Protoblast integrates [json-dry](https://github.com/11ways/json-dry) for serialization and cloning.

```javascript
// Serialize to JSON string (preserves references, class instances)
let dried = JSON.dry(obj);
let undried = JSON.undry(dried);

// Clone (returns live object, not string)
let cloned = JSON.clone(obj);
let prepared = JSON.clone(obj, 'toHawkejs');  // With custom method
```

**Custom method cloning** (`JSON.clone(obj, 'methodName')`):
- For each object, if `obj.methodName` exists, it's called with `(weakmap, ...extra_args)`
- Return value replaces the original in the clone
- This is how Hawkejs transforms server objects to client-safe versions

### Implementing Serialization

```javascript
// Instance method - what data to serialize
MyClass.prototype.toDry = function() {
    return { value: { name: this.name } };
};

// Static method - reconstruct from serialized data
MyClass.unDry = function(value) {
    return new MyClass(value);
};

JSON.registerClass(MyClass);  // Required for unDry
```

## Gotchas

1. **`Function.inherits()` signature:** First arg can be parent class name (string), parent class (function), or array (multiple inheritance)

2. **`constitute()` is queued, not overridden:** Multiple `constitute()` calls are all queued and run in order. No `super` call needed - parent constitutes run automatically before child constitutes.

3. **`postInherit()` vs `constitute()`:** `postInherit()` runs immediately after inheritance, `constitute()` runs after Blast.loaded()

4. **Pledge vs Promise:** Pledges have extra methods like `.done()`, progress tracking, and can be synchronous with Swift

5. **Bound vs Prototype:** When not modifying prototypes, use `Blast.Bound.String.method(str, args)` instead of `str.method(args)`

6. **Series/Parallel tasks:** Tasks receive a `next` callback - call it with `(err, result)` pattern

7. **Class type_name:** Automatically derived from class name (e.g., `MyClass` becomes `my_class`) - used in `getDescendantsDict()`

8. **Namespace functions:** A namespace like `Classes.MyApp` can be called as a function - it instantiates `Classes.MyApp.MyApp`

9. **Namespace as parent:** If parent path is a namespace (not a class), it inherits from `Namespace.Namespace` (e.g., `'Alchemy.Widget'` -> `Alchemy.Widget.Widget`)

10. **Namespace argument creates path:** `Function.inherits('Parent', 'A.B.C', fn)` registers class at `Classes.A.B.C.ClassName`

11. **Class groups are inherited:** `startNewGroup()` creates a group attached to that class. Child classes inherit group membership unless they call `startNewGroup()` again

12. **`JSON.clone` vs `JSON.dry`:** `clone()` returns a live object; `dry()` returns a JSON string. Clone with custom method (`clone(obj, 'toHawkejs')`) is used for object transformation, not serialization

13. **Custom clone method signature:** Methods like `toHawkejs` receive `(wm, ...extra_args)` where `wm` is a WeakMap - pass it when cloning nested objects to preserve reference identity

14. **`FixedDecimal.ensure()` uses the instance's scale:**
    ```javascript
    let rate = new FixedDecimal('0.05', 2);  // scale=2
    let divisor = rate.ensure(0.001);        // Returns 0.00 (rounded to scale 2!)
    // Use Decimal.ensure() to preserve precision of small values
    let divisor = Decimal.ensure(0.001);     // Keeps full precision
    ```
