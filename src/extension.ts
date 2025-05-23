import * as vscode from 'vscode';
import { TailwindMigrator } from './migrator';
import { ColorProvider } from './color-preview';
import { SUPPORTED_LANGUAGES } from './constants';  

export function activate(context: vscode.ExtensionContext) {
    const convertCommand = vscode.commands.registerCommand('tailwind-migrator.convertFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            return;
        }
        if (!['css', 'postcss'].includes(editor.document.languageId)) {
            vscode.window.showWarningMessage('Tailwind migration only works with CSS files');
            return;
        }
        try {
            const originalText = editor.document.getText();
            const convertedText = await TailwindMigrator.convert(originalText);
            
            await editor.edit(editBuilder => {
                const fullRange = new vscode.Range(
                    editor.document.positionAt(0),
                    editor.document.positionAt(originalText.length)
                );
                editBuilder.replace(fullRange, convertedText);
            });
            
            vscode.window.showInformationMessage('Successfully converted to Tailwind CSS v4!');
        } catch (error) {
            vscode.window.showErrorMessage(
                `Conversion failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    });

    const saveHandler = vscode.workspace.onDidSaveTextDocument(async document => {
        const config = vscode.workspace.getConfiguration('tailwindMigrator');
        if (config.get('autoConvert') && document.languageId === 'css') {
            vscode.commands.executeCommand('tailwind-migrator.convertFile');
        }
    });

    const colorProvider = vscode.languages.registerColorProvider(
        SUPPORTED_LANGUAGES,
        new ColorProvider()
    );

    context.subscriptions.push(convertCommand, saveHandler);
}

export function deactivate() {}