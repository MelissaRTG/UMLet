// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {Uri, workspace} from "vscode";
import * as path from 'path';
import * as fs from "fs";
import * as parser from 'fast-xml-parser';
import * as connecter from 'connect';
import * as serveStatic from 'serve-static';
import {UmletEditorProvider, lastCurrentlyActivePanelPurified, exportCurrentlyActivePanel} from './UmletEditorProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    createUmletCommands(context);
    const portPromise = startWebServer(context);
    portPromise.then(port => {
        console.log("activating umlet extension...");
        UmletEditorProvider.overrideVsCodeCommands(context);
        context.subscriptions.push(vscode.window.registerCustomEditorProvider(
            "uxfCustoms.umletEditor",
            new UmletEditorProvider(context, port),
            {
                webviewOptions: {retainContextWhenHidden: true}
            }
        ));
    });
}

export function deactivate() {
    stopWebServer();
}

async function startWebServer(context: vscode.ExtensionContext): Promise<number> {
    const pomString = fs.readFileSync(context.extensionPath + '/pom.xml').toString();
    const pom = parser.parse(pomString);
    const buildFolder = pom.project['artifactId'] + '-' + pom.project.parent['version'];
    const onDiskPath = path.join(context.extensionPath, 'target', buildFolder);

    const server = connecter()
        .use(serveStatic(onDiskPath.replace('\\', '/')))
        .listen(0);
    // @ts-ignore
    return server.address()?.port;
}

function stopWebServer() {
    connecter().removeAllListeners();
}

function createUmletCommands(context: vscode.ExtensionContext) {
    //Register Commands for exporting in default and x4 size
    //x1 Size
    const commandHandlerExportPng = () => {
        exportCurrentlyActivePanel?.webview.postMessage({
            command: 'requestExportPng',
            text: workspace.getConfiguration('umlet').get('exportScale')
        });
    };
    context.subscriptions.push(vscode.commands.registerCommand('umlet.exportPng', commandHandlerExportPng));

    const commandHandlerExportPdf = () => {
        exportCurrentlyActivePanel?.webview.postMessage({
            command: 'requestExportPdf'
        });
    };
    context.subscriptions.push(vscode.commands.registerCommand('umlet.exportPdf', commandHandlerExportPdf));

    //create a new file and open it in editor
    const commandHandlerCreateNewDiagram = () => {
        let folderPath = vscode.workspace.rootPath;
        if (folderPath === undefined) {
            vscode.window.showErrorMessage("Unable to create new .uxf file, since there is currently no folder/workspace opened. Please open a folder/workspace and try again!");
            return;
        }
        let fileName = "Diagram " + getCurrentDateTimeString() + ".uxf";

        let completePath = path.join(folderPath, fileName);

        fs.writeFile(completePath, "", function (err) {
            if (err) {
                return console.log(err);
            }
        });
        let url = Uri.file(completePath);
        /*
          note: this does not guarantee the new file is opened with UMLet, but currently there does not seem to be an option to tell vscode to open a file with a certain editor.
          VSCode prefers Custom Editors over its built-in editors, but especially if the extention is not fully loaded yet, vscode might open this file as plaintext.
          To prevent this case "onStartupFinished" is a startup event for umlet, so the probability that the umlet extension is not loaded when a user calls the command is greatly reduced.
          if other .uxf extensions are installed, vscode might not open the newly created file with UMLet as well, and has to be manually reopened in UMLet
        */
        vscode.commands.executeCommand('vscode.open', url);
    };
    context.subscriptions.push(vscode.commands.registerCommand('umlet.createNewDiagram', commandHandlerCreateNewDiagram));

    const commandHandlerZoomIn = () => {
        exportCurrentlyActivePanel?.webview.postMessage({
            command: 'zoomIn'
        });
    };
    context.subscriptions.push(vscode.commands.registerCommand('umlet.zoomIn', commandHandlerZoomIn));

    const commandHandlerZoomOut = () => {
        exportCurrentlyActivePanel?.webview.postMessage({
            command: 'zoomOut'
        });
    };
    context.subscriptions.push(vscode.commands.registerCommand('umlet.zoomOut', commandHandlerZoomOut));

    const commandHandlerZoomReset = () => {
        exportCurrentlyActivePanel?.webview.postMessage({
            command: 'zoomReset'
        });
    };
    context.subscriptions.push(vscode.commands.registerCommand('umlet.zoomReset', commandHandlerZoomReset));

    function getCurrentDateTimeString(): string {
        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0');
        let yyyy = today.getFullYear();

        let hh = String(today.getHours()).padStart(2, '0');
        let mins = String(today.getMinutes()).padStart(2, '0');
        let ss = String(today.getSeconds()).padStart(2, '0');

        return ("" + yyyy + "-" + mm + "-" + dd + " " + hh + "-" + mins + "-" + ss);
    }
}
