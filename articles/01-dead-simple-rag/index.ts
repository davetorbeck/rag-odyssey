import readline from 'readline';

const OPENWEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface OpenWeatherResponse {
  weather: { description: string }[];
  main: { temp: number };
  wind: { speed: number };
  dt: number;
  timezone: number;
  name: string;
}

if (!OPENWEATHER_API_KEY) {
  throw new Error('Missing OPENWEATHER_API_KEY in environment variables');
}

if (!GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY in environment variables');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function getWeather(city: string): Promise<{ summary: string; time: string; city: string }> {
  const url = `${OPENWEATHER_API_URL}?q=${encodeURIComponent(
    city,
  )}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Weather fetch failed: ${res.statusText}`);
  }

  const data: OpenWeatherResponse = await res.json();
  const description = data.weather[0].description;
  const temp = data.main.temp;
  const wind = data.wind.speed;
  const localTime = new Date((data.dt + data.timezone) * 1000);
  const formattedTime = localTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });

  const summary = `Weather: ${description}, ${temp}°C, wind ${wind} km/h`;

  return {
    summary,
    time: formattedTime,
    city: data.name,
  };
}

function extractGeminiText(data: any): string {
  try {
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) {
      return 'Gemini returned no content';
    }

    const textParts = parts
      .map((part: any) => {
        if (typeof part.text === 'string') return part.text.trim();
        return '';
      })
      .filter(Boolean); // take out any falsy values;

    return textParts.length > 0 ? textParts.join('\n\n') : 'Gemini return an empty response';
  } catch {
    return 'Failed to parse Gemini response';
  }
}

async function generateWithGemini(prompt: string): Promise<string> {
  const res = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  const data = await res.json();

  const text = extractGeminiText(data);

  return text;
}

async function main() {
  try {
    const cityInput = await ask('Enter your city: ');
    const { summary, time, city } = await getWeather(cityInput);
    const prompt = `
      You are a friendly weather assistant. Greet user based on the time of day. Given the weather data, write a short 2-3 sentence warm summary about what kind of day it is.
      
      Add a recommendation to the user based on the weather if it's necessary.  Keep response on one line.

      City: ${city}
      Local time: ${time}
      Weather: ${summary}
      
      Summary:
    `;
    const response = await generateWithGemini(prompt);

    console.log(response);
  } catch (err) {
    console.error('Error:', (err as Error).message);
  } finally {
    rl.close();
  }
}

main();
