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
    fetch('https://api.github.com/repos/buzzcobain/RepoTale/contributors')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Contributor[]) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const logins = new Set(data.map((c) => c.login));
          const merged = [
            ...data,
            ...DEFAULT_CONTRIBUTORS.filter((dc) => !logins.has(dc.login)),
          ];
          setContributors(merged);
        }
      })
      .catch(() => {
        // Graceful fallback to default contributors
      });

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
