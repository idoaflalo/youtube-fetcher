const urllib = require('url');
const querystring = require('querystring');
const miniget = require('miniget');
const util = require('./util');
const extras = require('./info-extras');
const sig = require('./sig');

const VIDEO_URL = 'https://www.youtube.com/watch?v=';
const EMBED_URL = 'https://www.youtube.com/embed/';
const VIDEO_EURL = 'https://youtube.googleapis.com/v/';
const INFO_HOST = 'www.youtube.com';
const INFO_PATH = '/get_video_info';


const getBasicInfo = async(id, options) => {
    // Try getting config from the video page first.
    const params = 'hl=' + 'en';
    let url = VIDEO_URL + id + '&' + params +
        '&bpctr=' + Math.ceil(Date.now() / 1000);

    // Remove header from watch page request.
    // Otherwise, it'll use a different framework for rendering content.
    const reqOptions = Object.assign({}, options.requestOptions);
    reqOptions.headers = Object.assign({}, reqOptions.headers, {
        'User-Agent': '',
    });

    let [, body] = await miniget.promise(url, reqOptions);

    // Check if there are any errors with this video page.
    const unavailableMsg = util.between(body, '<div id="player-unavailable"', '>');
    if (unavailableMsg &&
        !/\bhid\b/.test(util.between(unavailableMsg, 'class="', '"'))) {
        // Ignore error about age restriction.
        if (!body.includes('<div id="watch7-player-age-gate-content"')) {
            throw Error(util.between(body,
                '<h1 id="unavailable-message" class="message">', '</h1>').trim());
        }
    }

    // Parse out additional metadata from this page.
    const additional = {
        // Get the author/uploader.
        author: extras.getAuthor(body),

        // Get the day the vid was published.
        published: extras.getPublished(body),

        // Get description.
        description: extras.getVideoDescription(body),

        // Get media info.
        media: extras.getVideoMedia(body),

        // Get related videos.
        related_videos: extras.getRelatedVideos(body),

        // Get likes.
        likes: extras.getLikes(body),

        // Get dislikes.
        dislikes: extras.getDislikes(body),
    };

    const jsonStr = util.between(body, 'ytplayer.config = ', '</script>');
    let config;
    if (jsonStr) {
        config = jsonStr.slice(0, jsonStr.lastIndexOf(';ytplayer.load'));
        return await gotConfig(id, options, additional, config, false);

    } else {
        // If the video page doesn't work, maybe because it has mature content.
        // and requires an account logged in to view, try the embed page.
        url = EMBED_URL + id + '?' + params;
        let [, body] = await miniget.promise(url, options.requestOptions);
        config = util.between(body, 't.setConfig({\'PLAYER_CONFIG\': ', /\}(,'|\}\);)/);
        return await gotConfig(id, options, additional, config, true);
    }
};

const gotConfig = async(id, options, additional, config, fromEmbed) => {
    if (!config) {
        throw Error('Could not find player config');
    }
    try {
        config = JSON.parse(config + (fromEmbed ? '}' : ''));
    } catch (err) {
        throw Error('Error parsing config: ' + err.message);
    }
    const url = urllib.format({
        protocol: 'https',
        host: INFO_HOST,
        pathname: INFO_PATH,
        query: {
            video_id: id,
            eurl: VIDEO_EURL + id,
            ps: 'default',
            gl: 'US',
            hl: (options.lang || 'en'),
            sts: config.sts,
        },
    });
    let [, body] = await miniget.promise(url, options.requestOptions);
    let info = querystring.parse(body);
    const player_response = config.args.player_response || info.player_response;

    if (info.status === 'fail') {
        throw Error(`Code ${info.errorcode}: ${util.stripHTML(info.reason)}`);
    } else try {
        info.player_response = JSON.parse(player_response);
    } catch (err) {
        throw Error('Error parsing `player_response`: ' + err.message);
    }

    let playability = info.player_response.playabilityStatus;
    if (playability && playability.status === 'UNPLAYABLE') {
        throw Error(util.stripHTML(playability.reason));
    }

    info.formats = parseFormats(info);

    // Add additional properties to info.
    Object.assign(info, additional, {
        video_id: id,

        // Give the standard link to the video.
        video_url: VIDEO_URL + id,

        // Copy over a few props from `player_response.videoDetails`
        // for backwards compatibility.
        title: info.player_response.videoDetails && info.player_response.videoDetails.title,
        length_seconds: info.player_response.videoDetails && info.player_response.videoDetails.lengthSeconds,
    });

    info.age_restricted = fromEmbed;
    info.html5player = config.assets.js;

    return info;
};


const parseFormats = (info) => {
    let formats = [];
    if (info.player_response.streamingData) {
        if (info.player_response.streamingData.formats) {
            formats = formats.concat(info.player_response.streamingData.formats);
        }
        if (info.player_response.streamingData.adaptiveFormats) {
            formats = formats.concat(info.player_response.streamingData.adaptiveFormats);
        }
    }
    return formats;
};

const getFullInfo = async(id, options = {}) => {
    let info = await getBasicInfo(id, options);
    const hasManifest =
        info.player_response && info.player_response.streamingData && (
            info.player_response.streamingData.dashManifestUrl ||
            info.player_response.streamingData.hlsManifestUrl
        );
    if (!info.formats.length && !hasManifest) {
        throw Error('This video is unavailable');
    }
    const html5playerfile = urllib.resolve(VIDEO_URL, info.html5player);
    let tokens = await sig.getTokens(html5playerfile, options);

    sig.decipherFormats(info.formats, tokens, options.debug);
    let funcs = [];
    if (hasManifest && info.player_response.streamingData.dashManifestUrl) {
        let url = info.player_response.streamingData.dashManifestUrl;
        funcs.push(getDashManifest(url, options));
    }
    if (hasManifest && info.player_response.streamingData.hlsManifestUrl) {
        let url = info.player_response.streamingData.hlsManifestUrl;
        funcs.push(getM3U8(url, options));
    }

    let results = await Promise.all(funcs);
    if (results[0]) { mergeFormats(info, results[0]); }
    if (results[1]) { mergeFormats(info, results[1]); }

    info.formats = info.formats.map(util.addFormatMeta);
    info.formats.sort(util.sortFormats);
    info.full = true;
    return info;
};

module.exports = getFullInfo;