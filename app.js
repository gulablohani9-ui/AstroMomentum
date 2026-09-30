// --- Astronomy Engine Imported Globally via script tag ---
// Ayanamsa Map (Approximate values for calculations)
const AYANAMSA_OFFSETS = {
    LAHIRI: 24.15,   // Lahiri (Chitrapaksha)
    KP: 23.85,       // KP (Krishnamurti)
    RAMAN: 21.50,    // B.V. Raman
    FAGAN_BRADLEY: 24.75
};

// --- State ---
let state = {
    lat: 19.0760, lon: 72.8777,
    ayanamsa: 'LAHIRI'
};

// --- Rules Engine (Aapki Tables Ka JSON) ---
const RULES = {
    "Mars-Mercury": { base: "General Positive Momentum", cond: { "Mercury Retrograde or Combust": "Major Positive Momentum" } },
    "Mars-Jupiter": { base: "General Negative Momentum", cond: { "Jupiter Fast Moving": "Positive Momentum" } },
    "Mars-Venus": { base: "General Positive Momentum" },
    "Mars-Saturn": { base: "Negative Momentum", cond: { "Saturn Retrograde": "Dual trend and sometimes minor Positive Momentum" } },
    "Mars-Rahu": { base: "General Positive Momentum" },
    "Mars-Ketu": { base: "Sometimes Positive Momentum and Sometimes Negative Momentum" },
    "Mars-Uranus": { base: "Positive Momentum" },
    "Mars-Neptune": { base: "Before Conjunction Positive Momentum and post Conjunction Negative Momentum" },
    "Mars-Pluto": { base: "General Positive Momentum" },

    "Saturn-Rahu": { base: "Major Negative Momentum in Bearish Sign, but in Bullish signs General Momentum" },
    "Saturn-Ketu": { base: "General Negative Momentum" },
    "Saturn-Uranus": { base: "Major Negative Momentum in Bearish Sign, but in Bullish signs General Momentum" },
    "Saturn-Neptune": { base: "Major Negative Momentum in Bearish Sign, but in Bullish signs General Momentum" },
    "Saturn-Pluto": { base: "No Effect found" },

    "Moon-Mars": { base: "General Positive Momentum" },
    "Moon-Mercury": { base: "Sometimes Positive Momentum and Sometimes Negative Momentum" },
    "Moon-Jupiter": { base: "Sometimes Positive Momentum and Sometimes Negative Momentum" },
    "Moon-Venus": { base: "Majority times Negative Momentum" },
    "Moon-Saturn": { base: "Sometimes Positive Momentum and Sometimes Negative Momentum" },
    "Moon-Rahu": { base: "Negative Momentum" },
    "Moon-Ketu": { base: "Sometimes Positive Momentum and Sometimes Negative Momentum" },
    "Moon-Uranus": { base: "General Positive Momentum" },
    "Moon-Neptune": { base: "Before Conjunction Positive Momentum and post Conjunction Negative Momentum" },
    "Moon-Pluto": { base: "General Positive Momentum" },

    "Rahu-Uranus": { base: "Major Negative Momentum in Bearish Sign, but in Bullish signs General Negative Momentum" },
    "Rahu-Neptune": { base: "General Positive Momentum. If Neptune Retrograde or Combust then Negative Momentum" },
    "Rahu-Pluto": { base: "No Effect found" },
    "Ketu-Uranus": { base: "Major Negative Momentum in Bearish Sign, but in Bullish signs General Negative Momentum" },
    "Ketu-Neptune": { base: "General Positive Momentum. If Neptune Retrograde or Combust then Negative Momentum" },
    "Ketu-Pluto": { base: "No Effect found" },
    "Uranus-Neptune": { base: "Major Negative Momentum" },
    "Uranus-Pluto": { base: "No Effect found" },

    "Mercury-Jupiter": { base: "General Positive Momentum" },
    "Mercury-Venus": { base: "Negative Momentum", cond: { "Mercury Combust or Retrograde": "Positive Momentum" } },
    "Mercury-Saturn": { base: "Volatile Trend in both sides" },
    "Mercury-Rahu": { base: "No Major Effect on Market. Generally" },
    "Mercury-Ketu": { base: "No Major Effect on Market. Generally" },
    "Mercury-Uranus": { base: "Positive Momentum" },
    "Mercury-Neptune": { base: "Before Conjunction Positive Momentum and post Conjunction Negative Momentum" },
    "Mercury-Pluto": { base: "Positive Momentum" },

    "Jupiter-Venus": { base: "Positive Momentum in Bullish Signs, Negative Momentum in Bearish Signs. If either Retrograde then Negative Momentum" },
    "Jupiter-Saturn": { base: "Positive Momentum. In both planets, if anyone is Retrograde then Negative Momentum" },
    "Jupiter-Rahu": { base: "Positive Momentum, But if Jupiter is Retrograde then Negative Momentum" },
    "Jupiter-Ketu": { base: "Positive Momentum, But if Jupiter is Retrograde then Negative Momentum" },
    "Jupiter-Uranus": { base: "Major Positive Momentum" },
    "Jupiter-Neptune": { base: "Before Conjunction Positive Momentum and post Conjunction Negative Momentum" },
    "Jupiter-Pluto": { base: "Positive Momentum" }
};

