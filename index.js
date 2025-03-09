import express from 'express';
import { Octokit } from 'octokit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const username = process.env.GITHUB_USERNAME;

// GET /github - Show user data and repositories
app.get('/github', async (req, res) => {
  try {
    const [userResponse, reposResponse] = await Promise.all([
      octokit.rest.users.getByUsername({ username }),
      octokit.rest.repos.listForUser({ username })
    ]);

    const userData = {
      followers: userResponse.data.followers,
      following: userResponse.data.following,
      public_repos: userResponse.data.public_repos,
      repositories: reposResponse.data.map(repo => ({
        name: repo.name,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        url: repo.html_url
      }))
    };

    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /github/{repo-name} - Show repository data
app.get('/github/:repo', async (req, res) => {
  try {
    const { repo } = req.params;
    const repoResponse = await octokit.rest.repos.get({
      owner: username,
      repo
    });

    const repoData = {
      name: repoResponse.data.name,
      description: repoResponse.data.description,
      stars: repoResponse.data.stargazers_count,
      forks: repoResponse.data.forks_count,
      language: repoResponse.data.language,
      open_issues: repoResponse.data.open_issues_count,
      created_at: repoResponse.data.created_at,
      updated_at: repoResponse.data.updated_at,
      url: repoResponse.data.html_url
    };

    res.json(repoData);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// POST /github/{repo-name}/issues - Create an issue
app.post('/github/:repo/issues', async (req, res) => {
  try {
    const { repo } = req.params;
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const issueResponse = await octokit.rest.issues.create({
      owner: username,
      repo,
      title,
      body
    });

    res.json({
      message: 'Issue created successfully',
      issue_url: issueResponse.data.html_url
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});