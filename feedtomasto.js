const myVersion = "0.4.0", myProductName = "feedToMasto"; 

const fs = require ("fs");
const utils = require ("daveutils");
const request = require ("request");
const reallysimple = require ("reallysimple");

var config = {
	enabled: true,
	feeds: [
		"http://scripting.com/rss.xml",
		"http://data.feedland.org/feeds/davewiner.xml"
		],
	masto: {
		appName: "feedToMasto",
		urlMastodonServer: undefined,
		access_token: undefined,
		created_at: undefined,
		scope: "write:statuses read:accounts",
		token_type: "Bearer"
		},
	dataFolder: "data/",
	ctSecsBetwChecks: 60,
	maxCtChars: 500,
	flOnlyPostNewItems: true, //if false when we start up we'll post all the items in the feed
	maxGuids: 2500, //we don't store the guids forever, after we have this number of guids, we start deleting the oldest ones
	flServerSupportsMarkdown: true, //we're optimistic! ;-)
	disclaimer: "*This is a test. This came out of the archive of my blog. None of this happened today or yesterday. Still diggin!*"
	};

var stats = {
	guids: new Object ()
	};
const fnameStats = "stats.json";
var flStatsChanged = false;
var whenLastCheck = new Date (0);

function statsChanged () {
	flStatsChanged = true;
	}
function deleteOldGuids () {
	function countGuids () {
		var ct = 0;
		for (var x in stats.guids) {
			ct++
			}
		return (ct);
		}
	function deleteOldestGuid () {
		var oldestWhen = new Date (), oldestx;
		function dateLessThan (d1, d2) {
			return (new Date (d1) < new Date (d2));
			}
		for (var x in stats.guids) {
			var theGuid = stats.guids [x];
			if (dateLessThan (theGuid.when, oldestWhen)) {
				oldestWhen = theGuid.when;
				oldestx = x;
				}
			}
		if (oldestx !== undefined) {
			delete stats.guids [oldestx];
			statsChanged ();
			}
		}
	var ct = countGuids () - config.maxGuids;
	if (ct > 0) {
		console.log ("deleteOldGuids: ct == " + ct);
		for (var i = 1; i <= ct; i++) {
			deleteOldestGuid ();
			}
		}
	}
function isNewFeed (feedUrl) {
	var flnew = true;
	for (var x in stats.guids) {
		if (stats.guids [x].feedUrl == feedUrl) {
			flnew = false;
			break;
			}
		}
	return (flnew);
	}
function buildParamList (paramtable) { //8/4/21 by DW
	var s = "";
	for (var x in paramtable) {
		if (paramtable [x] !== undefined) { //8/4/21 by DW
			if (s.length > 0) {
				s += "&";
				}
			s += x + "=" + encodeURIComponent (paramtable [x]);
			}
		}
	return (s);
	}
function mastocall (path, params, callback) {
	var headers = undefined;
	if (config.masto.accessToken !== undefined) {
		headers = {
			Authorization: "Bearer " + config.masto.accessToken
			};
		}
	const theRequest = {
		url: config.masto.urlMastodonServer + path + "?" + buildParamList (params),
		method: "GET",
		headers,
		};
	request (theRequest, function (err, response, jsontext) {
		function sendBackError (defaultMessage) {
			var flcalledback = false;
			if (data !== undefined) {
				try {
					jstruct = JSON.parse (data);
					if (jstruct.error !== undefined) {
						callback ({message: jstruct.error});
						flcalledback = true;
						}
					}
				catch (err) {
					}
				}
				
			if (!flcalledback) {
				callback ({message: defaultMessage});
				}
			}
		if (err) {
			sendBackError (err.message);
			}
		else {
			var code = response.statusCode;
			if ((code < 200) || (code > 299)) {
				const message = "The request returned a status code of " + response.statusCode + ".";
				sendBackError (message);
				}
			else {
				try {
					callback (undefined, JSON.parse (jsontext))
					}
				catch (err) {
					callback (err);
					}
				}
			}
		});
	}
