import { window, TextEditor, Disposable, ExtensionContext } from 'vscode';



/**
 * Will handle a group of decorations.
*/
export default class DecorationManager implements Disposable {
    /**
     * The local instance of a text editor that this instance manages.
     */
    private _editor: TextEditor;
    private _disposable: Disposable;
    private _isActive: Boolean;

    constructor(context: ExtensionContext, editor: TextEditor)
    {
        this._editor = editor;
        this._isActive = window.activeTextEditor === this._editor;

        const subscriptions: Array<Disposable> = [];
        window.onDidChangeActiveTextEditor(this._onTextEditorChange, this, subscriptions);
        window.onDidChangeTextEditorSelection(this._onSelectionChange, this, subscriptions);
        this._disposable = Disposable.from(...subscriptions);
    }

    /**
     * Active text editor has changed.
     */
    private _onTextEditorChange = (): void => {

    };

    /**
     * When the selection has changed.
     */
    private _onSelectionChange = (): void => {

    };

    /** 
     * Clean up event listener's, etc...
    */
    public dispose()
    {
        
    }
}