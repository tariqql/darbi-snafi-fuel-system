// GitHub Integration - تكامل مع GitHub
import { Octokit } from '@octokit/rest'

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

// دالة لإنشاء مستودع جديد
export async function createRepository(repoName: string, description: string, isPrivate: boolean = false) {
  const octokit = await getUncachableGitHubClient();
  
  const response = await octokit.repos.createForAuthenticatedUser({
    name: repoName,
    description: description,
    private: isPrivate,
    auto_init: true,
  });
  
  return response.data;
}

// دالة للحصول على معلومات المستخدم
export async function getAuthenticatedUser() {
  const octokit = await getUncachableGitHubClient();
  const response = await octokit.users.getAuthenticated();
  return response.data;
}

// دالة لإنشاء أو تحديث ملف في المستودع
export async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string
) {
  const octokit = await getUncachableGitHubClient();
  
  const encodedContent = Buffer.from(content).toString('base64');
  
  const params: any = {
    owner,
    repo,
    path,
    message,
    content: encodedContent,
  };
  
  if (sha) {
    params.sha = sha;
  }
  
  const response = await octokit.repos.createOrUpdateFileContents(params);
  return response.data;
}

// دالة للحصول على محتوى ملف
export async function getFileContent(owner: string, repo: string, path: string) {
  const octokit = await getUncachableGitHubClient();
  
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });
    return response.data;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

// دالة لقائمة المستودعات
export async function listRepositories() {
  const octokit = await getUncachableGitHubClient();
  const response = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
  });
  return response.data;
}
