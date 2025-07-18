import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CacheManager } from '../core/cacheManager';
import { ConfigManager } from '../core/configManager';
import { ProjectDetector } from '../core/projectDetector';
import * as myExtension from '../extension';

suite('Extension Test Suite', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('volankey.flutter-i18n-vscode-inline'));
  });

  test('Should activate without workspace folders', async () => {
    // Mock no workspace folders
    sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);

    // Should not throw error
    await assert.doesNotReject(async () => {
      const mockContext = {
        subscriptions: [],
        extensionPath: '/test/path',
        globalState: { keys: () => [], get: () => undefined, update: () => Promise.resolve() },
        workspaceState: { keys: () => [], get: () => undefined, update: () => Promise.resolve() },
      } as any;

      await myExtension.activate(mockContext);
    });
  });

  test('Should handle activation with workspace folders', async () => {
    // Mock workspace folders
    const mockWorkspaceFolder = {
      uri: vscode.Uri.file('/test/workspace'),
      name: 'test-workspace',
      index: 0,
    };
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockWorkspaceFolder]);

    // Mock ProjectDetector
    const projectDetectorStub = sandbox.stub(ProjectDetector, 'getInstance');
    const mockProjectDetector = {
      detectProject: sandbox.stub().resolves(null),
      dispose: sandbox.stub(),
    };
    projectDetectorStub.returns(mockProjectDetector as any);

    // Mock other managers
    sandbox.stub(ConfigManager, 'getInstance').returns({
      getConfiguration: () => ({ debug: { enabled: false } }),
      dispose: sandbox.stub(),
    } as any);

    sandbox.stub(CacheManager, 'getInstance').returns({
      dispose: sandbox.stub(),
    } as any);

    const mockContext = {
      subscriptions: [],
      extensionPath: '/test/path',
      globalState: { keys: () => [], get: () => undefined, update: () => Promise.resolve() },
      workspaceState: { keys: () => [], get: () => undefined, update: () => Promise.resolve() },
    } as any;

    // Should not throw error even when no Flutter project is detected
    await assert.doesNotReject(async () => {
      await myExtension.activate(mockContext);
    });

    // Verify project detection was called
    assert.ok(mockProjectDetector.detectProject.calledOnce);
  });

  test('Sample test for basic functionality', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
});
