// Script to push code to GitHub using Replit GitHub connector
// Usage: npx tsx scripts/push-to-github.ts

interface ConnectionSettings {
  settings: {
    access_token?: string;
    expires_at?: string;
    oauth?: {
      credentials?: {
        access_token?: string;
      };
    };
  };
}

let connectionSettings: ConnectionSettings | null = null;

async function getAccessToken(): Promise<string> {
  if (connectionSettings && connectionSettings.settings.expires_at && 
      new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token!;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  const data = await response.json();
  connectionSettings = data.items?.[0];

  const accessToken = connectionSettings?.settings?.access_token || 
                      connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function githubRequest(method: string, endpoint: string, body?: object): Promise<any> {
  const token = await getAccessToken();
  const response = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

async function getAuthenticatedUser(): Promise<{ login: string }> {
  return githubRequest('GET', '/user');
}

async function createRepo(name: string, description: string): Promise<{ full_name: string; html_url: string }> {
  try {
    return await githubRequest('POST', '/user/repos', {
      name,
      description,
      private: false,
      auto_init: false,
    });
  } catch (error: any) {
    if (error.message.includes('422') && error.message.includes('name already exists')) {
      const user = await getAuthenticatedUser();
      return githubRequest('GET', `/repos/${user.login}/${name}`);
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting GitHub push process...\n');
  
  try {
    const user = await getAuthenticatedUser();
    console.log(`✅ Authenticated as: ${user.login}`);
    
    const repoName = 'abb-alaan-fuel-installment';
    const description = 'عبّ الآن - نظام تقسيط وقود السيارات مع محرك سنافي الذكي';
    
    console.log(`\n📦 Creating/checking repository: ${repoName}`);
    const repo = await createRepo(repoName, description);
    console.log(`✅ Repository ready: ${repo.html_url}`);
    
    console.log('\n📋 To push your code, run these commands:');
    console.log('─'.repeat(50));
    console.log(`git remote add origin https://github.com/${repo.full_name}.git`);
    console.log('git branch -M main');
    console.log('git push -u origin main');
    console.log('─'.repeat(50));
    
    console.log('\n✨ Done! Your repository is ready at:');
    console.log(`   ${repo.html_url}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
