import { join } from 'node:path'
import { tmpdir } from 'node:os'

export default defineNuxtConfig({
	compatibilityDate: '2024-04-03',
	devtools: { enabled: false },
	router: { options: { sensitive: true } },
	vite: { build: { assetsInlineLimit: 0 } },
	nitro: {
		storage: {
			kvdb: {
				driver: 'fs',
				base: join(tmpdir(), 'editor', 'kvdb')
			}
		},
		compressPublicAssets: false
	},
	ssr: false,
	app: {
		head: {
			link: [{ rel: 'stylesheet', href: `https://cdn.jsdelivr.net/npm/froala-editor@${process.env.VITE_Froala_Version}/css/froala_editor.pkgd.min.css` }],
			script: [{ src: `https://cdn.jsdelivr.net/npm/froala-editor@${process.env.VITE_Froala_Version}/js/froala_editor.pkgd.min.js` }]
		}
	}
})
