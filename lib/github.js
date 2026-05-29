import { Octokit } from "@octokit/rest";

export function getOctokit(accessToken) {
  return new Octokit({ auth: accessToken });
}
