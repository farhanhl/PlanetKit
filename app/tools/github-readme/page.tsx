"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  Download,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  User,
  GitFork,
  Star,
  Users,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import MarkdownIt from "markdown-it";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import { useLang } from "@/app/lib/i18n/context";
import themes, {
  GitHubProfile,
  GitHubRepo,
} from "@/app/lib/github-readme/themes";

const URL_REGEX = /^https:\/\/github\.com\/([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)\/?$/;
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

export default function GitHubReadmePage() {
  const { t } = useLang();
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>(themes[0].id);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [reposExpanded, setReposExpanded] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateUrl = useCallback((value: string): boolean => {
    if (!value.trim()) {
      setUrlError(t.githubReadmeErrorEmpty || "Please enter a GitHub profile URL");
      return false;
    }
    if (!URL_REGEX.test(value.trim())) {
      setUrlError(t.githubReadmeErrorInvalid || "Invalid URL. Example: https://github.com/username");
      return false;
    }
    setUrlError("");
    return true;
  }, [t]);

  const handleUrlChange = useCallback(
    (value: string) => {
      setUrl(value);
      setUrlError("");
      setApiError("");
      if (value.trim() && !URL_REGEX.test(value.trim())) {
        validateUrl(value);
      }
    },
    [validateUrl]
  );

  const extractUsername = useCallback((githubUrl: string): string => {
    const match = githubUrl.trim().match(URL_REGEX);
    return match ? match[1] : "";
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!validateUrl(url)) return;

    const username = extractUsername(url);
    setLoading(true);
    setApiError("");
    setProfile(null);
    setRepos([]);

    try {
      const [profileRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=100&direction=desc`),
      ]);

      if (!profileRes.ok) {
        if (profileRes.status === 404) {
          setApiError(t.githubReadmeErrorNotFound || `User "${username}" not found on GitHub.`);
        } else if (profileRes.status === 403) {
          setApiError(t.githubReadmeErrorRateLimit || "GitHub API rate limit exceeded. Please try again later.");
        } else {
          setApiError(t.githubReadmeErrorFailed || "Failed to fetch GitHub profile. Please try again.");
        }
        return;
      }

      const profileData: GitHubProfile = await profileRes.json();
      const reposData: GitHubRepo[] = await reposRes.json();

      setProfile(profileData);
      setRepos(reposData);
    } catch {
      setApiError(t.githubReadmeErrorNetwork || "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [url, validateUrl, extractUsername, t]);

  const currentTheme = useMemo(() => {
    return themes.find((th) => th.id === selectedTheme) || themes[0];
  }, [selectedTheme]);

  const generatedMarkdown = useMemo(() => {
    if (!profile) return "";
    return currentTheme.generate(profile, repos);
  }, [profile, repos, currentTheme]);

  const handleCopy = useCallback(async () => {
    if (!generatedMarkdown) return;
    try {
      await navigator.clipboard.writeText(generatedMarkdown);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = generatedMarkdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedMarkdown]);

  const handleDownload = useCallback(() => {
    if (!generatedMarkdown || !profile) return;
    const blob = new Blob([generatedMarkdown], { type: "text/markdown" });
    const urlBlob = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlBlob;
    a.download = "README.md";
    a.click();
    setTimeout(() => URL.revokeObjectURL(urlBlob), 100);
  }, [generatedMarkdown, profile]);

  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);

  const langColors: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    "C++": "#f34b7d",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Vue: "#41b883",
  };

  const topLangs = (() => {
    const map: Record<string, number> = {};
    repos.forEach((r) => {
      if (r.language) map[r.language] = (map[r.language] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  })();

  return (
    <ToolPageLayout
      title={t.githubReadmeTitle || "GitHub Profile README Generator"}
      description={t.githubReadmeDesc || "Generate a beautiful README.md for your GitHub profile repository."}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Input + Profile + Preview */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* URL Input */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <label className="mb-1 block text-xs text-text-secondary">
              {t.githubReadmeUrlLabel || "GitHub Profile URL"}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchProfile()}
                placeholder="https://github.com/username"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-text-secondary focus:border-accent focus:outline-none"
              />
              <button
                onClick={fetchProfile}
                disabled={loading || !url.trim()}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                {t.githubReadmeFetch || "Fetch"}
              </button>
            </div>

            {urlError && (
              <div className="mt-2 flex items-center gap-2 text-sm text-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {urlError}
              </div>
            )}

            {apiError && (
              <div className="mt-2 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
                {apiError}
              </div>
            )}
          </div>

          {/* Profile Preview */}
          {profile && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.avatar_url}
                  alt={profile.login}
                  className="h-16 w-16 rounded-full border-2 border-border object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-foreground">
                    {profile.name || profile.login}
                  </h3>
                  <p className="text-sm text-text-secondary">@{profile.login}</p>
                  {profile.bio && (
                    <p className="mt-1 text-xs text-text-secondary">{profile.bio}</p>
                  )}
                </div>
                <a
                  href={profile.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg border border-border p-2 text-text-secondary transition-colors hover:border-accent/40 hover:bg-surface-hover hover:text-foreground cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-xs text-text-secondary">
                  <GitFork className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{profile.public_repos}</span>
                  {t.githubReadmeRepos || "repos"}
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-xs text-text-secondary">
                  <Star className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{totalStars}</span>
                  {t.githubReadmeStars || "stars"}
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-xs text-text-secondary">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{profile.followers}</span>
                  {t.githubReadmeFollowers || "followers"}
                </div>
                {profile.location && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-xs text-text-secondary">
                    📍 <span className="font-medium text-foreground">{profile.location}</span>
                  </div>
                )}
                {profile.company && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-xs text-text-secondary">
                    🏢 <span className="font-medium text-foreground">{profile.company}</span>
                  </div>
                )}
              </div>

              {topLangs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {topLangs.map(([lang, count]) => (
                    <div key={lang} className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: langColors[lang] || "#8b8b8b" }}
                      />
                      {lang} ({count})
                    </div>
                  ))}
                </div>
              )}

              {repos.length > 0 && (
                <div className="mt-4">
                <button
                  onClick={() => setReposExpanded(!reposExpanded)}
                  className="flex w-full items-center justify-between rounded-lg bg-background px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground cursor-pointer"
                >
                    <span>
                      {t.githubReadmeTopRepos || "Top Repositories"} ({Math.min(repos.length, 6)})
                    </span>
                    {reposExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {reposExpanded && (
                    <div className="mt-2 flex flex-col gap-2">
                      {[...repos]
                        .sort((a, b) => b.stargazers_count - a.stargazers_count)
                        .slice(0, 6)
                        .map((r) => (
                          <a
                            key={r.name}
                            href={r.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-xs transition-colors hover:border-accent/30 border border-transparent"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-foreground">{r.name}</span>
                              {r.description && (
                                <span className="ml-2 text-text-secondary truncate">
                                  — {r.description}
                                </span>
                              )}
                            </div>
                            <div className="ml-3 flex shrink-0 items-center gap-2 text-text-secondary">
                              {r.language && (
                                <span className="flex items-center gap-1">
                                  <span
                                    className="inline-block h-2 w-2 rounded-full"
                                    style={{ backgroundColor: langColors[r.language] || "#8b8b8b" }}
                                  />
                                  {r.language}
                                </span>
                              )}
                              <span className="flex items-center gap-0.5">
                                <Star className="h-3 w-3" />
                                {r.stargazers_count}
                              </span>
                            </div>
                          </a>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* README Preview */}
          {profile && generatedMarkdown && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {t.githubReadmePreview || "README Preview"}
                </h3>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="rounded-lg px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground cursor-pointer"
                >
                  {showPreview ? t.githubReadmeHidePreview || "Hide" : t.githubReadmeShowPreview || "Show"}
                </button>
              </div>
              {showPreview && (
                <div
                  className="markdown-body rounded-lg border border-border overflow-auto max-h-125"
                  style={{ padding: "16px", backgroundColor: "var(--background)" }}
                  dangerouslySetInnerHTML={{ __html: md.render(generatedMarkdown) }}
                />
              )}
            </div>
          )}

          {/* Empty State */}
          {!profile && !loading && (
            <div className="rounded-xl border border-dashed border-border bg-surface/50 p-12 text-center">
              <User className="mx-auto mb-4 h-12 w-12 text-text-secondary/30" />
              <p className="text-sm text-text-secondary">
                {t.githubReadmeEmpty || "Enter a GitHub profile URL above to generate a README.md"}
              </p>
            </div>
          )}
        </div>

        {/* Right: Theme Selector + Actions */}
        <div className="flex flex-col gap-5">
          {/* Theme Selector */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t.githubReadmeTheme || "Theme"}
            </h3>
            <div className="flex flex-col gap-2">
              {themes.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setSelectedTheme(th.id)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    selectedTheme === th.id
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/40 hover:bg-surface-hover"
                  }`}
                >
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: th.accent }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium ${selectedTheme === th.id ? "text-accent" : "text-foreground"}`}>
                      {th.name}
                    </p>
                    <p className="text-[10px] text-text-secondary truncate">{th.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          {profile && generatedMarkdown && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                {t.githubReadmeActions || "Actions"}
              </h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCopy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t.githubReadmeCopied || "Copied!"}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t.githubReadmeCopyMd || "Copy Markdown"}
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-surface-hover cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  {t.githubReadmeDownloadMd || "Download README.md"}
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {t.githubReadmeHowTo || "How to Use"}
            </h3>
            <ol className="flex flex-col gap-2 text-xs text-text-secondary">
              <li className="flex gap-2">
                <span className="font-bold text-accent">1.</span>
                {t.githubReadmeStep1 || "Enter your GitHub profile URL (https://github.com/username)"}
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-accent">2.</span>
                {t.githubReadmeStep2 || "Click Fetch to load your profile data"}
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-accent">3.</span>
                {t.githubReadmeStep3 || "Choose a theme from the left panel"}
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-accent">4.</span>
                {t.githubReadmeStep4 || "Copy or download the generated README.md"}
              </li>
            </ol>
            <p className="mt-3 text-[10px] text-text-secondary/60">
              {t.githubReadmeNote || "Data is fetched directly from GitHub's public API. No data is stored."}
            </p>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
