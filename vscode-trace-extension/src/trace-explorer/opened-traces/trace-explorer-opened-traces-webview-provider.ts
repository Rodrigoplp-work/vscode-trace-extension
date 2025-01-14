import * as vscode from 'vscode';
import { TraceViewerPanel } from '../../trace-viewer-panel/trace-viewer-webview-panel';
import { getTspClientUrl, getTraceServerUrl } from '../../utils/tspClient';
import { signalManager, Signals } from 'traceviewer-base/lib/signals/signal-manager';
import { Experiment } from 'tsp-typescript-client/lib/models/experiment';
import { OpenedTracesUpdatedSignalPayload } from 'traceviewer-base/lib/signals/opened-traces-updated-signal-payload';
import JSONBigConfig from 'json-bigint';
import { convertSignalExperiment } from 'vscode-trace-extension/src/common/signal-converter';

const JSONBig = JSONBigConfig({
    useNativeBigInt: true,
});

export class TraceExplorerOpenedTracesViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'traceExplorer.openedTracesView';

	private _view?: vscode.WebviewView;
	private _disposables: vscode.Disposable[] = [];

   	constructor(
		private readonly _extensionUri: vscode.Uri,
	) {}

	private _onOpenedTracesWidgetActivated = (experiment: Experiment): void => this.doHandleTracesWidgetActivatedSignal(experiment);
	private _onOpenedTracesChanged = (payload: OpenedTracesUpdatedSignalPayload): void => this.doHandleOpenedTracesChangedSignal(payload);

	protected doHandleTracesWidgetActivatedSignal(experiment: Experiment): void {
	    if (this._view && experiment) {
	        const wrapper: string = JSONBig.stringify(experiment);
	        this._view.webview.postMessage({command: 'traceViewerTabActivated', data: wrapper});
	    }
	}
	protected doHandleOpenedTracesChangedSignal(payload: OpenedTracesUpdatedSignalPayload): void {
	    if (this._view && payload) {
	        this._view.webview.postMessage({command: 'openedTracesUpdated', numberOfOpenedTraces: payload.getNumberOfOpenedTraces()});
	    }
	}

	public resolveWebviewView(
	    webviewView: vscode.WebviewView,
	    _context: vscode.WebviewViewResolveContext,
	    _token: vscode.CancellationToken,
	): void {
	    this._view = webviewView;

	    webviewView.webview.options = {
	        // Allow scripts in the webview
	        enableScripts: true,

	        localResourceRoots: [
	            vscode.Uri.joinPath(this._extensionUri, 'pack')
	        ]
	    };

	    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

	    // Handle messages from the webview
	    webviewView.webview.onDidReceiveMessage(message => {
	        switch (message.command) {
	        case 'webviewReady':
	            // Post the tspTypescriptClient
	            webviewView.webview.postMessage({command: 'set-tspClient', data: getTspClientUrl()});
	            return;
	        case 'reopenTrace':
	            if (message.data && message.data.wrapper) {
	                const experiment = convertSignalExperiment(JSONBig.parse(message.data.wrapper));
	                const panel = TraceViewerPanel.createOrShow(this._extensionUri, experiment.name);
	                panel.setExperiment(experiment);
	            }
	            return;
	        case 'closeTrace':
	            if (message.data && message.data.wrapper) {
	                TraceViewerPanel.disposePanel(this._extensionUri, JSONBig.parse(message.data.wrapper).name);
	            }
	            return;
	        case 'deleteTrace':
	            if (message.data && message.data.wrapper) {
	                // just remove the panel here
	                TraceViewerPanel.disposePanel(this._extensionUri, JSONBig.parse(message.data.wrapper).name);
	            }
	            return;
	        case 'experimentSelected': {
	            if (message.data && message.data.wrapper) {
	                signalManager().fireExperimentSelectedSignal(convertSignalExperiment(JSONBig.parse(message.data.wrapper)));
	            }
	        }
	        }
	    }, undefined, this._disposables);
	    signalManager().on(Signals.TRACEVIEWERTAB_ACTIVATED, this._onOpenedTracesWidgetActivated);
	    signalManager().on(Signals.OPENED_TRACES_UPDATED, this._onOpenedTracesChanged);
	    webviewView.onDidDispose(_event => {
	        signalManager().off(Signals.TRACEVIEWERTAB_ACTIVATED, this._onOpenedTracesWidgetActivated);
	        signalManager().off(Signals.OPENED_TRACES_UPDATED, this._onOpenedTracesChanged);
	    }, undefined, this._disposables);
	}

	/* eslint-disable max-len */
	private _getHtmlForWebview(webview: vscode.Webview) {
	    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
	    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'pack', 'openedTracesPanel.js'));

	    // Use a nonce to only allow a specific script to be run.
	    const nonce = getNonce();

	    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<meta name="theme-color" content="#000000">
				<title>React App</title>
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}' 'unsafe-eval';style-src vscode-resource: 'unsafe-inline' http: https: data:;connect-src ${getTraceServerUrl()};">
				<base href="${vscode.Uri.joinPath(this._extensionUri, 'pack').with({ scheme: 'vscode-resource' })}/">
			</head>

			<body>
				<noscript>You need to enable JavaScript to run this app.</noscript>
				<div id="root"></div>

				<script nonce="${nonce}">
					const vscode = acquireVsCodeApi();
				</script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
