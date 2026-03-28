const axios = require('axios');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        const { YT_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;
        const body = JSON.parse(event.body || '{}');
        const userIP = event.headers['x-nf-client-connection-ip'] || 'unknown';
        const supabaseAuth = { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } };

        // --- OWNER (ADMIN) AMALLARI ---
        if (body.password === "YtAdmins") {
            if (body.action === 'get_logs') {
                const res = await axios.get(`${SUPABASE_URL}/rest/v1/logs?select=*&order=created_at.desc&limit=50`, supabaseAuth);
                return { statusCode: 200, headers, body: JSON.stringify(res.data) };
            }
            if (body.action === 'toggle_block') {
                await axios.post(`${SUPABASE_URL}/rest/v1/blocked_users`, { ip_address: body.ip_address }, supabaseAuth);
                return { statusCode: 200, headers, body: JSON.stringify({ m: "BLOCKED" }) };
            }
            if (body.action === 'whitelist_ip') {
                await axios.delete(`${SUPABASE_URL}/rest/v1/blocked_users?ip_address=eq.${body.ip_address}`, supabaseAuth);
                return { statusCode: 200, headers, body: JSON.stringify({ m: "UNBLOCKED" }) };
            }
            if (body.action === 'add_badword') {
                await axios.post(`${SUPABASE_URL}/rest/v1/custom_badwords`, { word: body.word }, supabaseAuth);
                return { statusCode: 200, headers, body: JSON.stringify({ m: "ADDED" }) };
            }
        }

        // --- XAVFSIZLIK: IP BLOCK TEKSHIRUVI ---
        const blockCheck = await axios.get(`${SUPABASE_URL}/rest/v1/blocked_users?ip_address=eq.${userIP}`, supabaseAuth);
        if (blockCheck.data.length > 0) return { statusCode: 403, headers, body: JSON.stringify({ error: "BLOCKED" }) };

        // --- YOUTUBE ANALIZ (MURAKKAB ALGORITM) ---
        const username = (body.username || "").replace('@', '');
        const chRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(username)}&key=${YT_API_KEY}`);
        
        if (!chRes.data.items) return { statusCode: 404, headers, body: JSON.stringify({ error: "NOT_FOUND" }) };
        
        const channel = chRes.data.items[0];
        const playlistId = channel.contentDetails.relatedPlaylists.uploads;

        // Eng so'nggi 20 ta video ma'lumotlari
        const vidsRes = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&maxResults=20&playlistId=${playlistId}&key=${YT_API_KEY}`);
        const vIds = vidsRes.data.items.map(v => v.contentDetails.videoId).join(',');
        const vStats = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${vIds}&key=${YT_API_KEY}`);

        // Badwordlarni olish va Log yozish
        const bwRes = await axios.get(`${SUPABASE_URL}/rest/v1/custom_badwords?select=word`, supabaseAuth);
        await axios.post(`${SUPABASE_URL}/rest/v1/logs`, { channel_username: body.username, ip_address: userIP }, supabaseAuth);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                channel, 
                recentVideos: vStats.data.items, 
                badwords: bwRes.data.map(w => w.word) 
            })
        };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