// --- Initialize ---
function init() {
    document.getElementById('loading').classList.add('hidden');
    loadSettings();
    showTab('daily');
}

// --- Core Astronomical Calculations (Using Astronomy Engine) ---
function getPlanetPos(planetName, date) {
    // Astronomy Engine body mapping
    const bodyMap = {
        Sun: Astronomy.Body.Sun, Moon: Astronomy.Body.Moon, Mercury: Astronomy.Body.Mercury,
        Venus: Astronomy.Body.Venus, Mars: Astronomy.Body.Mars, Jupiter: Astronomy.Body.Jupiter,
        Saturn: Astronomy.Body.Saturn, Uranus: Astronomy.Body.Uranus, Neptune: Astronomy.Body.Neptune,
        Pluto: Astronomy.Body.Pluto
    };

    let lon, lat;
    
    if (planetName === 'Rahu' || planetName === 'Ketu') {
        // Calculate True Node for Rahu/Ketu
        const node = Astronomy.SearchMoonNode(date);
        lon = node.time.date.getTime() ? node.time.date.getTime() : 0; // Fallback
        // Use mean node approximation if true node fails
        const moon = Astronomy.GeoMoon(date);
        const ecl = Astronomy.Ecliptic(moon);
        lon = ecl.elon - 180; // Mean Node approximation for simplicity
        if (planetName === 'Ketu') lon += 180;
    } else {
        const vector = Astronomy.GeoVector(bodyMap[planetName], date, true);
        const ecl = Astronomy.Ecliptic(vector);
        lon = ecl.elon;
        lat = ecl.elat;
    }

    // Retrograde detection: compare position 1 day ago and 1 day later
    let retro = false;
    if (planetName !== 'Sun' && planetName !== 'Moon' && planetName !== 'Rahu' && planetName !== 'Ketu') {
        const prevDate = new Date(date.getTime() - 86400000);
        const nextDate = new Date(date.getTime() + 86400000);
        const prevVec = Astronomy.GeoVector(bodyMap[planetName], prevDate, true);
        const nextVec = Astronomy.GeoVector(bodyMap[planetName], nextDate, true);
        const prevLon = Astronomy.Ecliptic(prevVec).elon;
        const nextLon = Astronomy.Ecliptic(nextVec).elon;
        if (nextLon < prevLon && Math.abs(nextLon - prevLon) < 180) retro = true;
        if (nextLon > prevLon && Math.abs(nextLon - prevLon) > 180) retro = true;
    }

    return { lon: lon, lat: lat || 0, retro: retro };
}

function getAyanamsaValue(date, mode) {
    // Approximate Ayanamsa calculation based on J2000 epoch
    const J2000 = new Date('2000-01-01T12:00:00Z');
    const yearsSinceJ2000 = (date - J2000) / (365.25 * 24 * 3600 * 1000);
    const precessionRate = 50.29 / 3600; // degrees per year
    const baseAyanamsa = AYANAMSA_OFFSETS[mode] || 24.15;
    return baseAyanamsa + (yearsSinceJ2000 * precessionRate);
}

function isCombust(planetLon, sunLon, planetName) {
    const limits = { Mercury: 14, Venus: 10, Mars: 17, Jupiter: 11, Saturn: 15 };
    let diff = Math.abs(planetLon - sunLon);
    if (diff > 180) diff = 360 - diff;
    return diff <= (limits[planetName] || 0);
}

function isBullishSign(lon) {
    const normLon = (lon % 360 + 360) % 360;
    return normLon >= 0 && normLon < 180; // Aries to Virgo
}

