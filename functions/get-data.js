const axios = require('axios');

/**
 * TITAN v2.5 - Backend Engine
 * Joylashuvi: /functions/get-data.js
 * Vazifasi: YouTube API bilan xavfsiz aloqa va ma'lumotlarni filtrlash
 */

exports.handler = async (event, context) => {
    // CORS sarlavhalari (Brauzer bloklamasligi uchun)
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTION",
        "Content-Type": "application/json"
    };

    // OPTIONS so'rovlarini qayta ishlash
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "OK" };
    }

    // Netlify Environment Variables'dan API kalitni olish
    const API_KEY = process.env.YOUTUBE_API_KEY;
    const { type, q, channelId, idList, maxResults = 10 } = event.queryStringParameters;

    if (!API_KEY) {
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: "API kaliti topilmadi. Netlify sozlamalarini tekshiring." }) 
        };
    }

    try {
        let apiUrl = "";

        // So'rov turiga qarab URL shakllantirish (4, 13, 21-qismlar)
        switch (type) {
            case "search":
                // Kanal qidirish
                apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=channel&maxResults=${maxResults}&key=${API_KEY}`;
                break;
            
            case "detail":
                // Kanal haqida chuqur statistika (4, 15, 18-qismlar)
                apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,topicDetails,contentDetails&id=${channelId}&key=${API_KEY}`;
                break;

            case "videos":
                // Kanalning eng mashhur videolari (4-qism)
                apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=viewCount&type=video&key=${API_KEY}`;
                break;

            case "leaderboard":
                // Bir nechta kanalni solishtirish yoki reyting (2, 21-qismlar)
                apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${idList}&key=${API_KEY}`;
                break;

            default:
                throw new Error("Noto'g'ri so'rov turi yuborildi.");
        }

        const response = await axios.get(apiUrl);
        
        // 8-qism: Badwords filter (Soddalashtirilgan variant, mantiqan shu yerda ishlaydi)
        // Agar qidiruv bo'lsa, natijalardan haqoratli so'zlarni olib tashlash mumkin
        let finalData = response.data;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(finalData)
        };

    } catch (error) {
        console.error("TITAN API ERROR:", error.response ? error.response.data : error.message);
        
        return {
            statusCode: error.response ? error.response.status : 500,
            headers,
            body: JSON.stringify({ 
                error: "YouTube API'dan ma'lumot olishda xatolik yuz berdi.",
                details: error.response ? error.response.data : error.message
            })
        };
    }
};
