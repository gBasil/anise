import { Menu, Plugin, TFile, addIcon } from 'obsidian';
import { LinkConverterSettingsTab, LinkConverterPluginSettings, DEFAULT_SETTINGS } from './settings';
import { ConfirmationModal, FolderSuggestionModal } from 'modals';
import * as Converter from 'converter';
import * as Icons from './icons';

export default class LinkConverterPlugin extends Plugin {
    settings: LinkConverterPluginSettings;

    async onload() {
        console.log('Link Converter Loading...');

        addIcon('bracketIcon', Icons.BRACKET_ICON);
        addIcon('markdownIcon', Icons.MARKDOWN_ICON);
        addIcon('linkEditIcon', Icons.LINK_EDIT_ICON);

        await this.loadSettings();
        this.addSettingTab(new LinkConverterSettingsTab(this.app, this));

        this.addCommand({
            id: 'convert-wikis-to-md-in-active-file',
            name: 'Active File: Links to Markdown',
            callback: () => {
                Converter.convertLinksInActiveFile(this, 'markdown');
            },
        });

        this.addCommand({
            id: 'convert-wikis-to-md-in-vault',
            name: 'Vault: Links to Markdown',
            callback: () => {
                let infoText = 'Are you sure you want to convert all Wikilinks to Markdown Links?';
                let modal = new ConfirmationModal(this.app, infoText, () => Converter.convertLinksInVault(this, 'markdown'));
                modal.open();
            },
        });

        if (this.settings.contextMenu) this.app.workspace.on('file-menu', this.addFileMenuItems);
    }

    onunload() {
        console.log('Link Converter Unloading...');
        this.app.workspace.off('file-menu', this.addFileMenuItems);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		// this.settings.finalLinkFormat = 'absolute-path';
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    addFileMenuItems = (menu: Menu, file: TFile) => {
        if (!(file instanceof TFile && file.extension === 'md')) return;

        menu.addSeparator();

        menu.addItem((item) => {
            item.setTitle('Markdown Links to Wiki')
                .setIcon('bracketIcon')
                .onClick(() => Converter.convertLinksAndSaveInSingleFile(file, this, 'wiki'));
        });

        menu.addItem((item) => {
            item.setTitle('WikiLinks to Markdown')
                .setIcon('markdownIcon')
                .onClick(() => Converter.convertLinksAndSaveInSingleFile(file, this, 'markdown'));
        });

        if (this.settings.finalLinkFormat !== 'not-change') {
            let finalFormat = this.settings.finalLinkFormat;
            menu.addItem((item) => {
                item.setTitle(`All Links to ${finalFormat === 'absolute-path' ? 'Absolute Path' : finalFormat === 'shortest-path' ? 'Shortest Path' : 'Relative Path'}`)
                    .setIcon('linkEditIcon')
                    .onClick(() => Converter.convertLinksInFileToPreferredFormat(file, this, finalFormat));
            });
        }

        menu.addSeparator();
    };
}
