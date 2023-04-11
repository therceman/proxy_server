# Proxy Server
A simple Node.js proxy server using Express nad http-proxy-middleware

## Requirements

1) Docker (min version 20.10.23, build 7155243)

## Configuration

Create new .env file with the following content:

```dotenv
EXTERNAL_PORT=3333
TARGET_URL=https://example.com
```

Replace `https://example.com` with your desired domain

## Usage

Run `make run` or `docker compose up --build`