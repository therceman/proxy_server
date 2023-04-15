configure:
	cp .env.example .env

run:
	docker compose up -d --build && sleep 1 && docker logs proxy_server

dev:
	npm install && npm run dev