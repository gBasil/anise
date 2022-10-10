import { defineConfig } from 'astro/config';
import { addLayout } from './src/plugins/addLayout';

// https://astro.build/config
export default defineConfig({
	markdown: {
		remarkPlugins: [addLayout],
		extendDefaultPlugins: true,
	},
	build: {
		format: 'file',
	},
});
