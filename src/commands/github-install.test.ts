/**
 * Tests for github-install.ts
 *
 * Focus: parseGitHubUrl() — pure URL parsing function.
 * No mocking needed.
 */
import { describe, it, expect } from 'vitest';
import { parseGitHubUrl } from './github-install.js';

describe('parseGitHubUrl', () => {
  // ==========================================================================
  // HTTPS URL formats
  // ==========================================================================

  it('parses https://github.com/owner/repo', () => {
    const result = parseGitHubUrl('https://github.com/facebook/react');
    expect(result).toEqual({
      owner: 'facebook',
      repo: 'react',
      branch: 'main',
      commit: undefined,
      path: undefined,
    });
  });

  it('parses http://github.com/owner/repo (non-https)', () => {
    const result = parseGitHubUrl('http://github.com/owner/repo');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'main',
      commit: undefined,
      path: undefined,
    });
  });

  it('parses https://github.com/owner/repo/tree/branch', () => {
    const result = parseGitHubUrl('https://github.com/vercel/next.js/tree/canary');
    expect(result).toEqual({
      owner: 'vercel',
      repo: 'next.js',
      branch: 'canary',
      commit: undefined,
      path: undefined,
    });
  });

  it('parses https://github.com/owner/repo/tree/branch/subpath', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo/tree/main/packages/skill');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'main',
      commit: undefined,
      path: 'packages/skill',
    });
  });

  it('parses https URL with trailing slash', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo/');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'main',
      commit: undefined,
      path: undefined,
    });
  });

  // ==========================================================================
  // Shorthand owner/repo formats
  // ==========================================================================

  it('parses owner/repo shorthand', () => {
    const result = parseGitHubUrl('facebook/react');
    expect(result).toEqual({
      owner: 'facebook',
      repo: 'react',
      branch: 'main',
      commit: undefined,
      path: undefined,
    });
  });

  it('parses owner/repo#branch shorthand', () => {
    const result = parseGitHubUrl('owner/repo#develop');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'develop',
      commit: undefined,
      path: undefined,
    });
  });

  it('parses owner/repo@commit shorthand (40 hex chars)', () => {
    const commitHash = 'abc123def456abc123def456abc123def4567890';
    const result = parseGitHubUrl(`owner/repo@${commitHash}`);
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: commitHash,
      commit: commitHash,
      path: undefined,
    });
  });

  it('parses owner/repo@non-commit as branch (short ref)', () => {
    const result = parseGitHubUrl('owner/repo@main');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'main',
      commit: undefined,
      path: undefined,
    });
  });

  // ==========================================================================
  // .git suffix handling
  // ==========================================================================

  it('strips .git from repo name in HTTPS URL', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo.git');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'main',
      commit: undefined,
      path: undefined,
    });
  });

  it('strips .git from repo name in shorthand', () => {
    const result = parseGitHubUrl('owner/repo.git');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'main',
      commit: undefined,
      path: undefined,
    });
  });

  // ==========================================================================
  // Invalid inputs → null
  // ==========================================================================

  it('returns null for empty string', () => {
    expect(parseGitHubUrl('')).toBeNull();
  });

  it('returns null for just a name (no slash)', () => {
    expect(parseGitHubUrl('just-a-name')).toBeNull();
  });

  it('returns null for absolute local path', () => {
    expect(parseGitHubUrl('/absolute/path')).toBeNull();
  });

  it('returns null for non-GitHub URL', () => {
    expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
  });

  it('returns null for random string', () => {
    expect(parseGitHubUrl('not even close')).toBeNull();
  });

  it('returns null for triple-slash URL', () => {
    expect(parseGitHubUrl('https://github.com/a/b/c/d')).toBeNull();
  });

  // ==========================================================================
  // Edge cases
  // ==========================================================================

  it('handles repo name with dots', () => {
    const result = parseGitHubUrl('owner/my.skill.repo');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'my.skill.repo',
      branch: 'main',
      commit: undefined,
      path: undefined,
    });
  });

  it('handles repo name with hyphens', () => {
    const result = parseGitHubUrl('owner/my-skill-repo');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'my-skill-repo',
      branch: 'main',
      commit: undefined,
      path: undefined,
    });
  });

  it('handles repo name with underscores', () => {
    const result = parseGitHubUrl('owner/my_skill_repo');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'my_skill_repo',
      branch: 'main',
      commit: undefined,
      path: undefined,
    });
  });

  it('handles organization name with numbers', () => {
    const result = parseGitHubUrl('my-org-123/repo');
    expect(result).toEqual({
      owner: 'my-org-123',
      repo: 'repo',
      branch: 'main',
      commit: undefined,
      path: undefined,
    });
  });

  it('returns null for shorthand with only owner (no repo)', () => {
    expect(parseGitHubUrl('owner/')).toBeNull();
  });

  it('parses shorthand with trailing slash', () => {
    const result = parseGitHubUrl('owner/repo/');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'main',
      commit: undefined,
      path: undefined,
    });
  });
});
