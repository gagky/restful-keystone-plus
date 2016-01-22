var _ = require('underscore');
    
exports.register = function(){
    _.mixin({
        getSchemaIndex: function(listing){
    		var indexes = [];
    		_.mapObject(listing.schema.tree, function(value, key){
    			if (value.index && !value.ref)
    				indexes.push(key);
    		});
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