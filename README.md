# youtube-fetcher

This package generates list of youtube video links which you can download or stream.

```javascript
const youtubeFetcher = require("youtube-fetcher-dl");

async function run() {
    console.log(await youtubeFetcher(youtube_id, [options]));
}

run();

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