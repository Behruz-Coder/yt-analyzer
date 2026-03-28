const axios = require('axios');

exports.handler = async (event) => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };

    try {
        const { YT_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;
        const body = JSON.parse(event.body || '{}');
        const userIP = event.headers['x-nf-client-connection-ip'] || 'unknown';
        const supabaseAuth = { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } };

        // Admin logic (avvalgi kod bilan bir xil, o'zgartirmang...)
        if (body.password === "YtAdmins") { /* ... admin kodlari ... */ }

        // 1. Kanal ma'lumotlarini olish
        const username = body.username.replace('@', '');
        const channelRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(username)}&key=${YT_API_KEY}`);
        
        if (!channelRes.data.items) return { statusCode: 404, headers, body: JSON.stringify({ error: "Not Found" }) };
        
        const channel = channelRes.data.items[0];
        const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

        // 2. Oxirgi 50 ta videoni olish (Deep Analysis uchun)
        const videosRes = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=30&playlistId=${uploadsPlaylistId}&key=${YT_API_KEY}`);
        
        const videoIds = videosRes.data.items.map(v => v.contentDetails.videoId).join(',');
        const videoStatsRes = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${YT_API_KEY}`);

        // Badwordlarni olish
        const bwRes = await axios.get(`${SUPABASE_URL}/rest/v1/custom_badwords?select=word`, supabaseAuth);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                channel: channel,
                recentVideos: videoStatsRes.data.items, // Mana bu super statistika uchun kerak
                badwords: bwRes.data.map(w => w.word)
            })
        };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
