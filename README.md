# youtube-fetcher

This package generates list of youtube video links which you can download or stream.

```javascript
const youtubeFetcher = require("youtube-fetcher-dl");
console.log(youtubeFetcher(youtube_id, [options]));

type options = {
    quality?: 'lowest' | 'highest' | 'highestaudio' | 'lowestaudio' | 'highestvideo' | 'lowestvideo' | string | number;
    filter?: Filter;
    format?: videoFormat;
    range?: {
    start?: number;
    end?: number;
    };
    begin?: string | number | Date;
    liveBuffer?: number;
    requestOptions?: {};
    highWaterMark?: number;
    lang?: string;
}
```