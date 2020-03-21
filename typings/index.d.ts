declare module "youtube-fetcher-dl" {
  namespace YoutubeFetcher {
    type Filter =
      | "audioandvideo"
      | "video"
      | "videoonly"
      | "audio"
      | "audioonly"
      | ((format: videoFormat) => boolean);

    type videoFormat = {
      itag: number;
      url: string;
      mimeType?: string;
      bitrate?: number | string;
      width?: number;
      height?: number;
      initRange?: { start: string; end: string };
      indexRange?: { start: string; end: string };
      lastModified: string;
      contentLength: string;
      quality:
        | "tiny"
        | "small"
        | "medium"
        | "large"
        | "hd720"
        | "hd1080"
        | "hd1440"
        | string;
      qualityLabel:
        | "144p"
        | "240p"
        | "270p"
        | "360p"
        | "480p"
        | "720p"
        | "1080p"
        | "1440p"
        | "2160p"
        | "4320p";
      projectionType: "RECTANGULAR";
      fps?: number;
      averageBitrate: number;
      audioQuality?: "AUDIO_QUALITY_LOW" | "AUDIO_QUALITY_MEDIUM";
      colorInfo?: {
        primaries: string;
        transferCharacteristics: string;
        matrixCoefficients: string;
      };
      highReplication?: boolean;
      approxDurationMs: string;
      audioSampleRate?: string;
      audioChannels?: number;

      container: "flv" | "3gp" | "mp4" | "webm" | "ts";
      codecs: string;

      live: boolean;
      isHLS: boolean;
      isDashMPD: boolean;
    };

    type options = {
      quality?:
        | "lowest"
        | "highest"
        | "highestaudio"
        | "lowestaudio"
        | "highestvideo"
        | "lowestvideo"
        | string
        | number;
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
    };
  }
  export = YoutubeFetcher;
}
