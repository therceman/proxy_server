# Proxy Server

A simple Node.js proxy server using Express and http-proxy-middleware.

## Requirements

### PROD

1. Docker (min version 20.10.23, build 7155243)

### DEV

1. Node.js v18.7.0
2. npm 8.18.0

## Configuration

Run `make configure` (this will copy .env.example to .env).
After that, you can edit the `.env` file as needed.

## Usage

Run `make run`

## Development

Run `make dev`

## Examples

1. To make a request to www.example.com and set a custom request cookie named 'temp' (e.g., Cookie: temp=qwe;), while keeping the original query parameter untouched, use the following URL:

```html
http://localhost:2375/www.example.com/?original=text&__request[header][Cookie][temp]=qwe
```

P.S. Replace port 2375 with 3333 if you are in development mode (`make dev`).
