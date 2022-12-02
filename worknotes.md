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

