var assert = require('assert'),
    Blast;

describe('String Inflections', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('#pluralize()', function() {
		it('should return the plural representation of the string', function() {
			assert.strictEqual('bus'.pluralize(), 'buses');
			assert.strictEqual('window'.pluralize(), 'windows');
			assert.strictEqual('octopus'.pluralize(), 'octopi');
		});
	});

	describe('#singularize()', function() {
		it('should return the singular representation of the string', function() {
			assert.strictEqual('buses'.singularize(), 'bus');
			assert.strictEqual('windows'.singularize(), 'window');
			assert.strictEqual('octopi'.singularize(), 'octopus');
		});
	});

	describe('#modelName(postfix)', function() {
		it('should return the model name representation of the string', function() {
			assert.strictEqual('news'.modelName(), 'News');
			assert.strictEqual('user'.modelName(), 'User');
			assert.strictEqual('app'.modelName(), 'App');
		});
	});

	describe('#modelClassName()', function() {
		it('should return the model name representation of the string, with the Model postfix', function() {
			assert.strictEqual('news'.modelClassName(), 'NewsModel');
			assert.strictEqual('newsModel'.modelClassName(), 'NewsModel');
			assert.strictEqual('news_model'.modelClassName(), 'NewsModel');
			assert.strictEqual('user'.modelClassName(), 'UserModel');
			assert.strictEqual('app'.modelClassName(), 'AppModel');
		});
	});

	describe('#controllerName(postfix)', function() {
		it('should return the controller name representation of the string', function() {

			assert.strictEqual('app'.controllerName(), 'App');
			assert.strictEqual('static'.controllerName(), 'Static');

			assert.strictEqual('news'.controllerName(), 'News');
			assert.strictEqual('user'.controllerName(), 'Users');
			assert.strictEqual('contact_info'.controllerName(), 'ContactInfos');
		});
	});

	describe('#controllerClassName(postfix)', function() {
		it('should return the controller name representation of the string, with the Controller postfix', function() {

			assert.strictEqual('app'.controllerClassName(), 'AppController');
			assert.strictEqual('static'.controllerClassName(), 'StaticController');

			assert.strictEqual('news'.controllerClassName(), 'NewsController');
			assert.strictEqual('newsController'.controllerClassName(), 'NewsController');
			assert.strictEqual('news_controller'.controllerClassName(), 'NewsController');
			assert.strictEqual('user'.controllerClassName(), 'UsersController');
			assert.strictEqual('contact_info'.controllerClassName(), 'ContactInfosController');
		});
	});

	describe('#camelize(lowFirstLetter)', function() {
		it('should return the camelized representation of the string', function() {
			assert.strictEqual('this_is_a_test'.camelize(), 'ThisIsATest');
			assert.strictEqual('this_is_a_test'.camelize(true), 'thisIsATest');
		});
	});

	describe('#underscore()', function() {
		it('should return the underscored representation of the string', function() {
			assert.strictEqual('this is a test'.underscore(), 'this_is_a_test');
			assert.strictEqual('the-underscored-string-method'.underscore(), 'the_underscored_string_method');
			assert.strictEqual('theUnderscoredStringMethod'.underscore(), 'the_underscored_string_method');
			assert.strictEqual('TheUnderscoredStringMethod'.underscore(), 'the_underscored_string_method');
			assert.strictEqual(' the underscored  string method'.underscore(), 'the_underscored_string_method');
			assert.strictEqual('   the underscored  string  method'.underscore(), 'the_underscored_string_method');
			assert.strictEqual('   the underscored _ string  method'.underscore(), 'the_underscored_string_method');
			assert.strictEqual(''.underscore(), '');
			assert.strictEqual('ThisIsATest'.underscore(), 'this_is_a_test');
			assert.strictEqual(' ThisIsATest'.underscore(), 'this_is_a_test');
		});
	});

	describe('#humanize(lowFirstLetter)', function() {
		it('should return a human readable representation of the string', function() {
			assert.strictEqual('this should be humanized'.humanize(), 'This should be humanized');
			assert.strictEqual('this should be humanized'.humanize(true), 'this should be humanized');
		});
	});

	describe('#capitalize()', function() {
		it('should return the string with only the first letter being uppercased', function() {
			assert.strictEqual('this should be capitalized'.capitalize(), 'This should be capitalized');
		});
	});

	describe('#dasherize()', function() {
		it('should return underscores and spaces with strings', function() {
			assert.strictEqual('dash_erize this'.dasherize(), 'dash-erize-this');
		});
	});

	describe('#titleize()', function() {
		it('should return the titleized representation of the string', function() {
			assert.strictEqual('this is a title'.titleize(), 'This Is a Title');
		});
	});

	describe('#demodulize()', function() {
		it('should remove module names leaving only class names', function() {
			assert.strictEqual("Message::Bus::Properties".demodulize(), 'Properties');
		});
	});

	describe('#tableize()', function() {
		it('should return the underscored plural form of the string', function() {
			assert.strictEqual('MyUser'.tableize(), 'my_users');
			assert.strictEqual('user'.tableize(), 'users');
		});
	});

	describe('#tableize()', function() {
		it('should return strings into their camel cased singular form', function() {
			assert.strictEqual('users'.classify(), 'User');
		});
	});

	describe('#foreign_key()', function() {
		it('should turn a strings into an underscored foreign key', function() {
			assert.strictEqual('user'.foreign_key(), 'user_id');
		});
	});

	describe('#ordinalize()', function() {
		it('should renders all found numbers their sequence', function() {
			assert.strictEqual('the 1 pitch'.ordinalize(), 'the 1st pitch');
			assert.strictEqual('the 2 pitch'.ordinalize(), 'the 2nd pitch');
		});
	});


});