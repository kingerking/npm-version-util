'use strict';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log('NPM version utility loaded.');

    const currentEditor: vscode.TextEditor = vscode.window.activeTextEditor;
    const darkBackground: string = "rgba(60, 60, 60, .8)";
    const lightBackground: string = "rgba(155, 155, 155, .8)";
    
    const decoration: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        dark: {
            after: {
                backgroundColor: "rgba(48,48,48,.8)",
                color: "rgba(155, 155, 155, .8)",
            }
        },
        after: {
            contentText: "Hello world :)",
            textDecoration: 'margin: 0 6px 0 6px; padding: 0 6px 0 6px; border-radius: 6px;',
            color: "rgba(0, 0, 0, .5)",
            backgroundColor: "rgba(200, 200, 200, 1)",
        }
    });    

    currentEditor.setDecorations(decoration, [new vscode.Range(new vscode.Position(1, 1), new vscode.Position(1, 1))]);
}


export function deactivate() {
}