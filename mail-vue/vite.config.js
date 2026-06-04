import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), 'VITE')
    return {
        server: {
            host: true,
            port: 3001,
            hmr: true,
        },
        base: env.VITE_STATIC_URL || '/',
        plugins: [vue(),
            VitePWA({
                injectRegister: 'script-defer',
                manifest: {
                    name: 'Panorama Scholarly Group Mail',
                    short_name: env.VITE_PWA_NAME,
                    description: 'PSG Mail — Panorama Scholarly Group internal email',
                    background_color: '#111111',
                    theme_color: '#111111',
                    display: 'standalone',
                    start_url: '/',
                    icons: [
                        {
                            src: 'pwa-192.png',
                            sizes: '192x192',
                            type: 'image/png',
                        },
                        {
                            src: 'pwa-512.png',
                            sizes: '512x512',
                            type: 'image/png',
                        },
                        {
                            src: 'pwa-maskable-512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'maskable',
                        },
                    ],
                },
                workbox: {
                    disableDevLogs: true,
                    globPatterns: [],
                    runtimeCaching: [],
                    navigateFallback: null,
                    cleanupOutdatedCaches: true,
                }
            }),
            AutoImport({
                resolvers: [ElementPlusResolver()],
            }),
            Components({
                resolvers: [ElementPlusResolver()],
            })
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src')
            }
        },
        build: {
            target: 'es2022',
            outDir: env.VITE_OUT_DIR || 'dist',
            emptyOutDir: true,
            assetsInclude: ['**/*.json'],
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        // ECharts gets its own cacheable chunk
                        if (id.includes('node_modules/echarts') || id.includes('node_modules/zrender')) {
                            return 'vendor-echarts';
                        }
                        // Element Plus UI in its own chunk
                        if (id.includes('node_modules/element-plus') || id.includes('node_modules/@element-plus')) {
                            return 'vendor-element-plus';
                        }
                        // Vue core
                        if (id.includes('node_modules/vue') || id.includes('node_modules/@vue') || id.includes('node_modules/pinia')) {
                            return 'vendor-vue';
                        }
                        // VueUse utilities
                        if (id.includes('node_modules/@vueuse')) {
                            return 'vendor-vueuse';
                        }
                        // Iconify icon runtime
                        if (id.includes('node_modules/@iconify')) {
                            return 'vendor-iconify';
                        }
                        // Date/time utilities
                        if (id.includes('node_modules/dayjs')) {
                            return 'vendor-dayjs';
                        }
                    }
                }
            }
        }
    }
})
