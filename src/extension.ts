import * as vscode from 'vscode';
import { TailwindMigrator } from './migrator';
import { ColorProvider } from './color-preview';
import { SUPPORTED_LANGUAGES } from './constants';

const IN_PROGRESS = new Set<string>();
const RECENTLY_MIGRATED = new Map<string, number>();
const COOL_DOWN_MS = 3000; 

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
        if (editor.document.uri.scheme !== 'file') {
            vscode.window.showWarningMessage('Please save this file to disk before running Tailwind migration.');
            return;
        }
        const key = editor.document.uri.toString();
        if (IN_PROGRESS.has(key)) {
            vscode.window.showInformationMessage('Tailwind migration already running for this file.');
            return;
        }
        IN_PROGRESS.add(key);
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
            IN_PROGRESS.delete(key);
            return;
        }
        let targetEditor: vscode.TextEditor | undefined = undefined;
        if (showDiff || dryRun) {
            const leftUri = editor.document.uri;
            const rightDoc = await vscode.workspace.openTextDocument({ language: editor.document.languageId, content: convertedText });
            await vscode.commands.executeCommand('vscode.diff', leftUri, rightDoc.uri, 'Tailwind Migration Preview');
            if (dryRun) {
                vscode.window.showInformationMessage('Dry-run: No changes applied.');
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                IN_PROGRESS.delete(key);
                return;
            }
            IN_PROGRESS.delete(key);
            const confirm = await vscode.window.showWarningMessage('Apply migration changes?', { modal: true }, 'Yes', 'No');
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            if (confirm !== 'Yes') {
                vscode.window.showInformationMessage('Migration cancelled.');
                IN_PROGRESS.delete(key);
                return;
            }
            IN_PROGRESS.add(key);
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
            // Mark as recently migrated to avoid immediate auto-convert on save
            RECENTLY_MIGRATED.set(document.uri.toString(), Date.now());
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to apply migration: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Apply migration error:', error);
        } finally {
            IN_PROGRESS.delete(key);
        }
    });

    const migrateWorkspace = vscode.commands.registerCommand('tailwind-migrator.migrateWorkspace', async () => {
        const config = vscode.workspace.getConfiguration('tailwindMigrator');
        const includeGlobs = config.get<string[]>('includeGlobs', ["**/*.{css,pcss,postcss,scss,sass,less}"]);
        const excludeGlobs = config.get<string[]>('excludeGlobs', ["**/node_modules/**", "**/dist/**", "**/out/**"]);
        const customRules = config.get('customRules', [] as any[]);
        const maxKB = config.get<number>('maxFileSizeKB', 1024);

        const uris = new Set<string>();
        for (const pattern of includeGlobs) {
            const files = await vscode.workspace.findFiles(pattern, `{${excludeGlobs.join(',')}}`);
            files.forEach(f => uris.add(f.toString()));
        }
        const allUris = Array.from(uris).map(u => vscode.Uri.parse(u));
        if (allUris.length === 0) {
            vscode.window.showInformationMessage('No files found for migration. Check include/exclude globs in settings.');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Tailwind Migrator: Processing ${allUris.length} file(s)` ,
            cancellable: true,
        }, async (progress, token) => {
            const batchSize = 20;
            let migrated = 0;
            let skipped = 0;
            let unchanged = 0;
            for (let i = 0; i < allUris.length; i += batchSize) {
                if (token.isCancellationRequested) {
                    break;
                }
                const batch = allUris.slice(i, i + batchSize);
                await Promise.all(batch.map(async (uri) => {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    try {
                        const stat = await vscode.workspace.fs.stat(uri);
                        if (stat.size > maxKB * 1024) { skipped++; return; }
                        const doc = await vscode.workspace.openTextDocument(uri);
                        const original = doc.getText();
                        const needs = /@tailwind\s+(base|components|utilities)|@layer\s+base|:root\s*\{|\.dark\s*\{/.test(original);
                        if (!needs && (!Array.isArray(customRules) || customRules.length === 0)) { unchanged++; return; }
                        const converted = await TailwindMigrator.convert(original, true, customRules as any);
                        if (converted === original) { unchanged++; return; }
                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(uri, new vscode.Range(doc.positionAt(0), doc.positionAt(original.length)), converted);
                        await vscode.workspace.applyEdit(edit);
                        migrated++;
                    } catch (e) {
                        skipped++;
                    }
                }));
                progress.report({ increment: Math.min(100, Math.round(((i + batch.length) / allUris.length) * 100)) });
                await new Promise(r => setTimeout(r, 0));
            }
            vscode.window.showInformationMessage(`Tailwind Migrator: ${migrated} migrated, ${unchanged} unchanged, ${skipped} skipped.`);
        });
    });

    const saveHandler = vscode.workspace.onDidSaveTextDocument(async document => {
        const config = vscode.workspace.getConfiguration('tailwindMigrator');
        if (!config.get('autoConvert')) { return; }
        if (!['css','postcss'].includes(document.languageId)) { return; }
        if (document.isUntitled || document.uri.scheme !== 'file') { return; }
        const key = document.uri.toString();
        if (IN_PROGRESS.has(key)) { return; }
        const last = RECENTLY_MIGRATED.get(key) || 0;
        if (Date.now() - last < COOL_DOWN_MS) { return; }
        vscode.commands.executeCommand('tailwind-migrator.convertFile');
    });

    const colorProvider = vscode.languages.registerColorProvider(
        SUPPORTED_LANGUAGES,
        new ColorProvider()
    );

    context.subscriptions.push(convertCommand, migrateWorkspace, saveHandler, colorProvider);
}

export function deactivate() { }