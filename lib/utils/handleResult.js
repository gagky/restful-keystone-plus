"use strict";
var debug = require( "debug" )( "restful-keystone" );
var _ = require( "lodash" );
module.exports = function( result,
                           config ){
  if( config.envelop ){
    var temp = {};
    temp[ _.template( config.envelop )( config ) ] = result;
    result = temp;
  }
  return result;
};
