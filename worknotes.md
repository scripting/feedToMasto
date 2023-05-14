#### 5/14/23 by DW -- v0.6.3

Reorg'd the code for bluesky and masto, to make them a single rountine that calls local routines.

Then added support for WordPress.

#### 5/13/23 by DW

When we check for <i>enabled</i> in masto table, handle case where it doesn't exist. Avoid breakage with users of previous versions.

Look for and use maxCtChars in masto or bluesky tables.

Calling this version 0.6.0 because we added support for Bluesky.

#### 5/12/23 by DW

Add Bluesky support.

added config.bluesky

added config.masto.enabled, allows you to turn off one service

there already was a config.enabled. we only do checkFeeds if it's true, so you can shut down an instance so it can be tested elsewhere

Update readme.md to indicate new functionality

Breakage in new version

config.disclaimer no longer supported.

#### 4/18/23 by DW

Hook it up to FeedLand's websockets interface so we're notified instantly that feeds updated. Much simpler than the rssCloud interface. 

#### 4/17/23 by DW

I'm going to use this to map my linkblog feed to Mastodon. 

#### 12/4/22 by DW

Rewrote mastopost to send the params in the body of the post instead of as url params. 

This is the way forms work, and posts are basically emulating forms, so it seemed this was the most conservative way to go and should give the maximum interop.

#### 12/3/22 by DW -- v0.4.3

Follow redirects on HTTP requests. 

#### 12/2/22 by DW -- v0.4.2

Strip HTML markup from the description element, if it's used. Mastodon neuters the HTML tags. Not a good look.

Check feeds at startup. Shouldn't have to wait a minute or more for it to check. 

Added a missing step in the instructions in the readme.

#### 12/1/22 by DW -- v0.4.1

We now do a better job with items that have both titles and descriptions. Previously it was either/or -- either it had a title or a description but not both. Now we allocate for the disclaimer + title + link and whatever is left over we give to the description/markdown text.

Added three more feeds to the initial config.json: my linkblog feed, NYT Most Recent Stories and the FeedLand Likes feed from all users. The NYT feed has a consistent format, and the Likes feed is all over the map, and it's easy to add an item to the feed, just <i>like</i> something in FeedLand, the feed is rebuilt immediately. 

Also emptied out the disclaimer in the initial config.json.

#### 11/28/22 by DW 

Check a list of feeds periodically, post new items to Mastodon.

