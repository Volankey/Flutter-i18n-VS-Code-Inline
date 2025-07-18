import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ProjectDetector } from '../../core/projectDetector';

suite('ProjectDetector Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  let projectDetector: ProjectDetector;

  setup(() => {
    sandbox = sinon.createSandbox();
    projectDetector = ProjectDetector.getInstance();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('Should be a singleton', () => {
    const instance1 = ProjectDetector.getInstance();
    const instance2 = ProjectDetector.getInstance();
    assert.strictEqual(instance1, instance2);
  });

  test('Should return null when no workspace folders', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);

    const result = await projectDetector.detectProject();
    assert.strictEqual(result, null);
  });

  test('Should return null when no pubspec.yaml found', async () => {
    const mockWorkspaceFolder = {
      uri: vscode.Uri.file('/test/workspace'),
      name: 'test-workspace',
      index: 0,
    };
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockWorkspaceFolder]);

    // Mock findFiles to return empty array (no pubspec.yaml)
    sandbox.stub(vscode.workspace, 'findFiles').resolves([]);

    const result = await projectDetector.detectProject();
    assert.strictEqual(result, null);
  });

  test('Should handle file system errors gracefully', async () => {
    const mockWorkspaceFolder = {
      uri: vscode.Uri.file('/test/workspace'),
      name: 'test-workspace',
      index: 0,
    };
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockWorkspaceFolder]);

    // Mock findFiles to throw error
    sandbox.stub(vscode.workspace, 'findFiles').rejects(new Error('File system error'));

    const result = await projectDetector.detectProject();
    assert.strictEqual(result, null);
  });

  test('Should dispose without errors', () => {
    assert.doesNotThrow(() => {
      projectDetector.dispose();
    });
  });
});
