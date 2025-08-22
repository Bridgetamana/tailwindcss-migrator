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
        const config = vscode.workspace.getConfiguration('tailwindMigrator');
        const showDiff = config.get('showDiff', true);
        const dryRun = config.get('dryRun', false);
        const customRules = config.get('customRules', []);
        let originalText = editor.document.getText();
        let convertedText: string;
        try {
            convertedText = await TailwindMigrator.convert(originalText, true, customRules);
        } catch (error) {
            vscode.window.showErrorMessage(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Migration error:', error);
            return;
        }
        let targetEditor: vscode.TextEditor | undefined = undefined;
        if (showDiff || dryRun) {
            const leftUri = editor.document.uri;
            const rightUri = vscode.Uri.parse(`untitled:Converted-${editor.document.fileName}`);
            await vscode.workspace.openTextDocument(rightUri).then(async doc => {
                const edit = new vscode.WorkspaceEdit();
                edit.insert(rightUri, new vscode.Position(0, 0), convertedText);
                await vscode.workspace.applyEdit(edit);
                await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, 'Tailwind Migration Preview');
            });
            if (dryRun) {
                vscode.window.showInformationMessage('Dry-run: No changes applied.');
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                return;
            }
            const confirm = await vscode.window.showWarningMessage('Apply migration changes?', { modal: true }, 'Yes', 'No');
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            if (confirm !== 'Yes') {
                vscode.window.showInformationMessage('Migration cancelled.');
                return;
            }
            targetEditor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === editor.document.uri.toString());
            if (!targetEditor) {
                await vscode.window.showTextDocument(editor.document, { preview: false });
                targetEditor = vscode.window.activeTextEditor;
            }
        } else {
            targetEditor = editor;
        }
        try {
            const document = targetEditor ? targetEditor.document : editor.document;
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(originalText.length)
            );
            const workspaceEdit = new vscode.WorkspaceEdit();
            workspaceEdit.replace(document.uri, fullRange, convertedText);
            await vscode.workspace.applyEdit(workspaceEdit);
            const undoAction = 'Undo';
            vscode.window.showInformationMessage('Successfully converted to Tailwind CSS v4!', undoAction).then(async (selected) => {
                if (selected === undoAction) {
                    const undoEdit = new vscode.WorkspaceEdit();
                    undoEdit.replace(document.uri, fullRange, originalText);
                    await vscode.workspace.applyEdit(undoEdit);
                    vscode.window.showInformationMessage('Undo: File reverted to its previous state.');
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to apply migration: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Apply migration error:', error);
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

    context.subscriptions.push(convertCommand, saveHandler, colorProvider);
}

export function deactivate() { }