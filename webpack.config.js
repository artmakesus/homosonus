var path = require('path');
var sep = path.sep;

module.exports = {
	context: __dirname,
	entry: '.' + sep + 'components' + sep + 'build' + sep + 'App.js',
	output: {
		filename: '.' + sep + 'bundle.js',
	},
	resolve: {
		moduleDirectories: 'node_modules',
	},
};
