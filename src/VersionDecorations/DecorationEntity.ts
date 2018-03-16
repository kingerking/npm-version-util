import * as vscode from 'vscode';
import DecorationManager from './DecorationManager';

/**
 * Will represent a decoration.
*/
export default class DecorationEntity implements vscode.Disposable {
    private _manager: DecorationManager;

    constructor(manager: DecorationManager, text: string)
    {
        this._manager = manager;

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
                contentText: text,
                textDecoration: 'margin: 0 6px 0 6px; padding: 0 6px 0 6px; border-radius: 6px;',
                color: "rgba(0, 0, 0, .5)",
                backgroundColor: "rgba(200, 200, 200, 1)",
                margin: "0 6px 0 6px"
            }
        });    
        // editor.setDecorations(decType, []);
    }

    /** 
     * Clean this up. warning if you wish to delete a decoration on screen 
    */
    public dispose(): void {

    };
}