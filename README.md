# feedToMasto

A Node app that checks a list of feeds periodically, posting new items to Mastodon and/or Bluesky.

### Bluesky support added

Where ever you see "Mastodon" in the docs here, replace it in your mind with "Mastodon and/or Bluesky."

I've started a separate page for how to configure this app to post to Bluesky as well.

### Why did you do this?

These are things I believe, or goals I have.

* The network of RSS publishers and readers should be part of the Fediverse. feedToMasto enables the flow of RSS content into the Fediverse via Mastodon.

* To provide good simple working code for the Mastodon API. I had to do too much work to figure out how to get what amounts to a Hello World script up and running. Now you don't have to do all that work. 

* You should be able to build feed-based utilities without giving any thought to reading feeds. Reading a feed should be as easy as reading a JSON file. This app illustrates how that works, using the <a href="https://github.com/scripting/reallysimple">reallySimple package</a>. 

* I want to get some code out there into the Mastoverse, to start building a rep in the community. 

### Requirements

* You will need an account on a Mastodon server. 

* You will need a place to run a Node.js app. It can run behind a firewall, it does not have to run on a public-facing machine. 

* You will need one or more feeds, they could be RSS, Atom or RDF. 

* The feeds must have guids. This app depends on the guids being unique. 

* To get started <a href="https://github.com/scripting/feedToMasto/archive/refs/heads/main.zip">download</a> the feedToMasto folder. 

### config.json

Setting up the feedToMasto app is all done in <a href="https://github.com/scripting/feedToMasto/blob/main/config.json">config.json</a>. Open it in a text editor.

### On your Mastodon account

Click on <i>Preferences,</i> in the right margin.

Click on <i>Development</i> in the left margin.

Click on the <i>New application</i> button in the upper right corner. 

You should see a form that <a href="http://scripting.com/images/2022/12/01/newApplicationScreen.png">looks like this</a>. We're going to fill in the form. 

* Application name -- anything you like, perhaps feedToMasto.

* Application website -- anything you like.

* Redirect URI -- leave it as-is.

In the <i>Scopes</i> section do the following.

* Uncheck read.

* Check read:accounts.

* Uncheck write.

* Check write:statuses.

* Uncheck follow.

When you're done the Scopes section should <a href="http://scripting.com/images/2022/12/01/checkboxesScreen.png">look like this</a>. 

Finally click the Submit button at the bottom of the page. 

You should then see a list of your applications, with this new app on the list.

Click on the name of the new app to bring up a screen with various numeric strings you'll add to config.json in the next section.

### Back in config.json

Open config.json in an editor. <a href="http://scripting.com/images/2022/12/01/configJsonScreen.png">This</a> is what you should see. 

On the screen in your browser you should see various numeric strings that you are going to copy into config.json.

Copy the three items, <i>Client key,</i> <i>Client secret</i> and <i>Your access token</i> from the browser to the xxx's in config.json as shown in this <a href="http://scripting.com/images/2022/12/01/copyFromWebToConfig.png">screen shot</a>. 

Enter the URL of your Mastodon server in <i>urlMastodonServer</i> in config.json.

### Screen shot

<img src="http://scripting.com/images/2022/12/01/arrowsOnMasto.png">

### Using with Bluesky

In config.json, at the top level, create a new object called bluesky.

Set it up as shown in the example file. Basically you're providing the same info you provide when you log in personally, your username, email address and password. 

Why Bluesky? I wanted to start fanning out to support social networks other than Mastodon. I was using Bluesky and had some good <a href="https://www.manton.org/2023/04/29/getting-started-with.html">developer docs</a> from my friend Manton Reece, so I decided the second platform would be Bluesky. This is not an endorsement of Bluesky. 

### What the other items in config.json are for

The other values in config.json have default values that work well for a first run of the app. The only ones you should come back before running it for real are <i>feeds</i> and <i>disclaimer. </i>

* enabled -- if you set it false and reboot the app it will do everything but check the feeds. 

* feeds -- an array of feed URLs. I've included two feeds to get you started. You should change them to your feed addresses of course. 

* ctSecsBetwChecks -- the amount of time between feed checks. We only check every minute at the top of the minute. Default value is 60.

* maxCtChars -- the number of characters in a toot. Maybe you have a higher number on your server?

* flOnlyPostNewItems -- If false, the first time we read a feed we'll dump all the items into the Mastodon account. Probably not what you had in mind, that's why it defaults to true. 

* maxGuids -- we use the guids in feed items to determine if we've already pushed the item to Mastodon. At some point we no longer need to keep it around because it's no longer in the feed, but we never know for sure what that is. It depends on how many feeds you have and how big they tend to get. The default of 2500 seemed a good balance between performance and the risk of posting items twice.

* flServerSupportsMarkdown -- if it does, we'll look for source:markdown elements in the feed item and transmit that in place of the description element.

* disclaimer -- text that appears at the begining of every toot. If you don't want it, make it the empty string.

### Notes

<a href="http://scripting.com/2020/05/26/194558.html?title=bugReportsNotPullRequests">Bug reports, not pull requests</a>. 

Comments, questions, feature requests, bug reports <a href="https://github.com/scripting/feedToMasto/issues">here</a>. 

