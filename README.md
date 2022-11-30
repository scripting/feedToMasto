# feedToMasto

A Node app that checks a list of feeds periodically, posting new items to Mastodon.

### config.json

There's an example <a href="https://github.com/scripting/feedToMasto/blob/main/config.json">config.json</a> file, in the following sections we explain how to set it up. 

### Create a new app on your Mastodon server.

Go to preferences, then Development. You'll see a possibly empty list of applications. Click the <i>New application</i> button. A form appears. Fill it out as follows:

* Application name: feedToMasto

* Application website: (anything you like)

* Redirect URI: leave it as is.

* Scopes: Uncheck read. Check read:accounts. Uncheck write. Check write:statuses. Uncheck follow.

* Click Submit.

### Copy info from the application page into config.jsone

It should say <i>Application successfully created.</i>

You are taken back to the list, which now has a new item -- feedToMasto. Click on it. 

Copy the info on this page into the config.json file. 

* appName, scopes -- already filled out.

* clientKey, clientSecret, accessToken -- copy from form, replacing placeholder values.

* urlMastodonServer -- the url of the server you're using as you created this application.

### Other values in config.json, the defaults and what they mean

```

"feeds": [url1, url2, url3, etc], //the urls of the feeds you want to check. I included a couple you can test with

"ctSecsBetwChecks": 60, //it checks at most once a minute for updates to the feeds

"maxCtChars": 500, //the max length of a toot. if your server can handle more than 500 chars, you can increase this

"flOnlyPostNewItems": true, //the first time the app runs we won't post all the items in the feeds, or when you add a new feed

"maxGuids": 2500, //we don't need to remember the guids forever -- 2500 seems like a good number

"flServerSupportsMarkdown": true, //we're optimistic

"disclaimer": "*This is a test. Still diggin!*" //this will appear at the beginning of every toot

```

