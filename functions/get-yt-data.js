const axios = require('axios');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const { username } = JSON.parse(event.body);
    const userIP = event.headers['x-nf-client-connection-ip'] || 'nomaʼlum';
    const userAgent = event.headers['user-agent'] || 'nomaʼlum qurilma'; // Qurilma va brauzer ma'lumoti

    const { YT_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;

    try {
        // 1. IP orqali joylashuvni aniqlash (bepul API)
        let locationData = "Aniqlanmadi";
        try {
            const geoRes = await axios.get(`http://ip-api.com/json/${userIP}`);
            if (geoRes.data.status === 'success') {
                locationData = `${geoRes.data.country}, ${geoRes.data.city} (Provayder: ${geoRes.data.isp})`;
            }
        } catch (e) { console.log("Geo xato"); }

        // 2. YouTube ma'lumotlarini olish (Search qismi)
        const searchRes = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${YT_API_KEY}&maxResults=1`);
        
        if (!searchRes.data.items || searchRes.data.items.length === 0) {
            throw new Error("Kanal topilmadi");
        }
        const channelId = searchRes.data.items[0].id.channelId;
        const statsRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${YT_API_KEY}`);

        // 3. Supabase-ga batafsil Log yozish
        await axios.post(`${SUPABASE_URL}/rest/v1/logs`, {
            channel_username: username,
            ip_address: userIP,
            device_info: userAgent,
            location: locationData
        }, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify(statsRes.data.items[0])
        };

    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
};
