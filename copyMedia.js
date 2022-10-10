import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, parse } from 'path';
import glob from 'tiny-glob';

const files = (await glob('vault/**/*.[!md]*')).filter(file => {
	const { ext } = parse(file);
	if (file.endsWith('.md' ) || !ext || file.match(/^vault.\.obsidian/)) return false;
	
	return true;
});

files.forEach((file) => {
	const path = join('dist', file.replace(/^vault[\/\\]/, ''));
	const parsed = parse(path);
	const { dir } = parsed;
	
	// Not a file
	if (!parsed.ext) return;
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

	copyFileSync(file, path);
});

console.log(`📠 Copied ${files.length} file${files.length === 1 ? '' : 's'}`);
