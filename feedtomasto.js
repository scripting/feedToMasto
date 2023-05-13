const myVersion = "0.6.1", myProductName = "feedToMasto"; 

const fs = require ("fs");
const request = require ("request");
const websocket = require ("websocket").w3cwebsocket;
const utils = require ("daveutils");
const reallysimple = require ("reallysimple");

var config = {
	enabled: true,
	feeds: [
		"http://data.feedland.org/feeds/davewiner.xml"
		],
	masto: {
		enabled: false, //5/12/23 by DW
		appName: "feedToMasto",
		urlMastodonServer: undefined,
		access_token: undefined,
		created_at: undefined,
		scope: "write:statuses read:accounts",
		token_type: "Bearer",
		maxCtChars: 500,
		flServerSupportsMarkdown: false
		},
	bluesky: { //5/12/23 by DW
		enabled: false, 
		urlsite: undefined,
		username: undefined,
		password: undefined,
		maxCtChars: 300,
		flServerSupportsMarkdown: false
		},
	dataFolder: "data/",
	ctSecsBetwChecks: 60,
	maxCtChars: 500,
	flOnlyPostNewItems: true, //if false when we start up we'll post all the items in the feed
	maxGuids: 2500, //we don't store the guids forever, after we have this number of guids, we start deleting the oldest ones
	disclaimer: "*This is a test. This came out of the archive of my blog. None of this happened today or yesterday. Still diggin!*",
	urlSocketServer: "wss://feedland.org/" //4/18/23 by DW 
	};
const fnameConfig = "config.json";

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
	if (paramtable === undefined) {
		return ("");
		}
	else {
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
	}
function saveItemForDebugging (item) {
	const f = "data/items/" + utils.random (1000, 9999) + ".json";
	utils.sureFilePath (f, function () {
		fs.writeFile (f, utils.jsonStringify (item), function (err) {
			if (err) {
				console.log (err.message);
				}
			});
		});
	}
function getDebuggingItem (num, callback) {
	const f = "data/items/" + num + ".json";
	fs.readFile (f, function (err, jsontext) {
		if (err) {
			callback (err);
			}
		else {
			callback (undefined, JSON.parse (jsontext));
			}
		});
	}
function getStatusText (item, maxCtChars=config.maxCtChars) { //5/12/23 by DW
	var statustext = "";
	function add (s) {
		statustext += s;
		}
	function addText (desc) {
		desc = utils.trimWhitespace (utils.stripMarkup (desc));
		if (desc.length > 0) {
			const maxcount = maxCtChars - (statustext.length + desc.length + 2); //the 2 is for the two newlines after the description
			desc = utils.maxStringLength (desc, maxcount, false, true) + "\n\n";
			add (desc);
			}
		}
	function notEmpty (s) {
		if (s === undefined) {
			return (false);
			}
		if (s.length == 0) {
			return (false);
			}
		return (true);
		}
	if (notEmpty (item.title)) {
		addText (item.title);
		}
	else {
		addText (item.description);
		}
	if (notEmpty (item.link)) {
		add (item.link);
		}
	return (statustext);
	}

