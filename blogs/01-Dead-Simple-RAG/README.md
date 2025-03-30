# 01-dead-simple-rag

This is a minimal example of a Retrieval Augmented Generation (RAG) cli program using:

- Bun
- OpenWeather API to retrieve live weather dat
- Gemini Flash 2.0 model for free LLM calls

To start create your .env file with

```sh
cp .env.example .env
```

Install [bun](https://bun.sh/docs/installation) if you don't have it yet

or use npm

```sh
npm install -g bun
```

Then run the program with

```sh
bun start
```

Provide city name

```sh
Enter your city: Bangkok
```

You should see the weather information for the city you entered.

```sh
Good afternoon! It's a warm day in Bangkok with broken clouds and a temperature of 33.87°C. A light breeze of 5.37 km/h will provide a little relief from the heat. Remember to stay hydrated if you're heading out!
```

Different cities illicit different responses:

```sh
Enter your city: London

Good morning! It's a cloudy start to the day in London with a temperature of 9.44°C and a light breeze. Consider bringing a light jacket if you're heading out.
```
