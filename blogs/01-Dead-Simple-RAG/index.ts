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

async function getWeather(city: string): Promise<string> {
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

  return `Weather: ${description}, ${temp} C, wind ${wind} km/h`;
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
  console.log({ data });

  const text = extractGeminiText(data);

  return text;
}

async function main() {
  try {
    const city = await ask('Entry your city: ');
    const weatherInfo = await getWeather(city);
    const prompt = `You are a helpful assistant.  Given the weather information below, generate a short summary for a user:\n${weatherInfo}\nSummary:`;
    const response = await generateWithGemini(prompt);

    console.log(response);
  } catch (err) {
    console.error('Error:', (err as Error).message);
  } finally {
    rl.close();
  }
}

main();
