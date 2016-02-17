'use strict';
var debug = require( "debug" )('rkp:debug');
var _ = require( "lodash" );
var deepMerge = require( "deepmerge" );
var constants = require( "./constants" );

var utils = require( "./utils" );

var beforeHandlers = {};
var afterHandlers = {};
var exposed = {};
var async = require('async');

module.exports = function( keystone,
                           config ){
  config = _.defaults( {}, config, {
    root : "/api"
  } );

  var instance = {};

  instance.before = function( methods,
                              beforeConfig ){
    debug('before');
    beforeHandlers = deepMerge( beforeHandlers, utils.parseMiddlewareConfig( methods, beforeConfig ) );
    return instance;
  };

  instance.expose = function( exposureConfig ){
    debug('expose');
    exposed = deepMerge( exposed, utils.exposeLists( keystone, {
      root      : config.root,
      resources : exposureConfig || {}
    } ) );
    return instance;
  };

  instance.after = function( methods,
                             afterConfig ){
    debug('after');
    afterHandlers = deepMerge( afterHandlers, utils.parseMiddlewareConfig( methods, afterConfig ) );
    return instance;
  };

  instance.start = function(){
    _.each( exposed, function( listConfig,
                               listName ){
      _.each( listConfig, function( methodConfig,
                                    methodName ){
        var handlers;
        if( beforeHandlers[ listName ] && beforeHandlers[ listName ][ methodName ] ){
          handlers = beforeHandlers[ listName ][ methodName ];
        } else {
          handlers = [];
        }
        handlers = handlers.concat( methodConfig.handle );
        if( afterHandlers[ listName ] && afterHandlers[ listName ][ methodName ] ){
          handlers = handlers.concat( afterHandlers[ listName ][ methodName ] );
        } else {
          handlers = handlers.concat( function( req,
                                                res,
                                                next ){
            return res.status( res.locals.status ).send( res.locals.body );
          } );
        }

        keystone.app[ methodConfig.verb ]( methodConfig.url, handlers );
      } );
    } );
  };
  
  instance.exec = function(listName, methodName, req, res, success, failed){
    var listConfig = exposed[listName];
    var methodConfig = listConfig[methodName];
    var handlers;
    if( beforeHandlers[ listName ] && beforeHandlers[ listName ][ methodName ] ){
      handlers = beforeHandlers[ listName ][ methodName ];
    } else {
      handlers = [];
    }
    handlers = handlers.concat( methodConfig.handle );
    if( afterHandlers[ listName ] && afterHandlers[ listName ][ methodName ] ){
      handlers = handlers.concat( afterHandlers[ listName ][ methodName ] );
    } 
    debug(listName + " " + methodName + " handlers:" + handlers.length);
    var fres = {
      locals: {
        body: {
        }
      },
      getLocale: function(){
  			return res.getLocale();
  		},
  		resultError: function(err){
  		  if (err) console.log(err);
  		  if (failed) failed(err);
  		},
  		status: function(code){
  			return this;
  		},
  		send: function(body){
  			if (success) success(body);
  		}
    }
    async.eachSeries(handlers, function(handler, cb){
      handler(req, fres, cb);
    });
  }

  return instance;
};
