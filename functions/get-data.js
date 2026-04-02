const axios = require('axios');

exports.handler = async (event) => {
    const { type, q, channelId, idList } = event.queryStringParameters;
    const YT_KEY = process.env.YOUTUBE_API_KEY;

    try {
        let url = "";
        if (type === "search") {
            url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=channel&maxResults=10&key=${YT_KEY}`;
        } else if (type === "detail") {
            url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${YT_KEY}`;
        } else if (type === "leaderboard") {
            url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${idList}&key=${YT_KEY}`;
        }

        const res = await axios.get(url);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.data)
        };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
