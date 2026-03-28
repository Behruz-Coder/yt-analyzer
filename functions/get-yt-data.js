const axios = require('axios');

exports.handler = async (event) => {
    const headers = { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json' 
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };

    try {
        const { YT_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;
        const body = JSON.parse(event.body || '{}');
        
        // 1. Kanalni izlash
        const username = body.username.replace('@', '');
        const channelRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(username)}&key=${YT_API_KEY}`);
        
        if (!channelRes.data.items || channelRes.data.items.length === 0) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: "Kanal topilmadi" }) };
        }
        
        const channel = channelRes.data.items[0];
        const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

        // 2. Oxirgi videolarni olish (Xatolikdan qochish uchun try-catch ichida)
        let recentVideos = [];
        try {
            const vidsRes = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=15&playlistId=${uploadsPlaylistId}&key=${YT_API_KEY}`);
            const videoIds = vidsRes.data.items.map(v => v.contentDetails.videoId).join(',');
            
            const statsRes = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${YT_API_KEY}`);
            recentVideos = statsRes.data.items;
        } catch (vErr) {
            console.error("Video Fetch Error:", vErr);
        }

        // 3. Supabase'dan badwordlarni olish
        let badwords = [];
        try {
            const bwRes = await axios.get(`${SUPABASE_URL}/rest/v1/custom_badwords?select=word`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            badwords = bwRes.data.map(w => w.word);
        } catch (sErr) { console.error("Supabase Error:", sErr); }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ channel, recentVideos, badwords })
        };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
