const axios = require('axios');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const { username } = JSON.parse(event.body);
    const { YT_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;

    try {
        // 1. Kanalni topish
        const searchRes = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${YT_API_KEY}&maxResults=1`);
        if (!searchRes.data.items.length) throw new Error("Kanal topilmadi");
        const channelId = searchRes.data.items[0].id.channelId;

        // 2. Kanal statistikasi va Mavzular
        const statsRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,topicDetails&id=${channelId}&key=${YT_API_KEY}`);
        const channel = statsRes.data.items[0];

        // 3. ENG MASHHUR 5 TA VIDEO
        const popularVideosRes = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=5&order=viewCount&type=video&key=${YT_API_KEY}`);
        const popularVideos = popularVideosRes.data.items;

        // 4. Log saqlash (Sizda bor bo'lgan log kodi shu yerda qolsin...)
        // ... (log kodi)

        return {
            statusCode: 200,
            body: JSON.stringify({
                channel: channel,
                popularVideos: popularVideos
            })
        };
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
};