function mastopost (path, params, filedata, callback) {
	const theRequest = {
		url: config.masto.urlMastodonServer + path + "?" + buildParamList (params),
		method: "POST",
		headers: {
			Authorization: "Bearer " + config.masto.accessToken
			},
		body: filedata
		};
	request (theRequest, function (err, response, jsontext) {
		if (err) {
			console.log ("mastopost: err.message == " + err.message);
			callback (err);
			}
		else {
			var code = response.statusCode;
			if ((code < 200) || (code > 299)) {
				const message = "The request returned a status code of " + response.statusCode + ".";
				callback ({message});
				}
			else {
				try {
					callback (undefined, JSON.parse (jsontext))
					}
				catch (err) {
					callback (err);
					}
				}
			}
		});
	}
function getUserInfo (callback) {
	mastocall ("api/v1/accounts/verify_credentials", undefined, callback);
	}
function tootStatus (statusText, inReplyTo, callback) {
	const params = {
		status: statusText,
		in_reply_to_id: inReplyTo
		};
	mastopost ("api/v1/statuses", params, undefined, callback);
	}
function postNewItem (item, feedUrl) {
	var statustext = "";
	function add (s) {
		statustext += s + "\n";
		}
	
	add (config.disclaimer + "\n");
	
	var link = "";
	if (item.link !== undefined) {
		link = item.link;
		}
	if (item.title !== undefined) {
		add ("# " + item.title + "\n");
		}
	else {
		function addDescription (desc) {
			add (utils.maxStringLength (desc, config.maxCtChars - statustext.length - link.length - 5, false, true));
			add ("");
			}
		if (config.flServerSupportsMarkdown) {
			if ((item.description !== undefined) || (item.markdown !== undefined)) {
				var desc = (item.markdown === undefined) ? item.description : item.markdown;
				addDescription (desc);
				}
			}
		else {
			addDescription (item.description);
			}
		}
	if (link.length > 0) {
		add ("");
		add (link);
		}
	
	tootStatus (statustext, undefined, function (err, data) {
		if (err) {
			console.log (err.message);
			}
		else {
			console.log (new Date ().toLocaleTimeString () + ": " + data.url);
			}
		});
	}
function checkFeed (feedUrl, callback) {
	const flNewFeed = isNewFeed (feedUrl);
	var flPost = (flNewFeed && config.flOnlyPostNewItems) ? false : true;
	
	reallysimple.readFeed (feedUrl, function (err, theFeed) {
		if (err) {
			callback (err);
			}
		else {
			theFeed.items.forEach (function (item) {
				if (item.guid !== undefined) { //we ignore items without guids
					var flfound = false;
					for (var x in stats.guids) {
						if (x == item.guid) {
							flfound = true;
							break;
							}
						}
					if (!flfound) {
						stats.guids [item.guid] = {
							when: new Date (),
							feedUrl
							};
						statsChanged ();
						if (flPost) {
							postNewItem (item, feedUrl, flNewFeed);
							}
						}
					}
				});
			}
		});
	}
function writeStats () {
	fs.writeFile (fnameStats, utils.jsonStringify (stats), function (err) {
		});
	}
function everyMinute () {
	if (config.enabled) { //check feeds at most once a minute
		if (utils.secondsSince (whenLastCheck) > config.ctSecsBetwChecks) {
			whenLastCheck = new Date ();
			config.feeds.forEach (function (feedUrl) {
				checkFeed (feedUrl, function (err, data) {
					if (err) {
						console.log ("everySecond: feedUrl == " +feedUrl + ", err.message == " + err.message);
						}
					});
				});
			}
		}
	deleteOldGuids ();
	}
function everySecond () {
	if (flStatsChanged) {
		flStatsChanged = false;
		writeStats ();
		}
	}

function readConfig (fname, data, callback) {
	fs.readFile (fname, function (err, jsontext) {
		if (!err) {
			var jstruct;
			try {
				jstruct = JSON.parse (jsontext);
				for (var x in jstruct) {
					data [x] = jstruct [x];
					}
				}
			catch (err) {
				console.log ("readConfig: fname == " + fname + ", err.message == " + utils.jsonStringify (err.message));
				}
			}
		callback ();
		});
	}
readConfig (fnameStats, stats, function () {
	readConfig ("config.json", config, function () {
		
		
		
		console.log ("config == " + utils.jsonStringify (config));
		utils.runEveryMinute (everyMinute);
		setInterval (everySecond, 1000);
		});
	});
