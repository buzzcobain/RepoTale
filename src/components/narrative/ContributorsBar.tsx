import React, { useEffect, useState } from 'react';
import { Users, ExternalLink } from 'lucide-react';

interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

const DEFAULT_CONTRIBUTORS: Contributor[] = [
  {
    login: 'buzzcobain',
    avatar_url: 'https://github.com/buzzcobain.png',
    html_url: 'https://github.com/buzzcobain',
    contributions: 35,
  },
  {
    login: 'bernalalexis-try',
    avatar_url: 'https://github.com/bernalalexis-try.png',
    html_url: 'https://github.com/bernalalexis-try',
    contributions: 1,
  },
];

export const ContributorsBar: React.FC = () => {
  const [contributors, setContributors] = useState<Contributor[]>(DEFAULT_CONTRIBUTORS);

  useEffect(() => {
    let isMounted = true;

    async function loadContributors() {
      const detected = new Map<string, Contributor>();

      // Seed with default contributors
      for (const def of DEFAULT_CONTRIBUTORS) {
        detected.set(def.login.toLowerCase(), def);
      }

      // 1. Fetch merged PRs (Instant real-time sync with 0 delay)
      try {
        const prsRes = await fetch(
          'https://api.github.com/repos/buzzcobain/RepoTale/pulls?state=closed&per_page=50'
        );
        if (prsRes.ok) {
          const prs = await prsRes.json();
          if (Array.isArray(prs)) {
            for (const pr of prs) {
              if (pr.merged_at && pr.user && pr.user.login) {
                const loginKey = pr.user.login.toLowerCase();
                const existing = detected.get(loginKey);
                detected.set(loginKey, {
                  login: pr.user.login,
                  avatar_url: pr.user.avatar_url || `https://github.com/${pr.user.login}.png`,
                  html_url: pr.user.html_url || `https://github.com/${pr.user.login}`,
                  contributions: (existing?.contributions || 0) + 1,
                });
              }
            }
          }
        }
      } catch {
        // Fall through to contributors endpoint
      }

      // 2. Fetch from GitHub Contributors endpoint
      try {
        const contribRes = await fetch(
          'https://api.github.com/repos/buzzcobain/RepoTale/contributors'
        );
        if (contribRes.ok) {
          const contribs = await contribRes.json();
          if (Array.isArray(contribs)) {
            for (const c of contribs) {
              if (c.login) {
                const loginKey = c.login.toLowerCase();
                detected.set(loginKey, {
                  login: c.login,
                  avatar_url: c.avatar_url || `https://github.com/${c.login}.png`,
                  html_url: c.html_url || `https://github.com/${c.login}`,
                  contributions: c.contributions || 1,
                });
              }
            }
          }
        }
      } catch {
        // Fall through
      }

      if (isMounted && detected.size > 0) {
        setContributors(Array.from(detected.values()));
      }
    }

    loadContributors();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-3.5 rounded-lg bg-base-100 border border-base-300 mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-base-200 border border-base-300 flex items-center justify-center text-primary shrink-0">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">Contributors</span>
            <span className="badge badge-xs badge-neutral font-mono text-[10px] text-slate-400">Open Source</span>
          </div>
          <p className="text-[11px] text-slate-400">Community developers building and expanding RepoTale</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="avatar-group -space-x-2.5 rtl:space-x-reverse">
          {contributors.map((c) => (
            <a
              key={c.login}
              href={c.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="avatar tooltip tooltip-top border-none"
              data-tip={`@${c.login}`}
            >
              <div className="w-7 h-7 rounded-full border border-base-300 bg-base-200 hover:scale-110 transition-transform">
                <img src={c.avatar_url} alt={c.login} loading="lazy" />
              </div>
            </a>
          ))}
        </div>

        <a
          href="https://github.com/buzzcobain/RepoTale/graphs/contributors"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-xs font-mono text-[11px] text-slate-400 hover:text-white border border-base-300 gap-1"
        >
          <span>View All</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
