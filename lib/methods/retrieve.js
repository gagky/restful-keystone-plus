"use strict";

var debug = require( "debug" )( "restful-keystone" );
var errors = require( "errors" );
var _ = require( "lodash" );
var u = require( "underscore" );
var utils = require( "../utils" );
var getId = utils.getId;
var handleResult = utils.handleResult;

module.exports = function( list,
                           config,
                           entry ){
  config = _.defaults( {
    name : list.singular.toLowerCase()
  }, config );
  return {
    handle : function( req,
                       res,
                       next ){
      var id = getId( req );
      debug( "RETRIEVE", config.name, id );
      var query = u.getSlugQuery(id, list);
      var q = list.model
    	.findOne(query, config.show, config.options);
      if( config.populate ){
        q = q.populate( config.populate );
      }
      if( config.deepPopulate ){
        q = q.deepPopulate( config.deepPopulate );
      }
      q.exec()
        .then( function( result ){
          if( !result ){
            if (res.resultError){
              res.resultError(
                null, 
                "Resource not found with id " + id,
                404);
            }else{
              throw new errors.Http404Error( {
                explanation : "Resource not found with id " + id
              } );
            }
          }
          result = handleResult( result, config );
          res.locals.body = result;
          res.locals.status = 200;
          next();
        } )
        .then( null, function( err ){
          next( err );
        } );
    },
    verb   : "get",
    url    : entry + "/:id"
  };
};
