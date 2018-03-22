'use strict';
import * as vscode from 'vscode';
import { TextEditorDecorationType } from 'vscode';
import { join } from 'path';
import { readFileSync, statSync, readdirSync } from 'fs';
import { merge } from 'lodash';

const darkBackground: string = "rgba(60, 60, 60, .8)";
const lightBackground: string = "rgba(155, 155, 155, .8)";


let ranges: Array<vscode.Range> = [];
let decorations: Array<vscode.TextEditorDecorationType> = [];

function moduleName(reg: RegexpCluster, data: string, skipOccurrences: number = 0): string
{
    let match: any, i: number = 0;
    while (match = reg.exec(data))
    {
        if (i++ < skipOccurrences) 
            continue;
        const name = match[0].replace(/['\"]/g, "");
        if (match[0])
            return name;    
    }
    return null;
}



/**
 * Createa  text editor decoration type
 */
function _createDecorationType(text: string): TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
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
    });   ;
}

export interface IPackageJsonDef {
    dependencies?: Object;
    devDependencies?: Object;
    version?: string;
}

function _getPackageJSONObject(folderPath: vscode.WorkspaceFolder) {
    const path = join(folderPath.uri.path, 'package.json');
    const obj = JSON.parse(readFileSync(path).toString('utf-8'));
    return obj;
}

/**
 * 
 * @param name determine weather or not is a native module.
 */
function _nativeModule(name: string): string {
    const natives: Array<string> = Object.keys((process as any).binding('natives'));
    for (const native of natives)
        if (native == name)
            return `Node ${process.version}`;    
    return null;    
}



function _localModule(name: string, packageJSON: IPackageJsonDef): string {
    if (name[0] == '.')
        return `Local v${packageJSON.version || "No version field"}`;
    return null;
}

/**
 * Will search package.json and find the module name and version.
 * @param name 
 */
function _getVersion(name: string): string {
    const data: IPackageJsonDef = { dependencies: {}, devDependencies: {} };
    const packageJsons: Array<IPackageJsonDef> = [];
    // require all package.json's present, then load the data array.
    for (const folder of vscode.workspace.workspaceFolders)
    {
        const packageJSON = _getPackageJSONObject(folder) as IPackageJsonDef;
        packageJsons.push(packageJSON);
        if (packageJSON.dependencies)
            data.dependencies = merge(data.dependencies, packageJSON.dependencies);
        if (packageJSON.devDependencies)
            data.devDependencies = merge(data.devDependencies, packageJSON.devDependencies);
    }
    const native = _nativeModule(name);
    const local = (() => {
        for (const packageJSON of packageJsons)
        {
            const v = _localModule(name, packageJSON);
            if (v) return v;
        }
        return null;
    })();
    if (!data.dependencies[name] && !data.devDependencies[name] && !native && !local)
        return "Not installed";    
    return data.dependencies[name] || data.devDependencies[name] || native || local;
}

function _updateVersions(editor: vscode.TextEditor) {
    // const regexp = new RegexpCluster(/require\(.*"/g, /require\(.*'/g, /import.*from.*'/g, /import.*from.*"/g);

    const results: Array<QueryResult> = new DocumentQuery(
        new RegexpCluster(/require\(\".*?"\)/g, /require\(\'.*?'\)/g, /import.*from.*'/g, /import.*from.*"/g)).exec(editor.document);

    let match;
    // remove all instances of the given decoration
    // for (const dec of decorations)
    //     dec.dispose();    
    for (let i = 0; i < decorations.length; i++)
        editor.setDecorations(decorations[i], []);

    if (ranges.length !== 0) ranges = [];
    if (decorations.length !== 0) decorations = [];

    const lines: Array<number> = [];

    for (const result of results) {
        const { Position, Range } = vscode;

        const { match, range, lineData } = result;
        const { end, start } = range;
        let skip = 0;
        if (lines.indexOf(end.line) == -1)
            lines.push(end.line);
        else continue;
        const target = new Range(new Position(end.line, start.character == 0 ? start.character : start.character - 1), new Position(end.line, end.character - 1));
        const lineQuery: RegexpCluster = new RegexpCluster(/'.*?'/g, /".*?"/g);
        const name = moduleName(lineQuery, lineData, skip);
        const decorationMessage: string = !name ? "Not installed" : _getVersion(name);
        // if (!name) console.log("module not defined: ", name);

        decorations.push(_createDecorationType(decorationMessage));
        ranges.push(target);
    }


    for (let i = 0; i < decorations.length; i++)
        editor.setDecorations(decorations[i], [ranges[i]]);   
}

export function activate(context: vscode.ExtensionContext) {
    console.log('NPM version utility loaded.');
    vscode.window.onDidChangeTextEditorSelection(event => _updateVersions(event.textEditor));
    vscode.window.onDidChangeActiveTextEditor(event => event ? _updateVersions(event) : () => { });

    // default with active.
    _updateVersions(vscode.window.activeTextEditor);
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