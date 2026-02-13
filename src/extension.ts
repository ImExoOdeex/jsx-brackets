import {
	Range,
	window,
	commands,
	Position,
	workspace,
	SnippetString,
	ExtensionContext,
} from "vscode";

function isInStringLiteral(lineText: string, index: number): boolean {
	let inSingleQuoteString = false;
	let inDoubleQuoteString = false;

	for (let i = 0; i < index; i++) {
		if (lineText[i] === "'" && (i === 0 || lineText[i - 1] !== "\\")) {
			inSingleQuoteString = !inSingleQuoteString;
		} else if (lineText[i] === '"' && (i === 0 || lineText[i - 1] !== "\\")) {
			inDoubleQuoteString = !inDoubleQuoteString;
		}
	}
	return inSingleQuoteString || inDoubleQuoteString;
}

export function activate(context: ExtensionContext) {
	const disposable = workspace.onDidChangeTextDocument((event) => {
		if (
			["javascriptreact", "typescriptreact"].includes(event.document.languageId)
		) {
			const editor = window.activeTextEditor;
			if (!editor) {
				return;
			}

			for (const change of event.contentChanges) {
				if (change.text === "=") {
					const position = change.range.start;
					const line = event.document.lineAt(position.line);
					const lineText = line.text;

					// Check if we're in a string literal
					if (isInStringLiteral(lineText, position.character)) {
						continue;
					}

					// Check if we're actually inside a JSX tag
					// if (!isInsideJSXTag(lineText, position.character)) {
					// 	continue;
					// }

					let startOfPropName = position.character - 1;
					while (
						startOfPropName >= 0 &&
						/[a-zA-Z0-9_-]/.test(lineText[startOfPropName])
					) {
						startOfPropName--;
					}
					startOfPropName++;

					if (startOfPropName < position.character) {
						// Use a SnippetString to insert the braces
						const snippet = new SnippetString("{$0}");

						editor
							.insertSnippet(
								snippet,
								new Position(position.line, position.character + 1)
							)
							.then((success) => {
								if (!success) {
									console.error("Snippet insertion failed!");
								}
							});
					}
				}
			}
		}
	});

	// Handle backspace to delete empty bracket pairs
	const backspaceDisposable = commands.registerCommand(
		"jsx-brackets.handleBackspace",
		function () {
			const editor = window.activeTextEditor;
			if (!editor) {
				return commands.executeCommand("deleteLeft");
			}

			// Only handle single cursor with no selection
			if (editor.selections.length !== 1 || !editor.selection.isEmpty) {
				return commands.executeCommand("deleteLeft");
			}

			const position = editor.selection.active;
			const line = editor.document.lineAt(position.line);
			const charBefore =
				position.character > 0 ? line.text[position.character - 1] : "";
			const charAfter =
				position.character < line.text.length
					? line.text[position.character]
					: "";

			if (charBefore === "{" && charAfter === "}") {
				// Cursor is between empty {} — delete both brackets
				return editor.edit((editBuilder) => {
					editBuilder.delete(
						new Range(
							position.line,
							position.character - 1,
							position.line,
							position.character + 1
						)
					);
				});
			} else {
				return commands.executeCommand("deleteLeft");
			}
		}
	);

	const enableDisposable = commands.registerCommand(
		"jsx-brackets.enable",
		function () {
			workspace
				.getConfiguration("jsx-brackets")
				.update("enabled", true, true);
			window.showInformationMessage("Auto JSX Brackets enabled.");
		}
	);

	const disableDisposable = commands.registerCommand(
		"jsx-brackets.disable",
		function () {
			workspace
				.getConfiguration("jsx-brackets")
				.update("enabled", false, true);
			window.showInformationMessage("Auto JSX Brackets disabled.");
		}
	);

	context.subscriptions.push(disposable);
	context.subscriptions.push(backspaceDisposable);
	context.subscriptions.push(enableDisposable);
	context.subscriptions.push(disableDisposable);
}

export function deactivate() {}
