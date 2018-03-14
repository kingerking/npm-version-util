import * as vscode from 'vscode';
import DecorationManager from './DecorationManager';

/**
 * Will represent a decoration.
*/
export default class DecorationEntity implements vscode.Disposable {
    private _manager: DecorationManager;

    constructor(manager: DecorationManager, editor: vscode.TextEditor)
    {
        this._manager = manager;
        const decType: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
            
        });
        editor.setDecorations(decType, []);
    }

    /** 
     * Clean this up. warning if you wish to delete a decoration on screen 
    */
    public dispose(): void {

    };
}