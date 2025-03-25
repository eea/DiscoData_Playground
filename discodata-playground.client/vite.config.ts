import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

// const API_BASE_URL = "http://localhost:5243/";
const API_BASE_URL = "http://jhpre01-w06.pdmz.eea:32243/";
const API_BASE_URL_AI = "http://127.0.0.1:5123";

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

const certificateName = "discodata-playground.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });
}

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    if (0 !== child_process.spawnSync('dotnet', [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password',
    ], { stdio: 'inherit', }).status) {
        throw new Error("Could not create certificate.");
    }
}

const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7018';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin(),  tailwindcss()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
           "/getSchema/": {
                target: API_BASE_URL,
                changeOrigin: true,
                rewrite: (path) => {
                    return path.replace(/^\/getSchema\/(.+)/, "/api/Dremio/GetSchema?origin=$1");
                },
            },
            "/getTable/": {
                target: API_BASE_URL,
                changeOrigin: true,
                rewrite: (path) => {
                    return path.replace(/^\/getTable\/(.+)/, "/api/Dremio/GetTable/$1");
                },
            },
            "/getColumn/": {
                target: API_BASE_URL,
                changeOrigin: true,
                rewrite: (path) => {
                    return path.replace(/^\/getColumn\/([^\/]+)\/([^\/]+)/, "/api/Dremio/GetColumn/$1/$2");
                },
            },
        },
        port: 56149,
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        }
    }
})
