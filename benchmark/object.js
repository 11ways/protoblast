var Blast  = require('../index.js')();

suite('Object', function() {

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

	bench('.extract(data, "$..Wallpaper.name")', function() {
		Object.extract(data, "$..Wallpaper.name");
	});
});