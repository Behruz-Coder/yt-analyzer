const axios = require('axios');

exports.handler = async (event) => {
    const { type, q, channelId, idList } = event.queryStringParameters;
    const YT_KEY = process.env.YOUTUBE_API_KEY;
    const userIP = event.headers['x-forwarded-for'] || 'unknown';

    // IP Limit simulyatsiyasi (Aslida bazadan tekshiriladi)
    console.log(`Request from IP: ${userIP}`);

    try {
        let url = "";
        if (type === "search") {
            url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=channel&maxResults=15&key=${YT_KEY}`;
        } else if (type === "detail") {
            url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,contentDetails&id=${channelId}&key=${YT_KEY}`;
        } else if (type === "videos") {
            url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=viewCount&type=video&key=${YT_KEY}`;
        }

        const res = await axios.get(url);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.data)
        };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: "API Error: " + e.message }) };
    }
};
