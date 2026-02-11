import {
	Range,
	window,
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

function isInsideJSXTag(lineText: string, position: number): boolean {
	// Check if the line contains non-JSX keywords that indicate we're not in JSX
	const nonJSXKeywords = [
		/^\s*(const|let|var)\s+/,
		/^\s*(if|else|while|for|switch|case)\s*\(/,
		/^\s*(import|export|return|throw|typeof|instanceof|new|delete|void)\s+/,
		/^\s*(function|class)\s+/,
	];

	for (const pattern of nonJSXKeywords) {
		if (pattern.test(lineText)) {
			return false;
		}
	}

	// Look backwards from position to find if we're inside a JSX tag (between < and >)
	let lastOpenBracket = -1;
	let lastCloseBracket = -1;

	for (let i = position - 1; i >= 0; i--) {
		if (isInStringLiteral(lineText, i)) {
			continue;
		}

		if (lineText[i] === ">") {
			lastCloseBracket = i;
			break;
		}
		if (lineText[i] === "<") {
			lastOpenBracket = i;
			break;
		}
	}

	// We're inside a JSX tag if we found an opening < without a closing >
	if (lastOpenBracket !== -1 && lastCloseBracket === -1) {
		// Verify there's a valid tag name after the <
		const afterBracket = lineText.substring(lastOpenBracket + 1);
		return /^[a-zA-Z]/.test(afterBracket);
	}

	return false;
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
				} else if (change.text === "" && change.rangeLength === 1) {
					// Backspace pressed
					const position = change.range.start;
					const line = event.document.lineAt(position.line);
					const charBefore = line.text.substring(
						position.character - 1,
						position.character
					);
					const charAfter = line.text.substring(
						position.character,
						position.character + 1
					);

					if (charBefore === "{" && charAfter === "}") {
						// Remove both braces
						editor.edit((editBuilder) => {
							editBuilder.delete(
								new Range(
									position.line,
									position.character - 1,
									position.line,
									position.character + 1
								)
							);
						});
					}
				}
			}
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