//mastodon
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
			followAllRedirects: true, //12/3/22 by DW
			maxRedirects: 5,
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
	function mastopost (path, params, callback) {
		const theRequest = {
			url: config.masto.urlMastodonServer + path,
			method: "POST",
			followAllRedirects: true, //12/3/22 by DW
			maxRedirects: 5,
			headers: {
				"Authorization": "Bearer " + config.masto.accessToken,
				"Content-Type": "application/x-www-form-urlencoded"
				},
			body: buildParamList (params)
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
		mastopost ("api/v1/statuses", params, callback);
		}
	function mastoPostNewItem (item) {
		if (utils.getBoolean (config.masto.enabled)) {
			const statustext = getStatusText (item, config.masto.maxCtChars); //5/12/23 by DW
			tootStatus (statustext, undefined, function (err, data) {
				if (err) {
					console.log (err.message);
					}
				else {
					console.log (new Date ().toLocaleTimeString () + ": " + data.url);
					}
				});
			}
		}
//bluesky
	function blueskyGetAccessToken (options, callback) {
		const url = options.urlsite + "xrpc/com.atproto.server.createSession";
		const bodystruct = {
			identifier: options.mailaddress,
			password: options.password
			};
		var theRequest = {
			method: "POST",
			url: url,
			body: utils.jsonStringify (bodystruct),
			headers: {
				"User-Agent": options.userAgent,
				"Content-Type": "application/json"
				}
			};
		request (theRequest, function (err, response, body) { 
			var jstruct = undefined;
			if (err) {
				callback (err);
				}
			else {
				try {
					callback (undefined, JSON.parse (body));
					}
				catch (err) {
					callback (err);
					}
				}
			});
		}
	function blueskyNewPost (options, authorization, item, callback) {
		const url = options.urlsite + "xrpc/com.atproto.repo.createRecord";
		const nowstring = new Date ().toISOString ();
		
		function notEmpty (s) {
			if (s === undefined) {
				return (false);
				}
			if (s.length == 0) {
				return (false);
				}
			return (true);
			}
		function decodeForBluesky (s) {
			var replacetable = {
				"#39": "'"
				};
			s = utils.multipleReplaceAll (s, replacetable, true, "&", ";");
			return (s);
			}
		function getStatusText (item) { //special for bluesky, just get the text, no link
			var statustext = "";
			function add (s) {
				statustext += s;
				}
			function addText (desc) {
				desc = decodeForBluesky (desc); 
				desc = utils.trimWhitespace (utils.stripMarkup (desc));
				if (desc.length > 0) {
					const maxcount = config.bluesky.maxCtChars - (statustext.length + desc.length + 2); //the 2 is for the two newlines after the description
					desc = utils.maxStringLength (desc, maxcount, false, true) + "\n\n";
					add (desc);
					}
				}
			if (notEmpty (item.title)) {
				addText (item.title);
				}
			else {
				addText (item.description);
				}
			return (statustext);
			}
		function getRecord (item) {
			var theRecord = {
				text: getStatusText (item),
				createdAt: nowstring
				}
			if (notEmpty (item.link)) {
				const linkword = utils.getDomainFromUrl (item.link);
				theRecord.text += linkword;
				theRecord.facets = [
					{
						features: [
							{
								uri: item.link,
								"$type": "app.bsky.richtext.facet#link"
								}
							],
						index: {
							byteStart: theRecord.text.length - linkword.length,
							byteEnd: theRecord.text.length
							}
						}
					];
				}
			console.log ("bluesky/getRecord: theRecord == " + utils.jsonStringify (theRecord));
			return (theRecord);
			}
		
		const bodystruct = {
			repo: authorization.did,
			collection: "app.bsky.feed.post",
			validate: true,
			record: getRecord (item)
			};
		var theRequest = {
			method: "POST",
			url: url,
			body: utils.jsonStringify (bodystruct),
			headers: {
				"User-Agent": options.userAgent,
				"Content-Type": "application/json",
				Authorization: "Bearer " + authorization.accessJwt
				}
			};
		request (theRequest, function (err, response, body) { 
			if (err) {
				callback (err);
				}
			else {
				try {
					callback (undefined, JSON.parse (body));
					}
				catch (err) {
					callback (err);
					}
				}
			});
		}
	function blueskyPostNewItem (item) {
		if (utils.getBoolean (config.bluesky.enabled)) {
			blueskyGetAccessToken (config.bluesky, function (err, authorization) {
				if (err) {
					console.log ("blueskyPostNewItem: err.message == " + err.message);
					}
				else {
					blueskyNewPost (config.bluesky, authorization, item, function (err, data) {
						if (err) {
							console.log ("blueskyPostNewItem: err.message == " + err.message);
							}
						else {
							}
						});
					}
				});
			}
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
							mastoPostNewItem (item);
							blueskyPostNewItem (item); //5/12/23 by DW
							saveItemForDebugging (item);  //5/12/23 by DW
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
function checkFeeds () {
	if (config.enabled) { //5/12/23 by DW
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

function startSocket () { //4/18/23 by DW
	function wsConnectUserToServer (itemReceivedCallback) {
		var mySocket = undefined;
		function checkConnection () {
			if (mySocket === undefined) {
				mySocket = new websocket (config.urlSocketServer); 
				mySocket.onopen = function (evt) {
					};
				mySocket.onmessage = function (evt) {
					function getPayload (jsontext) {
						var thePayload = undefined;
						try {
							thePayload = JSON.parse (jsontext);
							}
						catch (err) {
							}
						return (thePayload);
						}
					if (evt.data !== undefined) { //no error
						var theCommand = utils.stringNthField (evt.data, "\r", 1);
						var jsontext = utils.stringDelete (evt.data, 1, theCommand.length + 1);
						var thePayload = getPayload (jsontext);
						switch (theCommand) {
							case "newItem": 
								itemReceivedCallback (thePayload);
								break;
							}
						}
					};
				mySocket.onclose = function (evt) {
					mySocket = undefined;
					};
				mySocket.onerror = function (evt) {
					};
				}
			}
		setInterval (checkConnection, 1000);
		}
	wsConnectUserToServer (function (thePayload) {
		config.feeds.forEach (function (feedUrl) {
			if (feedUrl == thePayload.theFeed.feedUrl) {
				console.log (new Date ().toLocaleTimeString () + ": title == " + thePayload.theFeed.title + ", feedUrl == " + thePayload.theFeed.feedUrl);
				checkFeed (feedUrl, function (err, data) {
					if (err) {
						console.log ("startSocket: feedUrl == " +feedUrl + ", err.message == " + err.message);
						}
					});
				}
			});
		});
	}

function everyMinute () {
	if (utils.secondsSince (whenLastCheck) > config.ctSecsBetwChecks) { //check feeds at most once a minute
		checkFeeds ();
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

function testGetStatusText () {
	const theNum = "8313";
	getDebuggingItem (theNum, function (err, item) {
		if (err) {
			console.log (err.message);
			}
		else {
			console.log ("testGetStatusText: item == " + utils.jsonStringify (item));
			console.log ("testGetStatusText: statustext == " + getStatusText (item));
			}
		});
	}
function testBlueskyPost () {
	const theNum = "8313";
	getDebuggingItem (theNum, function (err, item) {
		if (err) {
			console.log (err.message);
			}
		else {
			console.log ("testBlueskyPost: item == " + utils.jsonStringify (item));
			blueskyPostNewItem (item); 
			}
		});
	}


function startup () {
	console.log ("startup");
	readConfig (fnameStats, stats, function () {
		readConfig (fnameConfig, config, function () {
			console.log ("config == " + utils.jsonStringify (config));
			checkFeeds (); //check at startup
			utils.runEveryMinute (everyMinute);
			setInterval (everySecond, 1000);
			startSocket (); //4/18/23 by DW
			});
		});
	}
startup ();

