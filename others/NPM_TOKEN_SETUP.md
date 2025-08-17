# NPM Token Setup Guide

This guide explains how to set up the NPM_TOKEN secret required for automated package publishing via GitHub Actions.

## Prerequisites

- npm account with publishing permissions for the package
- Repository admin access to configure GitHub secrets
- Package already published to npm (for existing packages) or npm account verified for new packages

## Step 1: Create npm Access Token

1. **Log in to npm**
   - Go to [npmjs.com](https://www.npmjs.com) and sign in to your account
   - Ensure you have publishing permissions for the package

2. **Navigate to Access Tokens**
   - Click on your profile picture in the top right
   - Select "Access Tokens" from the dropdown menu
   - Or go directly to: https://www.npmjs.com/settings/tokens

3. **Generate New Token**
   - Click "Generate New Token"
   - Choose "Automation" token type (recommended for CI/CD)
   - Set the token name (e.g., "github-actions-publish")
   - **Important**: Copy the token immediately - you won't be able to see it again

## Step 2: Configure GitHub Repository Secret

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click on "Settings" tab
   - Select "Secrets and variables" → "Actions" from the left sidebar

2. **Add Repository Secret**
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste the npm access token from Step 1
   - Click "Add secret"

## Step 3: Verify Token Permissions

Ensure your npm token has the following permissions:

- **Read and write**: Required for publishing packages
- **Package scope**: Should match your package scope (if scoped)

## Token Security Best Practices

- **Never commit tokens to code**: Always use GitHub secrets
- **Use automation tokens**: These are designed for CI/CD use
- **Rotate tokens regularly**: Consider updating tokens every 6-12 months
- **Monitor token usage**: Check npm token usage in your npm account settings

## Troubleshooting

### Authentication Failed

```
npm ERR! code E401
npm ERR! 401 Unauthorized - PUT https://registry.npmjs.org/package-name
```

**Solutions:**

1. Verify the NPM_TOKEN secret is correctly set in GitHub
2. Check that the token hasn't expired
3. Ensure the token has publishing permissions for the package
4. Verify the package name matches exactly (including scope if applicable)

### Token Not Found

```
npm ERR! need auth This command requires you to be logged in.
```

**Solutions:**

1. Confirm NPM_TOKEN is set as a repository secret (not environment variable)
2. Check the secret name is exactly `NPM_TOKEN` (case-sensitive)
3. Verify the workflow has access to secrets (not running on forks)

### Permission Denied

```
npm ERR! code E403
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/package-name
```

**Solutions:**

1. Check if you're a maintainer/owner of the package
2. For scoped packages, ensure you have organization permissions
3. Verify the package name and scope are correct
4. For new packages, ensure the name isn't already taken

### Version Already Exists

```
npm ERR! code E409
npm ERR! 409 Conflict - PUT https://registry.npmjs.org/package-name
```

**Solutions:**

1. This is expected behavior - npm doesn't allow republishing the same version
2. Ensure your release process increments the version number
3. Check that package.json version matches the git tag version

## Testing Token Setup

To test if your token is working correctly:

1. **Manual Test** (optional):

   ```bash
   # Set token locally (temporary)
   npm config set //registry.npmjs.org/:_authToken YOUR_TOKEN

   # Test authentication
   npm whoami

   # Clean up
   npm config delete //registry.npmjs.org/:_authToken
   ```

2. **GitHub Actions Test**:
   - Create a test release to trigger the publish workflow
   - Monitor the workflow logs for authentication success
   - Check npm for successful package publication

## Token Rotation

When rotating tokens:

1. Generate new npm access token
2. Update GitHub repository secret with new token
3. Test with a patch release
4. Revoke old token from npm settings

## Support

If you continue to experience issues:

- Check [npm documentation](https://docs.npmjs.com/about-access-tokens)
- Review [GitHub Actions secrets documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- Verify package publishing permissions in npm
