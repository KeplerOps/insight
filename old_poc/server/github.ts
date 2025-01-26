type GitHubApiError = {
  message: string;
  documentation_url?: string;
};

export class GitHubService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.token) {
      throw new Error("GitHub token not set");
    }

    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json() as GitHubApiError;
      throw new Error(`GitHub API Error: ${error.message}`);
    }

    return response.json();
  }

  async verifyToken(): Promise<boolean> {
    try {
      const user = await this.request("/user");
      return !!user;
    } catch (error) {
      return false;
    }
  }

  async getUserProfile() {
    return this.request("/user");
  }

  async listRepositories(visibility: "all" | "public" | "private" = "all") {
    return this.request(`/user/repos?visibility=${visibility}&sort=updated&per_page=100`);
  }

  async getRepository(owner: string, repo: string) {
    return this.request(`/repos/${owner}/${repo}`);
  }

  // We'll add more methods here as needed for specific GitHub integration features
}

export const githubService = new GitHubService();
