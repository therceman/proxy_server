/**
 * This script creates a proxy server using http-proxy-middleware to forward incoming requests to a target server.
 *
 * @module proxyServer
 */

require('dotenv').config();

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

/**
 * The current environment (prod, dev, test).
 *
 * @constant {string}
 */
const ENV = process.env.NODE_ENV || 'prod';

/**
 * The internal port to listen on.
 *
 * @constant {number}
 */
const INTERNAL_PORT = parseInt(process.env.INTERNAL_PORT) || 3000;

/**
 * The external port to listen on.
 *
 * @constant {number}
 */
const EXTERNAL_PORT = parseInt(process.env.EXTERNAL_PORT) || 3000;

/**
 * The target URL to forward requests to.
 *
 * @constant {string}
 */
const TARGET_URL = process.env.TARGET_URL;

if (!TARGET_URL) {
    console.error('TARGET_URL environment variable not set.');
    process.exit(1);
}

/**
 * Custom middleware to parse the __request query parameter and store the custom headers.
 *
 * @function
 * @param {import('express').Request} req - The incoming request.
 * @param {import('express').Response} res - The outgoing response.
 * @param {function} next - The next middleware function.
 */
app.use((req, res, next) => {
    const { __request } = req.query;
    if (__request && __request.header) {
        req.customHeaders = {};
        for (const [headerKey, headerValues] of Object.entries(__request.header)) {
            for (const [key, value] of Object.entries(headerValues)) {
                if (!req.customHeaders[headerKey]) {
                    req.customHeaders[headerKey] = [];
                }
                req.customHeaders[headerKey].push(`${key}=${value}`);
            }
        }
    }
    next();
});

/**
 * The proxy configuration object used by the createProxyMiddleware function.
 *
 * @constant {Object}
 */
const proxyConfig = {
    target: TARGET_URL,
    changeOrigin: true,
    secure: false,
    xfwd: true, // Enable forwarding of user IP
    onProxyReq(proxyReq, req) {

        /** Set Custom Headers */

        if (req.customHeaders) {
            for (const [headerKey, headerValues] of Object.entries(req.customHeaders)) {
                const existingHeader = proxyReq.getHeader(headerKey);
                const customHeader = headerValues.join('; ');

                const updatedHeader = existingHeader ? `${existingHeader}; ${customHeader}` : customHeader;
                proxyReq.setHeader(headerKey, updatedHeader);
            }
        }

        /** Remove Custom Query Param from URL */

        const parsedUrl = new URL(proxyReq.path, `${req.protocol}://${req.headers.host}`);
        for (const [key] of parsedUrl.searchParams.entries()) {
            if (key.startsWith('__request[')) {
                parsedUrl.searchParams.delete(key);
            }
        }
        proxyReq.path = parsedUrl.pathname + parsedUrl.search;
    },
};

// Use the proxy middleware
app.use('/', createProxyMiddleware(proxyConfig));

/**
 * Start the server on the specified port.
 *
 * @function
 * @param {number} INTERNAL_PORT - The port to listen on.
 */
app.listen(INTERNAL_PORT, () => {
    console.log(`Proxy Server is running on external port ${(ENV === 'prod') ? EXTERNAL_PORT : INTERNAL_PORT}`);
});