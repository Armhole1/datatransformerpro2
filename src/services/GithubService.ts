import { Octokit } from "octokit";

export const saveToGithub = async (token: string, owner: string, repo: string, path: string, content: string, message: string) => {
  const octokit = new Octokit({ auth: token });
  
  try {
    // Try to get existing file to get SHA
    let sha;
    try {
      const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
      sha = (data as any).sha;
    } catch (e) {
      // File doesn't exist
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      sha
    });
    return true;
  } catch (error) {
    console.error("GitHub save error:", error);
    throw error;
  }
};
