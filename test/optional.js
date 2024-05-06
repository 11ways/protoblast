let assert = require('assert'),
    Blast,
    Optional,
    ObservableOptional;

describe('Optional', () => {

	before(() => {
		// Get the Protoblast instance
		Blast = require('../index.js')();
		Optional = Blast.Classes.Develry.Optional;
		ObservableOptional = Blast.Classes.Develry.ObservableOptional;
	});

	describe('Optional', () => {
		describe('constructor', () => {
			it('should create an Optional instance with the given value', () => {
				const opt = new Optional(42);
				assert.strictEqual(opt.value, 42);
			});
		});
	
		describe('unDry', () => {
			it('should create an Optional instance from a dried value', () => {
				const dried = { value: 'hello' };
				const opt = Optional.unDry(dried);
				assert.strictEqual(opt.value, 'hello');
				assert.strictEqual(opt instanceof Optional, true);
			});
		});
	
		describe('setValue', () => {
			it('should set the value of the Optional instance', () => {
				const opt = new Optional(10);
				opt.setValue(20);
				assert.strictEqual(opt.value, 20);
			});
		});
	
		describe('toDry', () => {
			it('should be used to dry the instance', () => {
				const opt = new Optional('foo');
				let dried = Blast.Classes.JSON.dry(opt);
				let undried = Blast.Classes.JSON.undry(dried);

				assert.strictEqual(undried.value, 'foo');
				assert.strictEqual(undried instanceof Optional, true);
			});
		});
	
		describe('isPresent', () => {
			it('should return true if the Optional instance has a value', () => {
				const opt = new Optional(true);
				assert.strictEqual(opt.isPresent(), true);
			});
	
			it('should return false if the Optional instance has no value', () => {
				const opt = new Optional(null);
				assert.strictEqual(opt.isPresent(), false);
			});
		});
	
		describe('orElse', () => {
			it('should return the value if present', () => {
				const opt = new Optional(42);
				assert.strictEqual(opt.orElse(10), 42);
			});
	
			it('should return the fallback value if not present', () => {
				const opt = new Optional(null);
				assert.strictEqual(opt.orElse(10), 10);
			});
		});
	
		describe('getResolvedValue', () => {
			it('should return the value of the Optional instance', () => {
				const opt = new Optional('bar');
				assert.strictEqual(opt.getResolvedValue(), 'bar');
			});
		});
	});
});

describe('ObservableOptional', () => {
	describe('constructor', () => {
		it('should create an ObservableOptional instance with the given value', () => {
			const opt = new ObservableOptional(42);
			assert.strictEqual(opt.value, 42);
			assert.strictEqual(opt instanceof ObservableOptional, true);
			assert.strictEqual(opt instanceof Optional, true);
		});
	});

	describe('setValue', () => {
		it('should set the value and notify listeners', () => {
			const opt = new ObservableOptional(10);
			let newValue;

			opt.addListener((value) => {
				newValue = value;
			});

			opt.setValue(20);
			assert.strictEqual(opt.value, 20);
			assert.strictEqual(newValue, 20);
		});

		it('should not notify listeners if the value did not change', () => {
			const opt = new ObservableOptional(10);
			let notifiedCount = 0;

			opt.addListener(() => {
				notifiedCount++;
			});

			opt.setValue(10);
			assert.strictEqual(notifiedCount, 0);
		});
	});

	describe('addListener', () => {
		it('should add a listener that is called when the value changes', () => {
			const opt = new ObservableOptional(10);
			let newValue;

			opt.addListener((value) => {
				newValue = value;
			});

			opt.setValue(20);
			assert.strictEqual(newValue, 20);
		});
	});

	describe('removeListener', () => {
		it('should remove a previously added listener', () => {
			const opt = new ObservableOptional(10);
			let notifiedCount = 0;

			const listener = (value) => {
				notifiedCount++;
			};

			opt.addListener(listener);
			opt.setValue(20);
			assert.strictEqual(notifiedCount, 1);

			opt.removeListener(listener);
			opt.setValue(30);
			assert.strictEqual(notifiedCount, 1);
		});
	});
});