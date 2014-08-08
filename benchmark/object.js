var Blast  = require('../index.js')();

suite('Object', function() {

	var obj = {one: 1, test: {me: 1}, three: 3},
	    arr = [1,2,3, {test: 1}, {again: 2}];

	var data = [
	{Wallpaper: {
		_id: '53e1f860f69108144795bfbe',
		created: 'Wed Aug 06 2014 11:41:52 GMT+0200 (CEST)',
		image_id: '53e1f85df69108144795bfbd',
		name: 'Sunrise',
		updated: 'Wed Aug 06 2014 11:41:52 GMT+0200 (CEST)' } },
	{Wallpaper: {
		_id: '53e1f853f69108144795bfb9',
		created: 'Wed Aug 06 2014 11:41:39 GMT+0200 (CEST)',
		image_id: '53e1f84ef69108144795bfb8',
		name: 'Strangers in a field',
		updated: 'Wed Aug 06 2014 11:41:39 GMT+0200 (CEST)' } },
	{Wallpaper: {
		_id: '53e0d990fd3e321940566fa9',
		created: 'Tue Aug 05 2014 15:18:08 GMT+0200 (CEST)',
		image_id: '53e0dab94b89e4be452f8321',
		name: 'Clouds',
		updated: 'Tue Aug 05 2014 15:26:52 GMT+0200 (CEST)' } }];

	bench('#toSource()', function() {
		obj.toSource();
	});

	bench('.isObject(obj)', function() {
		Object.isObject(obj);
	});

	bench('.isPlainObject(obj)', function() {
		Object.isPlainObject(obj);
	});

	bench('.isPrimitiveObject(obj)', function() {
		Object.isPrimitiveObject(obj);
	});

	bench('.flatten(obj)', function() {
		Object.flatten(obj);
	});

	bench('.divide(obj)', function() {
		Object.divide(obj);
	});

	bench('.dissect(obj)', function() {
		Object.dissect(obj);
	});

	bench('.path(obj, path)', function() {
		Object.path(obj, 'one.me');
	});

	bench('.exists(obj, path)', function() {
		Object.exists(obj, 'one.me');
	});

	bench('.isEmpty(obj)', function() {
		Object.isEmpty(obj);
	});

	bench('.values(obj)', function() {
		Object.values(obj);
	});

	bench('.assign(target, obj)', function() {
		Object.assign({}, obj);
	});

	bench('.objectify(arr)', function() {
		Object.objectify(arr);
	});

	bench('.getValueKey(target, value)', function() {
		Object.getValueKey(obj, 3);
	});

	bench('.extract(data, "$..Wallpaper.name")', function() {
		Object.extract(data, "$..Wallpaper.name");
	});

	bench('.hasProperty(target, property)', function() {
		Object.hasProperty(obj, 'test');
	});

	bench('.hasProperty(target, property) (non existing test)', function() {
		Object.hasProperty(obj, 'not there!');
	});

	bench('.hasValue(target, property)', function() {
		Object.hasProperty(obj, 3);
	});
});