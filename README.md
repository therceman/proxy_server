# Proxy Server
A simple Node.js proxy server using Express and http-proxy-middleware

## Requirements

### PROD

1) Docker (min version 20.10.23, build 7155243)

### DEV

1) node v18.7.0
2) npm 8.18.0

## Configuration

Run `cp .env.example .env` or create a new .env file with the following content:

```dotenv
EXTERNAL_PORT=2375
INTERNAL_PORT=3333
TARGET_URL=https://example.com
```

Open `.env` and replace `https://example.com` with your desired domain

## Usage

Run `make run` or `docker compose up --build`

## Examples

1) Set custom request cookie named temp (e.g. Cookie: temp=qwe;). Original query param will be untouched
```html
https://proxy.com/?original=text&__request[header][Cookie][temp]=qwe
```

