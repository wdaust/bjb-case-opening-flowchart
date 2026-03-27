import { useState, useEffect, useCallback } from 'react';
import {
  queryUserSummary,
  queryPagePopularity,
  queryTopClicks,
} from '../utils/tracking.ts';
import type { UserSummary, PagePopularity, TopClick } from '../utils/tracking.ts';

type DateRange = '7d' | '30d' | 'all';

function sinceDate(range: DateRange): string | undefined {
  if (range === 'all') return undefined;
  const d = new Date();
  d.setDate(d.getDate() - (range === '7d' ? 7 : 30));
  return d.toISOString();
}

export default function Analytics() {
  const [range, setRange] = useState<DateRange>('7d');
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [pages, setPages] = useState<PagePopularity[]>([]);
  const [clicks, setClicks] = useState<TopClick[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const since = sinceDate(range);
    const [u, p, c] = await Promise.all([
      queryUserSummary(since),
      queryPagePopularity(since),
      queryTopClicks(since),
    ]);
    setUsers(u);
    setPages(p);
    setClicks(c);
    setLoading(false);
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-xl font-semibold">Analytics</h1>
        <div className="flex gap-2">
          {(['7d', '30d', 'all'] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                range === r
                  ? 'bg-white text-black border-white'
                  : 'text-gray-400 border-[#333] hover:border-[#555]'
              }`}
            >
              {r === 'all' ? 'All time' : r}
            </button>
          ))}
          <button
            onClick={load}
            className="px-3 py-1 text-xs text-gray-400 border border-[#333] rounded-lg hover:border-[#555] transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : (
        <>
          {/* Users table */}
          <section>
            <h2 className="text-gray-300 text-sm font-medium mb-3">Per-User Activity</h2>
            <div className="overflow-x-auto border border-[#2a2a2a] rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left border-b border-[#2a2a2a]">
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2 text-right">Views</th>
                    <th className="px-4 py-2 text-right">Clicks</th>
                    <th className="px-4 py-2 text-right">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_token} className="border-b border-[#1a1a1a] text-gray-300">
                      <td className="px-4 py-2 font-mono">{u.user_token}</td>
                      <td className="px-4 py-2 text-right">{u.total_views}</td>
                      <td className="px-4 py-2 text-right">{u.total_clicks}</td>
                      <td className="px-4 py-2 text-right text-gray-500">
                        {u.last_active ? new Date(u.last_active).toLocaleString() : '–'}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-600">
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Page popularity */}
          <section>
            <h2 className="text-gray-300 text-sm font-medium mb-3">Page Popularity</h2>
            <div className="overflow-x-auto border border-[#2a2a2a] rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left border-b border-[#2a2a2a]">
                    <th className="px-4 py-2">Path</th>
                    <th className="px-4 py-2 text-right">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((p) => (
                    <tr key={p.path} className="border-b border-[#1a1a1a] text-gray-300">
                      <td className="px-4 py-2 font-mono">{p.path}</td>
                      <td className="px-4 py-2 text-right">{p.view_count}</td>
                    </tr>
                  ))}
                  {pages.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-4 text-center text-gray-600">
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top clicks */}
          <section>
            <h2 className="text-gray-300 text-sm font-medium mb-3">Top Clicked Elements</h2>
            <div className="overflow-x-auto border border-[#2a2a2a] rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left border-b border-[#2a2a2a]">
                    <th className="px-4 py-2">Element Text</th>
                    <th className="px-4 py-2">Page</th>
                    <th className="px-4 py-2 text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {clicks.map((c, i) => (
                    <tr key={i} className="border-b border-[#1a1a1a] text-gray-300">
                      <td className="px-4 py-2 max-w-[200px] truncate">{c.target_text}</td>
                      <td className="px-4 py-2 font-mono text-gray-500">{c.path}</td>
                      <td className="px-4 py-2 text-right">{c.click_count}</td>
                    </tr>
                  ))}
                  {clicks.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-gray-600">
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
