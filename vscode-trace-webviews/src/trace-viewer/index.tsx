import * as React from 'react';
import * as ReactDOM from 'react-dom';
import TraceViewerContainer from './vscode-trace-viewer-container';
import './index.css';

ReactDOM.render(
    <TraceViewerContainer />,
    (document.getElementById('root') as HTMLElement)
);
