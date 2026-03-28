const axios = require('axios');

exports.handler = async (event) => {
    // Faqat POST so'rovini qabul qilish
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { username } = JSON.parse(event.body);
        const { YT_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;

        // 1. YouTube API orqali kanalni qidirish
        const searchRes = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
                part: 'snippet',
                type: 'channel',
                q: username,
                key: YT_API_KEY,
                maxResults: 1
            }
        });

        if (!searchRes.data.items || searchRes.data.items.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ error: "Kanal topilmadi" }) };
        }

        const channelId = searchRes.data.items[0].id.channelId;

        // 2. Kanal statistikasi va Mashhur videolar (Parallel so'rov)
        const [statsRes, popularRes] = await Promise.all([
            axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
                params: { part: 'statistics,snippet,topicDetails', id: channelId, key: YT_API_KEY }
            }),
            axios.get(`https://www.googleapis.com/youtube/v3/search`, {
                params: { part: 'snippet', channelId: channelId, maxResults: 5, order: 'viewCount', type: 'video', key: YT_API_KEY }
            })
        ]);

        // 3. Supabase-ga Log yozish (Xato bo'lsa ham asosiy natija ketaveradi)
        try {
            await axios.post(`${SUPABASE_URL}/rest/v1/logs`, {
                channel_username: username,
                ip_address: event.headers['x-nf-client-connection-ip'] || 'nomaʼlum'
            }, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }
            });
        } catch (e) { console.error("Supabase Error"); }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                channel: statsRes.data.items[0],
                popularVideos: popularRes.data.items
            })
        };

    } catch (error) {
        console.error("General Error:", error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: error.message }) 
        };
    }
};
