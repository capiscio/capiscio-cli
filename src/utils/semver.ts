/**
 * Lightweight semver utilities to replace the semver package
 * Only implements the functionality we actually need
 */

export function isValidSemver(version: string): boolean {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  return semverRegex.test(version);
}

export function parseSemver(version: string): { major: number; minor: number; patch: number; prerelease?: string; build?: string } | null {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  const match = version.match(semverRegex);
  
  if (!match || !match[1] || !match[2] || !match[3]) {
    return null;
  }

  const result: { major: number; minor: number; patch: number; prerelease?: string; build?: string } = {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };

  if (match[4]) {
    result.prerelease = match[4];
  }

  if (match[5]) {
    result.build = match[5];
  }

  return result;
}

export function semverCompare(a: string, b: string): number {
  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);

  if (!parsedA || !parsedB) {
    throw new Error('Invalid semver format');
  }

  // Compare major version
  if (parsedA.major !== parsedB.major) {
    return parsedA.major - parsedB.major;
  }

  // Compare minor version
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor - parsedB.minor;
  }

  // Compare patch version
  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch - parsedB.patch;
  }

  // Handle prerelease versions
  if (parsedA.prerelease && !parsedB.prerelease) {
    return -1; // a is prerelease, b is not, so a < b
  }
  
  if (!parsedA.prerelease && parsedB.prerelease) {
    return 1; // a is not prerelease, b is, so a > b
  }

  if (parsedA.prerelease && parsedB.prerelease) {
    return parsedA.prerelease.localeCompare(parsedB.prerelease);
  }

  return 0; // versions are equal
}

export function semverGte(a: string, b: string): boolean {
  return semverCompare(a, b) >= 0;
}

export function semverSatisfies(version: string, range: string): boolean {
  // Simple range matching - supports ^x.y.z and exact matches
  if (range.startsWith('^')) {
    const targetVersion = range.slice(1);
    const target = parseSemver(targetVersion);
    const current = parseSemver(version);
    
    if (!target || !current) {
      return false;
    }

    // Major version must match, minor and patch can be greater
    return current.major === target.major && semverCompare(version, targetVersion) >= 0;
  }

  // Exact match
  return version === range;
}