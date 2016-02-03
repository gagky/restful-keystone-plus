var _ = require('underscore');
    
exports.register = function(){
    _.mixin({
        functionName: function(fun) {
            var ret = fun.toString();
            ret = ret.substr('function '.length);
            ret = ret.substr(0, ret.indexOf('('));
            return ret;
        },
        getSchemaIndex: function(listing){
    		var indexes = [];
    		listing.uiElements.forEach(function(value){
    			if (value.type == 'field'){
    			    var type = _.functionName(value.field.options.type);
    			    var index = (value.field.options.index);
    			    if (type != 'datetime' && type != 'relationship' && index)
    			        indexes.push(value.field.path);
    			}
    		})
    		console.log(indexes);
    		return indexes;
    	},
        getSlugQuery: function(id_or_slug, listing){
    		var query = {$or: []};
    		var possible_keys = _.getSchemaIndex(listing);
    		possible_keys.forEach(function(field){
				var obj = {};
				obj[field] = id_or_slug;
				query.$or.push(obj);
    		});
            if (id_or_slug.match(/^[0-9a-fA-F]{24}$/)) {
                query.$or.push({_id: id_or_slug});
            }
            return query;
        },
        findOneBySlug(listing, id_or_slug, populate, callback){
        	var query = _.getSlugQuery(id_or_slug, listing);
        	if (!callback){
        		callback = populate;
        		populate = null;
        	}
        	var q = listing.model.findOne(query);
        	if (populate)
        		q.populate(populate);
    	    q.exec(function(err,model){
    	        err = err || (_.isNull(model) ? new Error(listing.key + " not found by slug " + id_or_slug) : null);
    	        callback(err , model);
    	    })
        }
    });
}