// --- Rule Evaluator ---
function evaluateEffect(p1, p2, p1Data, p2Data, sunLon) {
    let key1 = `${p1}-${p2}`;
    let key2 = `${p2}-${p1}`;
    let rule = RULES[key1] || RULES[key2];

    if (!rule) return "No specific rule found.";

    let effect = rule.base;
    let conditions = rule.cond || {};

    if (conditions["Mercury Retrograde or Combust"] && (p1 === "Mercury" || p2 === "Mercury")) {
        let merc = p1 === "Mercury" ? p1Data : p2Data;
        if (merc.retro || isCombust(merc.lon, sunLon, "Mercury")) effect = conditions["Mercury Retrograde or Combust"];
    }
    if (conditions["Jupiter Fast Moving"] && (p1 === "Jupiter" || p2 === "Jupiter")) {
        let jup = p1 === "Jupiter" ? p1Data : p2Data;
        // Fast moving approximation: Jupiter speed > 0.1 deg/day
        const nextDate = new Date(Date.now() + 86400000);
        const jupNext = getPlanetPos("Jupiter", nextDate);
        const speed = Math.abs(jupNext.lon - jup.lon);
        if (speed > 0.1) effect = conditions["Jupiter Fast Moving"];
    }
    if (conditions["Saturn Retrograde"] && (p1 === "Saturn" || p2 === "Saturn")) {
        let sat = p1 === "Saturn" ? p1Data : p2Data;
        if (sat.retro) effect = conditions["Saturn Retrograde"];
    }
    if (conditions["Mercury Combust or Retrograde"] && (p1 === "Mercury" || p2 === "Mercury")) {
        let merc = p1 === "Mercury" ? p1Data : p2Data;
        if (merc.retro || isCombust(merc.lon, sunLon, "Mercury")) effect = conditions["Mercury Combust or Retrograde"];
    }
    if (conditions["Neptune Retrograde or Combust"] && (p1 === "Neptune" || p2 === "Neptune")) {
        let nep = p1 === "Neptune" ? p1Data : p2Data;
        if (nep.retro || isCombust(nep.lon, sunLon, "Neptune")) effect = conditions["Neptune Retrograde or Combust"];
    }

    // Bullish/Bearish Logic for Jupiter/Saturn
    if (effect.includes("Bullish Signs") && (p1 === "Jupiter" || p1 === "Saturn" || p2 === "Jupiter" || p2 === "Saturn")) {
        let combinedLon = (p1Data.lon + p2Data.lon) / 2;
        if (isBullishSign(combinedLon)) {
            effect = effect.replace("Bullish Signs", "Bullish Signs ✅");
        } else {
            effect = effect.replace("Bullish Signs", "Bearish Signs ❌");
        }
    }
    
    // Retrograde override for Jupiter/Venus/Saturn
    if (effect.includes("If either Retrograde") && (p1Data.retro || p2Data.retro)) {
        effect = "Negative Momentum (Retrograde Override)";
    }

    return effect;
}

// --- Transit Scanner ---
function scanTransits(startDate, endDate, selectedPairs) {
    let results = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        const ayan = getAyanamsaValue(current, state.ayanamsa);
        const sunData = getPlanetPos('Sun', current);
        let sunLon = sunData.lon - ayan;

        for (let pair of selectedPairs) {
            let p1 = pair[0], p2 = pair[1];
            if (p1 === p2) continue;

            let p1Data = getPlanetPos(p1, current);
            let p2Data = getPlanetPos(p2, current);
            
            p1Data.lon -= ayan;
            p2Data.lon -= ayan;
            sunLon = sunData.lon - ayan;

            let diff = Math.abs(p1Data.lon - p2Data.lon);
            if (diff > 180) diff = 360 - diff;

            if (diff <= 10) { // 10 degree orb for conjunction
                let effect = evaluateEffect(p1, p2, p1Data, p2Data, sunLon);
                results.push({
                    date: dayjs(current).format('DD MMM YYYY'),
                    p1: p1, p2: p2,
                    degree: ((p1Data.lon % 360 + 360) % 360).toFixed(2), // FIXED: Always positive degree
                    effect: effect,
                    isPositive: effect.includes("Positive") && !effect.includes("Negative")
                });
            }
        }
        current.setDate(current.getDate() + 1);
    }
    return results;
}

// --- UI Functions ---
function showTab(tab) {
    document.querySelectorAll('.content-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-active').forEach(el => el.classList.remove('tab-active'));
    
    document.getElementById(`content-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-${tab}`).classList.add('tab-active');

    if (tab === 'daily') renderTransits(1);
    else if (tab === 'weekly') renderTransits(7);
    else if (tab === 'monthly') renderTransits(30);
}

