import * as assert from 'assert';
import * as vscode from 'vscode';
import { DartParser } from '../../../core/dartParser';

suite('DartParser Test Suite', () => {
  let dartParser: DartParser;

  setup(() => {
    dartParser = DartParser.getInstance();
  });

  // Helper function to create a mock document
  function createMockDocument(text: string): vscode.TextDocument {
    return {
      getText: () => text,
      uri: {
        fsPath: '/test/file.dart',
        scheme: 'file',
        authority: '',
        path: '/test/file.dart',
        query: '',
        fragment: '',
        with: () => ({}) as any,
        toJSON: () => ({}),
      },
      positionAt: (offset: number) => {
        const lines = text.substring(0, offset).split('\n');
        const line = lines.length - 1;
        const character = lines[line].length;
        return new vscode.Position(line, character);
      },
      offsetAt: (position: vscode.Position) => {
        const lines = text.split('\n');
        let offset = 0;
        for (let i = 0; i < position.line; i++) {
          offset += lines[i].length + 1; // +1 for newline
        }
        return offset + position.character;
      },
      lineCount: text.split('\n').length,
      lineAt: (lineOrPosition: number | vscode.Position) => {
        const lines = text.split('\n');
        const lineNumber =
          typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        return {
          lineNumber,
          text: lines[lineNumber] || '',
          range: new vscode.Range(lineNumber, 0, lineNumber, (lines[lineNumber] || '').length),
          rangeIncludingLineBreak: new vscode.Range(lineNumber, 0, lineNumber + 1, 0),
          firstNonWhitespaceCharacterIndex: 0,
          isEmptyOrWhitespace: !(lines[lineNumber] || '').trim(),
        };
      },
      fileName: '/test/file.dart',
      isUntitled: false,
      languageId: 'dart',
      version: 1,
      isDirty: false,
      isClosed: false,
      save: async () => true,
      eol: vscode.EndOfLine.LF,
      encoding: 'utf8',
      getWordRangeAtPosition: () => undefined,
      validateRange: (range: vscode.Range) => range,
      validatePosition: (position: vscode.Position) => position,
    } as vscode.TextDocument;
  }

  test('should parse S.of(context).key pattern', () => {
    const code = `Text(S.of(context).myKey)`;
    const mockDocument = createMockDocument(code);
    const result = dartParser.parseDocument(mockDocument);
    assert.strictEqual(result.references.length, 1);
    assert.strictEqual(result.references[0].key, 'myKey');
  });

  test('should parse AppLocalizations.of(context).key pattern', () => {
    const code = `Text(AppLocalizations.of(context).anotherKey)`;
    const mockDocument = createMockDocument(code);
    const result = dartParser.parseDocument(mockDocument);
    assert.strictEqual(result.references.length, 1);
    assert.strictEqual(result.references[0].key, 'anotherKey');
  });

  test('should parse context.l10n.key pattern', () => {
    const code = `Text(context.l10n.l10nKey)`;
    const mockDocument = createMockDocument(code);
    const result = dartParser.parseDocument(mockDocument);
    assert.strictEqual(result.references.length, 1);
    assert.strictEqual(result.references[0].key, 'l10nKey');
  });

  test('should parse custom patterns if enabled', () => {
    // Mock configManager to enable custom patterns
    const customPatterns = {
      generatedClass: "\\bMyL10n\\.get\\(\\'(.*?)\\'\\)",
    };
    // Mocking getConfiguration to enable custom patterns
    const mockConfig1 = {
      get: (key: string) => {
        if (key === 'enableCustomPatterns') {
          return true;
        }
        if (key === 'customPatterns') {
          return customPatterns;
        }
        return undefined;
      },
    };
    (vscode.workspace.getConfiguration as any) = () => mockConfig1;
    dartParser.reloadConfiguration();

    const code = `Text(MyL10n.get('customKey'))`;
    const mockDocument = createMockDocument(code);
    const result = dartParser.parseDocument(mockDocument);
    assert.strictEqual(result.references.length, 1);
    assert.strictEqual(result.references[0].key, 'customKey');

    // Reset after test
    // Mocking getConfiguration to disable custom patterns
    const mockConfig2 = {
      get: (key: string) => {
        if (key === 'enableCustomPatterns') {
          return false;
        }
        return undefined;
      },
    };
    (vscode.workspace.getConfiguration as any) = () => mockConfig2;
    dartParser.reloadConfiguration();
  });

  test('should not parse custom patterns if disabled', () => {
    const customPatterns = {
      generatedClass: "\\bMyL10n\\.get\\(\\'(.*?)\\'\\)",
    };
    // Mocking getConfiguration to disable custom patterns but provide patterns
    const mockConfig3 = {
      get: (key: string) => {
        if (key === 'enableCustomPatterns') {
          return false;
        }
        if (key === 'customPatterns') {
          return customPatterns;
        }
        return undefined;
      },
    };
    (vscode.workspace.getConfiguration as any) = () => mockConfig3;
    dartParser.reloadConfiguration();

    const code = `Text(MyL10n.get('customKey'))`;
    const mockDocument = createMockDocument(code);
    const result = dartParser.parseDocument(mockDocument);
    assert.strictEqual(result.references.length, 0);
  });

  test('should parse multiple keys in a single document', () => {
    const code = `
      Column(
        children: [
          Text(S.of(context).keyOne),
          Text(context.l10n.keyTwo),
        ],
      )
    `;
    const mockDocument = createMockDocument(code);
    const result = dartParser.parseDocument(mockDocument);
    assert.strictEqual(result.references.length, 2);
    assert.strictEqual(result.references[0].key, 'keyOne');
    assert.strictEqual(result.references[1].key, 'keyTwo');
  });
});
