const client_id = '7402871e1f1e47eea15cf69cd570959b';
const client_secret = process.env.clientsecret
const track_id = '0y1QJc3SJVPKJ1OvFmFqe6'; // Bohemian Rhapsody

async function getAccessToken() {
    const credentials = btoa(`${client_id}:${client_secret}`);

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
}

async function getAudioAnalysis(token, track_id) {
    const response = await fetch(`https://api.spotify.com/v1/audio-analysis/${track_id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();
    return data;
}

function getCurrentTrackId() {
    const track = Spicetify?.Player?.getNowPlaying?.() || Spicetify?.Player?.data?.item;
    return track?.uri?.split(":").pop() || null;
}

async function main() {
    // Wait until Spicetify is fully loaded
    while (!Spicetify?.Player || !Spicetify?.Player?.data || !document.querySelector('audio')) {
        await new Promise(r => setTimeout(r, 300));
    }

    const track_id = getCurrentTrackId();
    if (!track_id) {
        console.error("❌ No track is currently playing or ID is unavailable.");
        return;
    }

    console.log("🎧 Now Playing Track ID:", track_id);

    try {
        const token = await getAccessToken();
        const analysis = await getAudioAnalysis(token, track_id);

        if (!analysis.track) {
            console.error("❌ No track data found in analysis. Maybe the track ID is invalid or there's no data.");
            return;
        }

        console.log("🎵 Tempo (BPM):", analysis.track.tempo);
        console.log("⏱ Total Beats:", analysis.beats.length);

        const startTime = Date.now();

        analysis.beats.forEach((beat, index) => {
            const delay = beat.start * 1000;

            setTimeout(() => {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log(`🔊 Beat ${index + 1} - tiempo real: ${elapsed}s`);
            }, delay);
        });

    } catch (error) {
        console.error("❌ Error getting audio analysis data:", error);
    }
}

main();