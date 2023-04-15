/**
 * This script creates a proxy server using http-proxy-middleware to forward incoming requests to a target server.
 *
 * @module proxyServer
 */

require('dotenv').config();

const express = require('express');
const {createProxyMiddleware, responseInterceptor} = require('http-proxy-middleware');

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
 * Default Protocol for target.
 *
 * @constant {string}
 * @default "https"
 */
const DEFAULT_PROTOCOL = process.env.DEFAULT_PROTOCOL || "https";

/**
 * Default response Access-Control-Allow-Methods header value.
 *
 * @constant {string}
 * @default ""
 */
const RESPONSE_ACCESS_CONTROL_ALLOW_METHODS = process.env.RESPONSE_ACCESS_CONTROL_ALLOW_METHODS || "";

/**
 * Default response Access-Control-Allow-Headers header value.
 *
 * @constant {string}
 * @default ""
 */
const RESPONSE_ACCESS_CONTROL_ALLOW_HEADERS = process.env.RESPONSE_ACCESS_CONTROL_ALLOW_HEADERS || "";

/**
 * Default response Access-Control-Allow-Origin header value.
 *
 * @constant {string}
 * @default ""
 */
const RESPONSE_ACCESS_CONTROL_ALLOW_ORIGIN = process.env.RESPONSE_ACCESS_CONTROL_ALLOW_ORIGIN || "";

/**
 * Custom middleware to parse the __request query parameter and store the custom headers.
 *
 * @function
 * @param {import('express').Request} req - The incoming request.
 * @param {import('express').Response} res - The outgoing response.
 * @param {function} next - The next middleware function.
 */
app.use((req, res, next) => {
    const {__request} = req.query;
    const urlParts = req.url.split("/");
    const targetUrl = urlParts[1];

    // Check if the targetUrl is a valid domain
    const domainRegex = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)$/;
    if (!domainRegex.test(targetUrl)) {
        res.status(400).send(`Error. Invalid target URL: ${targetUrl}`);
        return;
    }

    // If it's an OPTIONS request, respond with the CORS headers and a 200 OK status
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }

    req.targetProtocol = (__request && __request['protocol']) ? __request['protocol'] : DEFAULT_PROTOCOL;
    req.proxyTarget = `${req.targetProtocol}://${targetUrl}`;
    req.targetUrl = targetUrl;

    // res.status(200).send(JSON.stringify([
    //     req.targetProtocol, req.proxyTarget, req.targetUrl
    // ]))

    if (__request && __request['header']) {
        req.customHeaders = {};
        for (const [headerKey, headerValues] of Object.entries(__request['header'])) {
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

// Use the proxy middleware
app.use("/", (req, res, next) => {
    const proxyMiddleware = createProxyMiddleware({
        target: req.proxyTarget,
        selfHandleResponse: true,
        changeOrigin: true,
        secure: false,
        xfwd: true,
        onProxyReq(proxyReq, req) {
            // Set custom headers
            if (req['customHeaders']) {
                for (const [headerKey, headerValues] of Object.entries(req['customHeaders'])) {
                    const existingHeader = proxyReq.getHeader(headerKey);
                    const customHeader = headerValues.join("; ");
                    const updatedHeader = existingHeader ? `${existingHeader}; ${customHeader}` : customHeader;
                    proxyReq.setHeader(headerKey, updatedHeader);
                }
            }

            req.url = req.url.slice(req['targetUrl'].length + 1);

            // Remove custom query parameters from the URL
            const parsedUrl = new URL(req.url, req['proxyTarget']);
            for (const [key] of parsedUrl.searchParams.entries()) {
                if (key.startsWith("__request[")) {
                    parsedUrl.searchParams.delete(key);
                }
            }

            proxyReq.path = parsedUrl.pathname + parsedUrl.search;
        },
        onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {

            if (RESPONSE_ACCESS_CONTROL_ALLOW_METHODS.trim().length !== 0) {
                const existingAllowMethods = proxyRes.headers['access-control-allow-methods'] || '';
                const allowMethods = combineHeaders(existingAllowMethods, RESPONSE_ACCESS_CONTROL_ALLOW_METHODS);
                res.setHeader('Access-Control-Allow-Methods', allowMethods);
            }

            if (RESPONSE_ACCESS_CONTROL_ALLOW_HEADERS.trim().length !== 0) {
                const existingAllowHeaders = proxyRes.headers['access-control-allow-headers'] || '';
                const allowHeaders = combineHeaders(existingAllowHeaders, RESPONSE_ACCESS_CONTROL_ALLOW_HEADERS);
                res.setHeader('Access-Control-Allow-Headers', allowHeaders);
            }

            if (RESPONSE_ACCESS_CONTROL_ALLOW_ORIGIN.trim().length !== 0) {
                res.setHeader('Access-Control-Allow-Origin', RESPONSE_ACCESS_CONTROL_ALLOW_ORIGIN);
            }

            return responseBuffer;
        }),
    });

    return proxyMiddleware(req, res, next);
});

function combineHeaders(existingHeader, customHeader) {
    const existingArray = existingHeader.split(',').map(value => value.trim());
    const customArray = customHeader.split(',').map(value => value.trim());

    const uniqueValues = new Set([...existingArray, ...customArray]);
    return Array.from(uniqueValues).join(', ');
}

/**
 * Start the server on the specified port.
 *
 * @function
 * @param {number} INTERNAL_PORT - The port to listen on.
 */
app.listen(INTERNAL_PORT, () => {
    console.log(`Proxy Server is running on external port ${(ENV === 'prod') ? EXTERNAL_PORT : INTERNAL_PORT}`);
});