function renderTransits(days) {
    const container = document.getElementById(`content-${days === 1 ? 'daily' : days === 7 ? 'weekly' : 'monthly'}`);
    container.innerHTML = '<div class="text-center py-4 text-slate-400">Calculating...</div>';

    setTimeout(() => {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + days);

        const allPairs = [
            ['Mars','Mercury'],['Mars','Jupiter'],['Mars','Venus'],['Mars','Saturn'],['Mars','Rahu'],['Mars','Ketu'],['Mars','Uranus'],['Mars','Neptune'],['Mars','Pluto'],
            ['Saturn','Rahu'],['Saturn','Ketu'],['Saturn','Uranus'],['Saturn','Neptune'],['Saturn','Pluto'],
            ['Moon','Mars'],['Moon','Mercury'],['Moon','Jupiter'],['Moon','Venus'],['Moon','Saturn'],['Moon','Rahu'],['Moon','Ketu'],['Moon','Uranus'],['Moon','Neptune'],['Moon','Pluto'],
            ['Rahu','Uranus'],['Rahu','Neptune'],['Rahu','Pluto'],['Ketu','Uranus'],['Ketu','Neptune'],['Ketu','Pluto'],['Uranus','Neptune'],['Uranus','Pluto'],
            ['Mercury','Jupiter'],['Mercury','Venus'],['Mercury','Saturn'],['Mercury','Uranus'],['Mercury','Neptune'],['Mercury','Pluto'],
            ['Jupiter','Venus'],['Jupiter','Saturn'],['Jupiter','Rahu'],['Jupiter','Ketu'],['Jupiter','Uranus'],['Jupiter','Neptune'],['Jupiter','Pluto']
        ];

        const results = scanTransits(start, end, allPairs);
        
        if (results.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-slate-400">No major conjunctions found in this period.</div>';
            return;
        }

        let html = '';
        results.forEach(r => {
            const colorClass = r.isPositive ? 'positive' : (r.effect.includes("Negative") ? 'negative' : 'neutral');
            html += `
                <div class="card">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-sm text-slate-400">${r.date}</span>
                        <span class="text-xs bg-slate-700 px-2 py-1 rounded">${r.degree}°</span>
                    </div>
                    <div class="font-bold text-lg text-white">${r.p1} + ${r.p2}</div>
                    <div class="mt-1 text-sm ${colorClass}">${r.effect}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    }, 100);
}

// --- Search Function ---
function runSearch() {
    const p1 = document.getElementById('searchP1').value;
    const p2 = document.getElementById('searchP2').value;
    const start = document.getElementById('searchStart').value;
    const end = document.getElementById('searchEnd').value;
    const resultsDiv = document.getElementById('searchResults');

    if (!start || !end) { alert("Please select start and end dates."); return; }
    if (p1 === p2) { alert("Please select different planets."); return; }

    resultsDiv.innerHTML = '<div class="text-center py-4 text-slate-400">Searching...</div>';

    setTimeout(() => {
        const results = scanTransits(new Date(start), new Date(end), [[p1, p2]]);
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="text-center py-4 text-slate-400">No conjunction found in this range.</div>';
            return;
        }

        let html = '<h3 class="font-bold mb-2 text-white">Search Results:</h3>';
        results.forEach(r => {
            const colorClass = r.isPositive ? 'positive' : (r.effect.includes("Negative") ? 'negative' : 'neutral');
            html += `
                <div class="card">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-sm text-slate-400">${r.date}</span>
                        <span class="text-xs bg-slate-700 px-2 py-1 rounded">${r.degree}°</span>
                    </div>
                    <div class="font-bold text-lg text-white">${r.p1} + ${r.p2}</div>
                    <div class="mt-1 text-sm ${colorClass}">${r.effect}</div>
                </div>
            `;
        });
        resultsDiv.innerHTML = html;
    }, 100);
}

// --- Settings ---
function toggleSettings() {
    document.getElementById('settingsPanel').classList.toggle('hidden');
}

function saveSettings() {
    state.lat = parseFloat(document.getElementById('lat').value);
    state.lon = parseFloat(document.getElementById('lon').value);
    state.ayanamsa = document.getElementById('ayanamsa').value;
    localStorage.setItem('astroSettings', JSON.stringify(state));
    alert("Settings saved!");
    showTab('daily');
}

function loadSettings() {
    const saved = localStorage.getItem('astroSettings');
    if (saved) {
        state = { ...state, ...JSON.parse(saved) };
        document.getElementById('lat').value = state.lat;
        document.getElementById('lon').value = state.lon;
        document.getElementById('ayanamsa').value = state.ayanamsa;
    }
}

// --- Start ---
init();
