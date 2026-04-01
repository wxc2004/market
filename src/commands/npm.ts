import https from 'https';
import { URL } from 'url';

interface NpmPackage {
  name: string;
  version: string;
  description?: string;
  skillmarket?: {
    id?: string;
    displayName?: string;
    description?: string;
    platforms?: string[];
    defaultVersion?: string;
  };
}

interface NpmRegistryResponse {
  name: string;
  versions: Record<string, NpmPackage>;
  'dist-tags': Record<string, string>;
}

export async function fetchNpmPackage(packageName: string): Promise<NpmRegistryResponse | null> {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://registry.npmjs.org/${packageName.replace('@', '')}`);
    
    const req = https.get(url.toString(), { timeout: 10000 }, (res) => {
      let data = '';
      
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // Check if npm returned an error (404, etc.)
          if (parsed.error) {
            resolve(null);
            return;
          }
          resolve(parsed);
        } catch {
          resolve(null);
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

export async function searchSkillmarketPackages(): Promise<string[]> {
  const packages: string[] = [];
  
  return new Promise((resolve, reject) => {
    const url = new URL('https://registry.npmjs.org/-/v1/search');
    url.searchParams.set('text', 'keywords:skillmarket');
    url.searchParams.set('size', '100');
    
    const req = https.get(url.toString(), { timeout: 10000 }, (res) => {
      let data = '';
      
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          for (const pkg of result.objects || []) {
            packages.push(pkg.package.name);
          }
          resolve(packages);
        } catch {
          resolve([]);
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}
