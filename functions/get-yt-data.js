const axios = require('axios');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };

    try {
        const body = JSON.parse(event.body);
        const { action, password, username, word, ip_address } = body;
        const { YT_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;
        
        const userIP = event.headers['x-nf-client-connection-ip'] || 'unknown';
        const userAgent = event.headers['user-agent'] || 'unknown';

        const isAdmin = password === "YtAdmins";

        // --- ADMIN FUNKSIYALARI ---
        if (isAdmin) {
            if (action === 'get_logs') {
                const res = await axios.get(`${SUPABASE_URL}/rest/v1/logs?select=*&order=created_at.desc&limit=50`, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                return { statusCode: 200, headers, body: JSON.stringify(res.data) };
            }
            if (action === 'toggle_block') {
                const check = await axios.get(`${SUPABASE_URL}/rest/v1/blocked_users?ip_address=eq.${ip_address}`, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                if (check.data.length > 0) {
                    await axios.delete(`${SUPABASE_URL}/rest/v1/blocked_users?ip_address=eq.${ip_address}`, {
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                    });
                } else {
                    await axios.post(`${SUPABASE_URL}/rest/v1/blocked_users`, { ip_address }, {
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                    });
                }
                return { statusCode: 200, headers, body: JSON.stringify({ m: "OK" }) };
            }
            if (action === 'whitelist_ip') {
                await axios.post(`${SUPABASE_URL}/rest/v1/whitelisted_users`, { ip_address: ip_address }, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                return { statusCode: 200, headers, body: JSON.stringify({ m: "Oqlandi" }) };
            }
            if (action === 'add_badword') {
                await axios.post(`${SUPABASE_URL}/rest/v1/custom_badwords`, { word }, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                return { statusCode: 200, headers, body: JSON.stringify({ m: "OK" }) };
            }
        }

        // --- FOYDALANUVCHI TEKSHIRUVI ---
        const blockCheck = await axios.get(`${SUPABASE_URL}/rest/v1/blocked_users?ip_address=eq.${userIP}`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const whiteCheck = await axios.get(`${SUPABASE_URL}/rest/v1/whitelisted_users?ip_address=eq.${userIP}`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const isWhitelisted = whiteCheck.data.length > 0;

        if (blockCheck.data.length > 0 && !isWhitelisted) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: "BLOK" }) };
        }

        // --- YOUTUBE QIDIRUV (MUSTAHKAM) ---
        let channel = null;
        const cleanName = username.startsWith('@') ? username.substring(1) : username;
        
        // 1. Handle orqali qidirish
        const res1 = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${cleanName}&key=${YT_API_KEY}`);
        
        if (res1.data.items && res1.data.items.length > 0) {
            channel = res1.data.items[0];
        } else {
            // 2. Qidiruv orqali ID topish
            const res2 = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${username}&type=channel&maxResults=1&key=${YT_API_KEY}`);
            if (res2.data.items && res2.data.items.length > 0) {
                const cId = res2.data.items[0].snippet.channelId;
                const res3 = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${cId}&key=${YT_API_KEY}`);
                channel = res3.data.items[0];
            }
        }

        // Log va badwords
        await axios.post(`${SUPABASE_URL}/rest/v1/logs`, { channel_username: username, ip_address: userIP, device_info: userAgent }, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const badRes = await axios.get(`${SUPABASE_URL}/rest/v1/custom_badwords?select=word`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                channel, 
                customBadwords: badRes.data.map(w => w.word),
                isWhitelisted 
            })
        };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
