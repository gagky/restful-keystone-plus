
console.log('Using restful-keystone-plus');

var plugins = require('./lib/plugins');
plugins.register();

module.exports = require( './lib/restful' );
