# Design Document

## Overview

この設計では、hyoujiコマンドの実行時にGitリポジトリの自動検出機能を追加します。現在のアーキテクチャでは、ユーザーは常にリポジトリ名を手動で入力する必要がありますが、この機能により、Gitリポジトリ内で実行された場合は自動的にリポジトリ情報を検出し、ユーザーエクスペリエンスを向上させます。

## Architecture

### Current Flow

```
hyouji実行 → 設定確認 → GitHub認証情報取得 → リポジトリ名入力プロンプト → ラベル操作
```

### New Flow

```
hyouji実行 → 設定確認 → GitHub認証情報取得 → Gitリポジトリ検出 →
├─ リポジトリ内: 自動検出されたリポジトリ情報を使用 → ラベル操作
└─ リポジトリ外: リポジトリ名入力プロンプト → ラベル操作
```

### Integration Points

1. **`src/index.ts`**: メインフローの`initializeConfigs`関数を修正し、リポジトリ検出ロジックを統合
2. **`src/lib/inputGitHubConfig.ts`**: `getGitHubConfigs`関数を拡張し、自動検出されたリポジトリ情報を処理
3. **新規モジュール**: `src/lib/gitRepositoryDetector.ts`を作成し、Git検出ロジックを実装

## Components and Interfaces

### GitRepositoryDetector Class

```typescript
interface GitRepositoryInfo {
  owner: string;
  repo: string;
  remoteUrl: string;
  detectionMethod: 'origin' | 'first-remote' | 'manual';
}

interface GitDetectionResult {
  isGitRepository: boolean;
  repositoryInfo?: GitRepositoryInfo;
  error?: string;
}

class GitRepositoryDetector {
  static async detectRepository(cwd?: string): Promise<GitDetectionResult>;
  static async findGitRoot(startPath: string): Promise<string | null>;
  static async getRemoteUrl(
    gitRoot: string,
    remoteName?: string,
  ): Promise<string | null>;
  static parseGitUrl(url: string): { owner: string; repo: string } | null;
  static async getAllRemotes(gitRoot: string): Promise<string[]>;
}
```

### Modified ConfigType Interface

```typescript
interface ConfigType {
  octokit: Octokit;
  owner: string;
  repo: string;
  fromSavedConfig: boolean;
  autoDetected?: boolean; // 新規追加
  detectionMethod?: 'origin' | 'first-remote' | 'manual'; // 新規追加
}
```

## Data Models

### Git URL Parsing

サポートするURL形式：

- SSH: `git@github.com:owner/repo.git`
- HTTPS: `https://github.com/owner/repo.git`
- HTTPS (no .git): `https://github.com/owner/repo`

### Detection Priority

1. `origin` remote（最優先）
2. 最初に見つかったremote
3. 手動入力（フォールバック）

## Error Handling

### Error Categories

1. **Git Not Available**: `git`コマンドが利用できない場合
2. **Not a Git Repository**: `.git`フォルダが見つからない場合
3. **No Remotes**: リモートが設定されていない場合
4. **Invalid Remote URL**: リモートURLが解析できない場合
5. **Network Issues**: Git操作でネットワークエラーが発生した場合

### Error Handling Strategy

```typescript
try {
  const detectionResult = await GitRepositoryDetector.detectRepository();
  if (detectionResult.isGitRepository && detectionResult.repositoryInfo) {
    // 自動検出成功
    return useAutoDetectedRepository(detectionResult.repositoryInfo);
  }
} catch (error) {
  console.warn('Git repository detection failed, falling back to manual input');
}
// フォールバック: 手動入力
return promptForRepository();
```

### Graceful Degradation

- すべてのエラーケースで手動入力にフォールバック
- エラーメッセージは警告レベルで表示（エラーで停止しない）
- 既存の機能に影響を与えない

## Testing Strategy

### Unit Tests

1. **GitRepositoryDetector Tests**
   - `detectRepository()`: 様々なGit環境での検出テスト
   - `parseGitUrl()`: 各種URL形式の解析テスト
   - `findGitRoot()`: Git rootディレクトリの検索テスト

2. **Integration Tests**
   - 実際のGitリポジトリでの検出テスト
   - 非Gitディレクトリでのフォールバックテスト
   - 複数リモートでの優先順位テスト

### Test Scenarios

```typescript
describe('GitRepositoryDetector', () => {
  describe('detectRepository', () => {
    it('should detect repository from origin remote');
    it('should fallback to first remote when origin not available');
    it('should return false when not in git repository');
    it('should handle git command not available');
    it('should parse SSH URLs correctly');
    it('should parse HTTPS URLs correctly');
    it('should handle malformed URLs gracefully');
  });
});
```

### Mock Strategy

- `child_process.exec`をモックしてGitコマンドの結果をシミュレート
- ファイルシステム操作をモックして様々なディレクトリ構造をテスト
- エラーケースを含む包括的なテストカバレッジ

## Implementation Details

### Git Command Execution

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Git root検索
const { stdout } = await execAsync('git rev-parse --show-toplevel', { cwd });

// Remote URL取得
const { stdout } = await execAsync(`git remote get-url ${remoteName}`, {
  cwd: gitRoot,
});

// 全リモート一覧
const { stdout } = await execAsync('git remote', { cwd: gitRoot });
```

### URL Parsing Logic

```typescript
static parseGitUrl(url: string): { owner: string; repo: string } | null {
  // SSH format: git@github.com:owner/repo.git
  const sshMatch = url.match(/git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  // HTTPS format: https://github.com/owner/repo.git
  const httpsMatch = url.match(/https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  return null;
}
```

### Integration with Existing Flow

`src/lib/inputGitHubConfig.ts`の修正：

```typescript
export const getGitHubConfigs = async (): Promise<ConfigType> => {
  // 既存のロジック...

  if (validationResult.config && !validationResult.shouldPromptForCredentials) {
    // 自動検出を試行
    const detectionResult = await GitRepositoryDetector.detectRepository();

    if (detectionResult.isGitRepository && detectionResult.repositoryInfo) {
      console.log(chalk.green(`✓ Detected repository: ${detectionResult.repositoryInfo.owner}/${detectionResult.repositoryInfo.repo}`));

      return {
        octokit: new Octokit({ auth: validationResult.config.token }),
        owner: detectionResult.repositoryInfo.owner,
        repo: detectionResult.repositoryInfo.repo,
        fromSavedConfig: true,
        autoDetected: true,
        detectionMethod: detectionResult.repositoryInfo.detectionMethod,
      };
    }

    // フォールバック: 手動入力
    const repoResponse = await prompts([...]);
  }

  // 既存のロジック...
}
```

## Performance Considerations

- Git操作は非同期で実行し、タイムアウトを設定（5秒）
- ファイルシステム操作を最小限に抑制
- 検出結果をセッション中にキャッシュ（同一ディレクトリでの再実行時）

## Security Considerations

- Git URLの解析時にインジェクション攻撃を防ぐため、厳格な正規表現を使用
- 外部コマンド実行時のパラメータサニタイゼーション
- エラーメッセージに機密情報（パス、URL）を含めない
