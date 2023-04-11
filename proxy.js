require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.INTERNAL_PORT || 3000;
const EXTERNAL_PORT = process.env.EXTERNAL_PORT || 3000;
const TARGET_URL = process.env.TARGET_URL;

if (!TARGET_URL) {
    console.error('TARGET_URL environment variable not set.');
    process.exit(1);
}

app.use(
    '/',
    createProxyMiddleware({
        target: TARGET_URL,
        changeOrigin: true,
        secure: false,
        xfwd: true, // Enable forwarding of user IP
    })
);

app.listen(PORT, () => {
    console.log(`Proxy Server is running on external port ${EXTERNAL_PORT}`);
});
