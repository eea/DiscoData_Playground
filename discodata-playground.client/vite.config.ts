import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

//const API_BASE_URL_AI = "http://127.0.0.1:5123";


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

const dotnetOrigine = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7018';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const envVars = loadEnv(mode, process.cwd(), '');
    const VITE_API_BASE_URL = envVars.VITE_API_BASE_URL;
    return {
        plugins: [plugin(), tailwindcss()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        server: {
            proxy: {

                "/getCatalog/": {
                    target: VITE_API_BASE_URL,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => {
                        return path.replace(/^\/getCatalog\/(.+)/, "/api/View/GetCatalog?userAdded=$1");
                    },
                },
                "/getSchema/": {
                    target: VITE_API_BASE_URL,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => {
                        return path.replace(/^\/getSchema\/(.+)/, "/api/Dremio/GetSchema?origin=$1");
                    },
                },
                "/getTable/": {
                    target: VITE_API_BASE_URL,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => {
                        return path.replace(/^\/getTable\/(.+)/, "/api/Dremio/GetTable/$1");
                    },
                },
                "/getColumn/": {
                    target: VITE_API_BASE_URL,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => {
                        return path.replace(/^\/getColumn\/([^\/]+)\/([^\/]+)/, "/api/Dremio/GetColumn/$1/$2");
                    },
                },
                '/testQuery': {
                    target: VITE_API_BASE_URL,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => path.replace(/^\/testQuery/, '/api/Dremio/testQuery'),
                },
                '/createView': {
                    target: VITE_API_BASE_URL,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => path.replace(/^\/createView/, '/api/View/CreateView'),
                },
                '/updateView': {
                    target: VITE_API_BASE_URL,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => path.replace(/^\/updateView/, '/api/View/UpdateView'),
                },
                '/deleteView': {
                    target: VITE_API_BASE_URL,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => path.replace(/^\/deleteView\/(.+)/, '/api/View/DeleteView/$1'),
                },
                '/chatgpt/streamchat': {
                    target: dotnetOrigine,
                    changeOrigin: true,
                    secure: false, // If using self-signed certs
                    rewrite: (path) => path.replace(/^\/chatgpt\/streamchat/, '/chatgpt/StreamChat'),
                },
                '/chatgpt/uploadContext': {
                    target: dotnetOrigine,
                    changeOrigin: true,
                    secure: false, // If using self-signed certs
                    rewrite: (path) => path.replace(/^\/chatgpt\/uploadContext/, '/chatgpt/UploadContext'),
                }
            },
            port: 56149,
            https: {
                key: fs.readFileSync(keyFilePath),
                cert: fs.readFileSync(certFilePath),
            }
        }
    };
});