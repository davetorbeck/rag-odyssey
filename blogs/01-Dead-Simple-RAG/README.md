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
Enter your city: London
```

You should see the weather information for the city you entered.

```sh
Retrieved weather: Weather: clear sky, 10 C, wind 4.1 km/h
```
