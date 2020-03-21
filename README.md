# youtube-fetcher

use like this:

```
    const youtubeFetcher = require("youtube-fetcher-dl");
    console.log(youtubeFetcher(url, [options]));

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