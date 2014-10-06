var assert = require('assert'),
    Blast;

describe('String Inflections', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('#pluralize()', function() {
		it('should return the plural representation of the string', function() {
			assert.strictEqual('buses', 'bus'.pluralize());
			assert.strictEqual('windows', 'window'.pluralize());
			assert.strictEqual('octopi', 'octopus'.pluralize());
		});
	});

	describe('#singularize()', function() {
		it('should return the singular representation of the string', function() {
			assert.strictEqual('bus', 'buses'.singularize());
			assert.strictEqual('window', 'windows'.singularize());
			assert.strictEqual('octopus', 'octopi'.singularize());
		});
	});

	describe('#modelName(postfix)', function() {
		it('should return the model name representation of the string', function() {
			assert.strictEqual('News', 'news'.modelName());
			assert.strictEqual('User', 'user'.modelName());
			assert.strictEqual('App', 'app'.modelName());
		});
	});

	describe('#modelClassName()', function() {
		it('should return the model name representation of the string, with the Model postfix', function() {
			assert.strictEqual('NewsModel', 'news'.modelClassName());
			assert.strictEqual('NewsModel', 'newsModel'.modelClassName());
			assert.strictEqual('NewsModel', 'news_model'.modelClassName());
			assert.strictEqual('UserModel', 'user'.modelClassName());
			assert.strictEqual('AppModel', 'app'.modelClassName());
		});
	});

	describe('#controllerName(postfix)', function() {
		it('should return the controller name representation of the string', function() {

			assert.strictEqual('App', 'app'.controllerName());
			assert.strictEqual('Static', 'static'.controllerName());

			assert.strictEqual('News', 'news'.controllerName());
			assert.strictEqual('Users', 'user'.controllerName());
			assert.strictEqual('ContactInfos', 'contact_info'.controllerName());
		});
	});

	describe('#controllerClassName(postfix)', function() {
		it('should return the controller name representation of the string, with the Controller postfix', function() {

			assert.strictEqual('AppController', 'app'.controllerClassName());
			assert.strictEqual('StaticController', 'static'.controllerClassName());

			assert.strictEqual('NewsController', 'news'.controllerClassName());
			assert.strictEqual('NewsController', 'newsController'.controllerClassName());
			assert.strictEqual('NewsController', 'news_controller'.controllerClassName());
			assert.strictEqual('UsersController', 'user'.controllerClassName());
			assert.strictEqual('ContactInfosController', 'contact_info'.controllerClassName());
		});
	});

	describe('#camelize(lowFirstLetter)', function() {
		it('should return the camelized representation of the string', function() {
			assert.strictEqual('ThisIsATest', 'this_is_a_test'.camelize());
			assert.strictEqual('thisIsATest', 'this_is_a_test'.camelize(true));
		});
	});

	describe('#underscore()', function() {
		it('should return the underscored representation of the string', function() {
			assert.strictEqual('this_is_a_test', 'this is a test'.underscore());
		});
	});

	describe('#humanize(lowFirstLetter)', function() {
		it('should return a human readable representation of the string', function() {
			assert.strictEqual('This should be humanized', 'this should be humanized'.humanize());
			assert.strictEqual('this should be humanized', 'this should be humanized'.humanize(true));
		});
	});

	describe('#capitalize()', function() {
		it('should return the string with only the first letter being uppercased', function() {
			assert.strictEqual('This should be capitalized', 'this should be capitalized'.capitalize());
		});
	});

	describe('#dasherize()', function() {
		it('should return underscores and spaces with strings', function() {
			assert.strictEqual('dash-erize-this', 'dash_erize this'.dasherize());
		});
	});

	describe('#titleize()', function() {
		it('should return the titleized representation of the string', function() {
			assert.strictEqual('This Is a Title', 'this is a title'.titleize());
		});
	});

	describe('#demodulize()', function() {
		it('should remove module names leaving only class names', function() {
			assert.strictEqual('Properties', "Message::Bus::Properties".demodulize());
		});
	});

	describe('#tableize()', function() {
		it('should return the underscored plural form of the string', function() {
			assert.strictEqual('my_users', 'MyUser'.tableize());
			assert.strictEqual('users', 'user'.tableize());
		});
	});

	describe('#tableize()', function() {
		it('should return strings into their camel cased singular form', function() {
			assert.strictEqual('User', 'users'.classify());
		});
	});

	describe('#foreign_key()', function() {
		it('should turn a strings into an underscored foreign key', function() {
			assert.strictEqual('user_id', 'user'.foreign_key());
		});
	});

	describe('#ordinalize()', function() {
		it('should renders all found numbers their sequence', function() {
			assert.strictEqual('the 1st pitch', 'the 1 pitch'.ordinalize());
			assert.strictEqual('the 2nd pitch', 'the 2 pitch'.ordinalize());
		});
	});


});