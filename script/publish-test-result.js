import fs from "fs";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const DEFAULT_API_URL = "http://localhost:3000/api/TDDCycles/branch-tracking/ingest";
const REQUEST_TIMEOUT_MS = 20000;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const historyFile = path.join(scriptDirectory, "commit-history.json");
const tddLogFile = path.join(scriptDirectory, "tdd_log.json");

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function parseRepository(remoteUrl) {
  const normalized = remoteUrl.trim().replace(/\.git$/, "");
  const sshMatch = normalized.match(/^git@[^:]+:([^/]+)\/(.+)$/);
  const repositoryPath = sshMatch ? sshMatch[1] + "/" + sshMatch[2] : normalized;

  let pathname;
  try {
    pathname = sshMatch ? repositoryPath : new URL(repositoryPath).pathname;
  } catch {
    return null;
  }

  const parts = pathname.replace(/^\//, "").split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  return { owner: parts[0], reponame: parts[1] };
}

function getLatestConclusion() {
  if (!fs.existsSync(historyFile)) return null;
  try {
    const history = JSON.parse(fs.readFileSync(historyFile, "utf8"));
    const latest = Array.isArray(history)
      ? history.filter((entry) => entry?.sha === "HEAD").at(-1) ?? history.at(-1)
      : null;
    return latest && ["success", "failure", "skipped"].includes(latest.conclusion)
      ? latest.conclusion
      : null;
  } catch (error) {
    console.warn(`No se pudo leer ${historyFile}: ${error.message}`);
    return null;
  }
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    throw new Error(`No se pudo leer ${filePath}: ${error.message}`);
  }
}

function getBranchOwner() {
  return {
    name: runGit(["log", "-1", "--format=%an"]),
    email: runGit(["log", "-1", "--format=%ae"]),
  };
}

async function publishTestResult() {
  const repository = parseRepository(runGit(["config", "--get", "remote.origin.url"]));
  const conclusion = getLatestConclusion();
  if (!repository || !conclusion) {
    console.warn("No se publicó el resultado: faltan remoto GitHub o conclusión de pruebas.");
    return;
  }

  const sha = runGit(["rev-parse", "HEAD"]);
  const branch = process.env.GITHUB_REF_NAME || runGit(["branch", "--show-current"]) || "main";
  const commitHistory = readJsonArray(historyFile).map((entry) =>
    entry?.sha === "HEAD" ? { ...entry, sha } : entry,
  );
  const tddLog = readJsonArray(tddLogFile).map((entry) =>
    entry?.commitId === "HEAD" ? { ...entry, commitId: sha } : entry,
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      process.env.TDDLAB_API_URL || DEFAULT_API_URL,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          repoOwner: repository.owner,
          repoName: repository.reponame,
          branch,
          sha,
          branchOwner: getBranchOwner(),
          commitHistory,
          tddLog,
        }),
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new Error(`TDDLab respondió ${response.status}`);
    console.log(`Resultado de pruebas registrado en TDDLab para ${repository.owner}/${repository.reponame}@${sha}.`);
  } finally {
    clearTimeout(timeout);
  }
}

publishTestResult().catch((error) => {
  console.warn(`No se pudo publicar el resultado en TDDLab: ${error.message}`);
  if (process.env.TDDLAB_API_REQUIRED === "1") process.exitCode = 1;
});
