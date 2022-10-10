import { visit } from 'unist-util-visit';
import { join, parse } from 'path';
import { readFileSync } from 'fs';
import { cwd } from 'process';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

const formatURL = (url) =>
	`${url.startsWith('#') ? '' : '/'}${url.replaceAll('/', ':')}`;

export function addLayout() {
	// All remark and rehype plugins return a separate function
	return function (tree) {
		// Link tweaks to make them work
		visit(tree, 'link', (node) => {
			if (node.children.length !== 1) return;

			try {
				// If external URL, add outgoing symbol
				new URL(node.url);
				node.children[0].value += ' 🔗';
			} catch {
				// If not external URL, then make it route properly
				// Only include slash if we're linking to another page
				node.url = formatURL(node.url);
			}
		});

		// Make anchors work
		const anchorRegex = /^(.+) (\^\w+)$/;
		visit(tree, 'paragraph', (node) => {
			// Get the last text item if it has an anchor
			const text = node.children.find(
				(node) => node.type === 'text' && anchorRegex.test(node.value)
			);

			if (!text) return;

			const [_, newText, anchor] = text.value.match(anchorRegex);

			// Remove the anchor from the text
			text.value = newText;

			// Give the parent paragraph element the anchor id
			node.data = node.data || {};
			node.data.hProperties = node.data.hProperties || {};
			node.data.hProperties.id = anchor;
		});

		visit(tree, 'image', (node) => {
			if (parse(node.url).ext) return;

			try {
				// If external URL, add outgoing symbol
				new URL(node.url);
			} catch {
				// Definitely not a URL. Try embedding it.
				const match = node.url.match(/^(.+)#\^(\w+)$/);

				// Might be better to handle this and show a link instead of a dead image.
				// That's currently the case for external images, I think
				if (!match) return;

				try {
					// Find the referenced line
					const file = readFileSync(
						join(cwd(), './vault', `${match[1]}.md`),
						'utf8'
					);
					const lines = file.split(/\n{2,}/g);
					const line = lines.find((line) =>
						line.endsWith(` ^${match[2]}`)
					);

					if (!line) return;

					// Remove the anchor from the text
					const clean = line.split(' ^').slice(0, -1).join(' ^');

					// Parse syntax tree
					const parsed = unified().use(remarkParse).parse(clean);

					// In case of an error, just link to the page
					if (!parsed.children.length) {
						node.type = 'link';
						node.url = formatURL(node.url);

						return;
					}

					// Set the content to be the linked page
					node.type = parsed.children[0].type;
					node.children = parsed.children[0].children;
					node.children.push({
						type: 'link',
						url: formatURL(node.url),
						children: [
							{
								type: 'text',
								value: node.url,
							},
						],
					});

					// Give the element a class so we can style it
					node.data = node.data || {};
					node.data.hProperties = node.data.hProperties || {};
					node.data.hProperties.class = 'page-embed';
				} catch (e) {
					console.error('Error embedding', e);
				}
			}
		});
	};
}
