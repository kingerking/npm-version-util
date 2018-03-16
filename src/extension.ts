'use strict';
import * as vscode from 'vscode';
import DecorationManager from './VersionDecorations/DecorationManager';


function moduleName(reg: RegexpCluster, data: string): string
{
    let match;
    while (match = reg.exec(data))
        if (match[0]) return match[0].replace(/['\"]/g, "");    
    return null;
}


/**
 * Will search package.json and find the module name and version.
 * @param name 
 */
function _getVersion(name: string, context: vscode.ExtensionContext): string {
    let directory = context.asAbsolutePath('/package.json');
    const data = require(directory) as { dependencies: Object, devDependencies: Object };

    if (!data.dependencies[name] || !data.devDependencies[name])
        return "Not installed";    
    return data.dependencies[name] || data.devDependencies[name];
}


export function activate(context: vscode.ExtensionContext) {

    console.log('NPM version utility loaded.');

    const currentEditor: vscode.TextEditor = vscode.window.activeTextEditor;
    const decorationManager: DecorationManager = new DecorationManager(context, currentEditor);

    
    vscode.window.onDidChangeTextEditorSelection(event => {
        // const regexp = new RegexpCluster(/require\(.*"/g, /require\(.*'/g, /import.*from.*'/g, /import.*from.*"/g);
        
        const results: Array<QueryResult> = new DocumentQuery(
            new RegexpCluster(/require\(.*"/g, /require\(.*'/g, /import.*from.*'/g, /import.*from.*"/g)).exec(event.textEditor.document);    
        
        
        
        event.textEditor.setDecorations(decoration, []);
        let match;
        let ranges: Array<vscode.Range> = [];

        for (const result of results) { 
            const { Position, Range } = vscode;
            const { match, range, lineData } = result;
            const { end } = range;
            const target = new Range(new Position(end.line, end.character), new Position(end.line, end.character));
            const name = moduleName(new RegexpCluster(/'.*'/, /".*"/), lineData);
            const decorationMessage: string = !name ? "No module name" : _getVersion(name, context);
            if (!name)
            {
                console.log("module not defined: ", name)
            }    
            ranges.push(target);
        } 
        currentEditor.setDecorations(decoration, ranges);
     });
    
    
}

class QueryResult {

    private _master: DocumentQuery;
    private _match: any;
    private _at: vscode.Range;
    private _lineData: string;

    constructor(queryMaster: DocumentQuery, match: any, line: string, at: vscode.Range) { 
        this._at = at;
        this._master = queryMaster;
        this._lineData = line;
        this._match = match;
    }

    public get range() { return this._at };
    public get match() { return this._match };
    public get lineData() { return this._lineData}

}

class DocumentQuery {
    // what to query.
    private _regexp: RegexpCluster | RegExp;
    private _lines: Array<string> = [];

    /**
     * 
     * @param regexp The regexp to Query for instances of a given occurence.
     * @param textExtractionQuery Extraction regexp to extract text from the results
     */
    constructor(regexp: RegexpCluster | RegExp)
    {
        this._regexp = regexp;
    }


    /**
     * Run the query and get some results
     */
    public exec = (doc: vscode.TextDocument, text: string = doc.getText()): Array<QueryResult> => {
        this._lines = text.split("\n");
        const buffer: Array<QueryResult> = [];
        let match;
        while (match = this._regexp.exec(text))
        {
            let pos = doc.positionAt(match.index);
            let endPos = doc.positionAt(match.index + match[0].length);
            const line: string = this._lines[pos.line];
            let inst = new QueryResult(this, match, line, new vscode.Range(pos, endPos));
            buffer.push(inst);
        }    
        return buffer;
    };
}

/**
 * Combine multible regexp's
 */
class RegexpCluster {
    private _regexps: Array<RegExp>;
    private current: number = 0;
    public get cluster() {return this._regexps}
    constructor(...regexps: Array<RegExp>)
    {
        this._regexps = regexps;
    }

    public exec(text: string) { 
        let inst = this._regexps[this.current].exec(text);
        if (!inst) {
            this.current++;
            if ((this._regexps.length - 1) < this.current) // end
                return undefined;    
            return this.exec(text);
        }
        return inst;
    }
}

export function deactivate() {
}