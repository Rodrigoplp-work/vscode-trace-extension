import { TspClient } from 'tsp-typescript-client/lib/protocol/tsp-client';
import { ExperimentManager } from 'traceviewer-base/lib/experiment-manager';
import { TraceManager } from 'traceviewer-base/lib/trace-manager';
import { ITspClientProvider } from 'traceviewer-base/lib/tsp-client-provider';

export class TspClientProvider implements ITspClientProvider {

    private _tspClient: TspClient;
    private _traceManager: TraceManager;
    private _experimentManager: ExperimentManager;
    // private _listeners: ((tspClient: TspClient) => void)[];

    constructor(traceServerUrl: string
    ) {
        this._tspClient = new TspClient(traceServerUrl);
        this._traceManager = new TraceManager(this._tspClient);
        this._experimentManager = new ExperimentManager(this._tspClient, this._traceManager);
        // this._listeners = [];
        // tspUrlProvider.addTraceServerUrlChangedListener(url => {
        //     this._tspClient = new TspClient(url);
        //     this._traceManager = new TraceManager(this._tspClient);
        //     this._experimentManager = new ExperimentManager(this._tspClient, this._traceManager);
        //     this._listeners.forEach(listener => listener(this._tspClient));
        // });
    }

    public getTspClient(): TspClient {
        return this._tspClient;
    }

    public getTraceManager(): TraceManager {
        return this._traceManager;
    }

    public getExperimentManager(): ExperimentManager {
        return this._experimentManager;
    }

    /**
     * Add a listener for trace server url changes
     * @param listener The listener function to be called when the url is
     * changed
     */
    addTspClientChangeListener(_listener: (tspClient: TspClient) => void): void {
        // this._listeners.push(listener);
    }
}
