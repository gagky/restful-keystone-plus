"use strict";

var debug = require( "debug" )( "restful-keystone" );
var _ = require( "lodash" );
var deepMerge = require( "deepmerge" );
var errors = require( "errors" );
var retrieve = require( "./retrieve" );
var utils = require( "../utils" );
var handleResult = utils.handleResult;
var getId = utils.getId;

module.exports = function( list,
                           config,
                           entry ){
  config = _.defaults( {
    name : list.path
  }, config );
  return {
    handle : function( req,
                       res,
                       next ){
      debug( "LIST", config.name );
      var id = getId( req );
      if( id ){
        return retrieve( list, config, entry ).handle( req, res, next );
      }
      var filter = req.query[ "filter" ] || req.body[ "filter" ];
      if( _.isString( filter ) ){
        try{
          filter = JSON.parse( filter );
        } catch( err ) {
          return next( new errors.Http400Error( {
            explanation : "Invalid JSON in query string parameter 'filter'"
          } ) );
        }
      }
      var filter_func_ret = {};
      if( _.isFunction( config.filter ) ){
        filter_func_ret = config.filter(req);
      }
      filter = deepMerge( filter_func_ret, filter || {} );
      var config_ret = _.cloneDeep(config);
      config_ret.sort = _.isFunction(config.sort) ? config.sort(req) : config.sort;
      config_ret.limit = _.isFunction(config.limit) ? config.limit(req) : config.limit;
      config_ret.skip = _.isFunction(config.skip) ? config.skip(req) : config.skip;
      config_ret.populate = _.isFunction(config.populate) ? config.populate(req) : config.populate;
      list.model.find( filter, config.show, config_ret )
        .exec()
        .then( function( result ){
          result = handleResult( result || [], config );
          res.locals.body = result;
          res.locals.status = 200;
          next();
        } )
        .then( null, function( err ){
          next( err );
        } );
    },
    verb   : "get",
    url    : entry
  };
};
