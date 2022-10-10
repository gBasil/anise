import type { Folder } from '@components/Folder.astro';
import { lstatSync, readdirSync } from 'fs';
import path from 'path';

const scan = (folder: string): Folder => {
	// List of non-hidden files & folders
	const list = readdirSync(folder).filter(
		(file) => !path.parse(file).name.startsWith('.')
	);

	// List of markdown files
	const files = list.filter(
		(file) => path.parse(file).ext.toLowerCase() === '.md'
	);

	// List of folders
	const folders = list.filter((file) =>
		lstatSync(path.join(folder, file)).isDirectory()
	);

	return {
		// Name of the current folder
		name: path.parse(folder).name,
		files,
		// Recursively check all folders
		folders: folders.map((file) => scan(path.join(folder, file))),
	};
};

export default scan;
