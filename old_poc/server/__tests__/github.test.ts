import { githubService } from '../github';

describe('GitHubService', () => {
  const mockToken = 'mock-token';

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
  });

  it('should set token correctly', () => {
    githubService.setToken(mockToken);
    expect(githubService['token']).toBe(mockToken);
  });

  it('should verify valid token', async () => {
    githubService.setToken(mockToken);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ login: 'testuser' })
    });

    const isValid = await githubService.verifyToken();
    expect(isValid).toBe(true);
  });

  it('should handle invalid token', async () => {
    githubService.setToken(mockToken);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Bad credentials' })
    });

    const isValid = await githubService.verifyToken();
    expect(isValid).toBe(false);
  });

  it('should handle network errors', async () => {
    githubService.setToken(mockToken);
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const isValid = await githubService.verifyToken();
    expect(isValid).toBe(false);
  });
});
