import { defineConfig } from 'vite';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
    if (command === 'serve') {
        return {
            server: {
                port: 3002
            }
        }
    } else {
        return {
            base: '/bplus-tree-vis/',
            build: {
                outDir: './',
                assetsInlineLimit: () => true
            }
        }
    }
});
