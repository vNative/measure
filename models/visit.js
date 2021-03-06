var mongoose = require('mongoose');
var Schema = mongoose.Schema,
	geoip = require('geoip-lite');

// create a schema
var visitSchema = new Schema({
  uid: Schema.Types.ObjectId,
  item: Schema.Types.ObjectId,
  hits: { type: Number, default: 0 },
  referer: String,
  country: String,
  medium: String,
  source: String,
  campaign: String
}, { collection: 'visits' });

var getClientIP = function (req) {
    var ip = req.headers['x-forwarded-for'] ||
        req.headers['cf-connecting-ip'];

    ip = ip.split(",")[0];
    return ip;
}

var findCountry = function (opts) {
    var req = opts.req,
        lookup,
        ip, country = "IN";

    return req.headers['cf-ipcountry'] || country;

    /*ip = getClientIP(req);
    lookup = opts.geoip.lookup(ip);
    if (lookup) {
        country = lookup.country;
    }
    return country;*/
};

visitSchema.statics.process = function (opts, cb) {
	var self = this,
		obj = {
			uid: opts.user._id,
			item: opts.item._id,
			medium: opts.medium,
			source: opts.source,
			campaign: opts.campaign
		};

	self.findOne(obj, function (err, visit) {
		if (err || visit) {
			return cb(err, visit);
		}

		visit = new self(obj);
		visit.referer = opts.req.headers['referer'] || '';
		visit.country = findCountry({ geoip: geoip, req: opts.req });
		visit.hits = 0;

		return cb(null, visit);
	});
};

var Visit = mongoose.model('Visit', visitSchema);
module.exports = Visit;
