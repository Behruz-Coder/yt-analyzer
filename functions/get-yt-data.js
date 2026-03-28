const axios = require('axios');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    
    const { username } = JSON.parse(event.body);
    const userIP = event.headers['x-nf-client-connection-ip'] || 'nomaʼlum';
    const rawAgent = event.headers['user-agent'] || '';

    // Qurilma tahlili
    let deviceInfo = rawAgent.includes("Android") ? "Android" : rawAgent.includes("iPhone") ? "iPhone" : "PC";
    let browser = rawAgent.includes("Chrome") ? "Chrome" : rawAgent.includes("Firefox") ? "Firefox" : "Safari";
    const finalDevice = `${deviceInfo} (${browser})`;

    const { YT_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;

    try {
        // 1. Kanalni topish
        const searchRes = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${YT_API_KEY}&maxResults=1`);
        if (!searchRes.data.items.length) throw new Error("Kanal topilmadi");
        const channelId = searchRes.data.items[0].id.channelId;

        // 2. Mukammal statistika va Mavzular
        const statsRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,topicDetails&id=${channelId}&key=${YT_API_KEY}`);
        const channel = statsRes.data.items[0];

        // 3. Eng mashhur 5 ta video
        const popularRes = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=5&order=viewCount&type=video&key=${YT_API_KEY}`);
        
        // 4. Joylashuvni aniqlash
        let loc = "Aniqlanmadi";
        try {
            const geo = await axios.get(`https://ipapi.co/${userIP}/json/`);
            if(geo.data && !geo.data.error) loc = `${geo.data.country_name}, ${geo.data.city} (${geo.data.org})`;
        } catch(e){}

        // 5. Supabase-ga log yozish
        await axios.post(`${SUPABASE_URL}/rest/v1/logs`, {
            channel_username: username,
            ip_address: userIP,
            device_info: finalDevice,
            location: loc
        }, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ channel: channel, popularVideos: popularRes.data.items })
        };
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
};
