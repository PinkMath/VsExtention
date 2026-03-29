const vscode = require('vscode');

function activate(context) {

  function createWebview(title, folder) {
    const panel = vscode.window.createWebviewPanel(
      folder,
      title,
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'webview')
        ]
      }
    );

    const webview = panel.webview;

    // Build paths
    const htmlUri = vscode.Uri.joinPath(context.extensionUri, 'webview', folder, 'index.html');
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, 'webview', folder, 'style.css')
    );
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, 'webview', folder, 'script.js')
    );

    let html = require('fs').readFileSync(htmlUri.fsPath, 'utf8');

    const csp = `
      <meta http-equiv="Content-Security-Policy"
        content="
          default-src 'none';
          img-src ${webview.cspSource} https:;
          style-src ${webview.cspSource} 'unsafe-inline';
          script-src ${webview.cspSource} 'unsafe-inline';
        ">
    `;

    // Inject CSP before </head>
    html = html.replace('</head>', `${csp}</head>`);

    // Replace placeholders (global)
    html = html
      .replace(/\$\{style\}/g, cssUri)
      .replace(/\$\{script\}/g, jsUri);

    webview.html = html;
  }

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('sas.Snake', () => {
      createWebview('Snake 🐍', 'snake');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sas.tic-tac-toe', () => {
      createWebview('Tic-tac-toe ❌🔴', 'tic-tac-toe');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sas.gtw', () => {
      createWebview('Guess-the-word 🐕', 'gtw');
    })
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};