export interface GitHubProfile {
  login: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  blog: string | null;
  location: string | null;
  twitter_username: string | null;
  company: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
  forks_count: number;
}

export interface ThemeDef {
  id: string;
  name: string;
  desc: string;
  accent: string;
  generate: (profile: GitHubProfile, repos: GitHubRepo[]) => string;
}

function topLangs(repos: GitHubRepo[]): string[] {
  const map: Record<string, number> = {};
  repos.forEach((r) => {
    if (r.language) map[r.language] = (map[r.language] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([l]) => l);
}

function totalStars(repos: GitHubRepo[]): number {
  return repos.reduce((s, r) => s + r.stargazers_count, 0);
}

function topRepos(repos: GitHubRepo[]): GitHubRepo[] {
  return [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
}

function langColor(lang: string): string {
  const colors: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    Shell: "#89e051",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Vue: "#41b883",
    Svelte: "#ff3e00",
    "Jupyter Notebook": "#DA5B0B",
    Lua: "#000080",
    Scala: "#c22d40",
    R: "#198CE7",
  };
  return colors[lang] || "#8b8b8b";
}

const themes: ThemeDef[] = [
  {
    id: "classic",
    name: "Classic",
    desc: "Standard GitHub style with shields.io badges",
    accent: "#6e40c9",
    generate: (p, repos) => {
      const langs = topLangs(repos);
      const top = topRepos(repos);
      return `# Hi 👋, I'm ${p.name || p.login}

A passionate developer from${p.location ? ` ${p.location}` : ''}.

- 🔭 I'm currently working on **${p.public_repos}** public repositories
- 🌱 Currently: ${p.bio || 'Building cool stuff'}
- 💬 Ask me about: anything!
- 📫 How to reach me: ${p.twitter_username ? `[@${p.twitter_username}](https://twitter.com/${p.twitter_username})` : p.blog || 'GitHub'}
${p.company ? `- 🏢 I work at **${p.company}**` : ''}

### Connect with me

[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/${p.twitter_username || p.login})
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](${p.html_url})
${p.blog ? `[![Website](https://img.shields.io/badge/Website-FF6600?style=for-the-badge&logo=About.me&logoColor=white)](${p.blog})` : ''}

### Languages & Tools

${langs.map(l => `![${l}](https://img.shields.io/badge/${encodeURIComponent(l)}-${langColor(l).replace('#', '')}?style=flat&logo=${encodeURIComponent(l.toLowerCase())}&logoColor=white)`).join(' ')}

### Stats

![Repos](https://img.shields.io/badge/Repos-${p.public_repos}-blue?style=for-the-badge&logo=github&logoColor=white)
![Stars](https://img.shields.io/badge/Stars-${totalStars(repos)}-yellow?style=for-the-badge&logo=github&logoColor=white)
![Followers](https://img.shields.io/badge/Followers-${p.followers}-blueviolet?style=for-the-badge&logo=github&logoColor=white)
![Top Lang](https://img.shields.io/github/languages/top/${p.login}?style=for-the-badge)

### Star Repos

${top.map(r => `[![Stars](https://img.shields.io/github/stars/${p.login}/${r.name}?style=social)](${r.html_url}) **${r.name}** — ${r.description || 'No description'}`).join('\n')}

---
![Profile Views](https://komarev.com/ghpvc/?username=${p.login}&color=blueviolet)`;
    },
  },
  {
    id: "modern",
    name: "Modern",
    desc: "Gradient headers, centered layout, stats cards",
    accent: "#0ea5e9",
    generate: (p, repos) => {
      const langs = topLangs(repos);
      const stars = totalStars(repos);
      const top = topRepos(repos);
      return `<div align="center">

# ${p.name || p.login}

<img src="${p.avatar_url}" width="150" style="border-radius:50%" />

**${p.bio || 'Developer & Creator'}**

![Followers](https://img.shields.io/github/followers/${p.login}?label=Followers&style=social)
![Stars](https://img.shields.io/github/stars/${p.login}?label=Stars&style=social)
![Repos](https://img.shields.io/github/repos/${p.login}?label=Repos&style=flat-square)

---

### 🚀 About Me

- 🌍 Based in **${p.location || 'Earth'}**
- 💼 Working at **${p.company || 'Somewhere cool'}**
- 🛠️ **${p.public_repos}** public repos | ⭐ **${stars}** total stars
- 📫 Reach me on ${p.twitter_username ? `[Twitter](https://twitter.com/${p.twitter_username})` : 'GitHub'}

---

### 🛠️ Tech Stack

${langs.map(l => `\`${l}\``).join(' · ')}

---

### 📊 GitHub Stats

<img src="https://img.shields.io/badge/Repos-${p.public_repos}-0d1117?style=for-the-badge&logo=github&logoColor=58a6ff" width="200" />
<img src="https://img.shields.io/badge/Stars-${stars}-0d1117?style=for-the-badge&logo=github&logoColor=fbbf24" width="200" />
<img src="https://img.shields.io/badge/Followers-${p.followers}-0d1117?style=for-the-badge&logo=github&logoColor=79c0ff" width="200" />
<img src="https://img.shields.io/github/languages/top/${p.login}?style=for-the-badge" width="200" />

---

### 🏆 Featured Repos

${top.slice(0, 3).map(r => `<a href="${r.html_url}"><img src="https://img.shields.io/github/stars/${p.login}/${r.name}?style=social&label=${encodeURIComponent(r.name)}" /></a>`).join(' ')}

---

<img src="https://komarev.com/ghpvc/?username=${p.login}&color=0ea5e9&style=flat-square" />

</div>`;
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "Clean, text-focused, no images needed",
    accent: "#6b7280",
    generate: (p, repos) => {
      const langs = topLangs(repos);
      const top = topRepos(repos);
      return `# ${p.name || p.login}

> ${p.bio || 'Building things for the web.'}

---

**${p.login}** · ${p.location || ''} · [GitHub](${p.html_url})${p.blog ? ` · [Website](${p.blog})` : ''}${p.twitter_username ? ` · [Twitter](https://twitter.com/${p.twitter_username})` : ''}

---

### Repositories

${top.map(r => `#### [${r.name}](${r.html_url})
${r.description || '_No description_'} · ⭐ ${r.stargazers_count} · ${r.language || 'N/A'}
`).join('\n')}

---

**Languages:** ${langs.join(', ')}

**Stats:** ${p.public_repos} repos · ${p.followers} followers · ${p.following} following`;
    },
  },
  {
    id: "dark-pro",
    name: "Dark Pro",
    desc: "Dark background, neon accent colors",
    accent: "#a855f7",
    generate: (p, repos) => {
      const langs = topLangs(repos);
      const stars = totalStars(repos);
      const top = topRepos(repos);
      return `<div align="center">

<a href="${p.html_url}"><img src="${p.avatar_url}" width="120" style="border-radius:50%;border:3px solid #a855f7" /></a>

# <span style="color:#a855f7">**${p.name || p.login}**</span>

\`\`\`
╔══════════════════════════════════╗
║  ${p.bio || 'Developer | Open Source Enthusiast'}  
║  📍 ${p.location || 'Worldwide'}  
║  ⭐ ${stars} Stars | 📦 ${p.public_repos} Repos  
╚══════════════════════════════════╝
\`\`\`

![Profile Views](https://komarev.com/ghpvc/?username=${p.login}&color=a855f7&style=for-the-badge)
![Followers](https://img.shields.io/github/followers/${p.login}?color=a855f7&style=for-the-badge&label=Followers)
![Stars](https://img.shields.io/github/stars/${p.login}?color=fbbf24&style=for-the-badge&label=Stars)

---

### ⚡ Tech Stack

${langs.map(l => `\`[${l}]\``).join(' · ')}

---

### 📊 Stats

![Repos](https://img.shields.io/badge/Repos-${p.public_repos}-0d1117?style=for-the-badge&logo=github&logoColor=a855f7)
![Stars](https://img.shields.io/badge/Stars-${stars}-0d1117?style=for-the-badge&logo=github&logoColor=fbbf24)
![Followers](https://img.shields.io/badge/Followers-${p.followers}-0d1117?style=for-the-badge&logo=github&logoColor=a855f7)

---

### 🌟 Top Repos

${top.map(r => `[![Stars](https://img.shields.io/github/stars/${p.login}/${r.name}?style=social)](${r.html_url}) **${r.name}**`).join('\n')}

---

*Last updated: ${new Date().toISOString().split('T')[0]}*

</div>`;
    },
  },
  {
    id: "tech-stack",
    name: "Tech Stack",
    desc: "Focused on languages and technology badges",
    accent: "#22c55e",
    generate: (p, repos) => {
      const langs = topLangs(repos);
      const stars = totalStars(repos);
      return `<div align="center">

# Hey, I'm ${p.name || p.login} 👋

${p.bio || ''}

[![Twitter](https://img.shields.io/badge/Follow-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/${p.twitter_username || ''})
[![GitHub](https://img.shields.io/badge/Follow-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](${p.html_url})

---

### 💻 Languages & Frameworks

<table>
<tr>
${langs.map(l => `<td align="center"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/${l.toLowerCase().replace('sharp', '')}/${l.toLowerCase().replace('sharp', '')}-original.svg" width="50" height="50" /><br /><sub><b>${l}</b></sub></td>`).join('\n')}
</tr>
</table>

---

### 📐 Tools & Platforms

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![VS Code](https://img.shields.io/badge/VS_Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)

---

### 📊 Activity

![Repos](https://img.shields.io/badge/Repos-${p.public_repos}-181717?style=for-the-badge&logo=github&logoColor=white)
![Stars](https://img.shields.io/badge/Stars-${stars}-181717?style=for-the-badge&logo=github&logoColor=fbbf24)
![Top Lang](https://img.shields.io/github/languages/top/${p.login}?style=for-the-badge)

---

<sub>⭐ ${stars} total stars across ${p.public_repos} repositories</sub>

</div>`;
    },
  },
  {
    id: "gamer",
    name: "Gamer",
    desc: "Gaming inspired, pixel borders, RGB colors",
    accent: "#ef4444",
    generate: (p, repos) => {
      const langs = topLangs(repos);
      const stars = totalStars(repos);
      const top = topRepos(repos);
      return `<div align="center">

# 🎮 ${p.name || p.login} 🎮

<img src="${p.avatar_url}" width="140" style="border:4px solid #ef4444;border-radius:8px" />

### ⚔️ Player Stats

| Stat | Value |
|------|-------|
| 🏠 Server | ${p.location || 'Unknown'} |
| 🏢 Guild | ${p.company || 'Solo Player'} |
| 📦 Quests Done | ${p.public_repos} |
| 🏆 XP (Stars) | ${stars} |
| 👥 Party Size | ${p.followers} |

---

### 🎯 Current Quest

> ${p.bio || 'Grinding code...'}

---

### 🔧 Loadout (Tech Stack)

${langs.map(l => `\`${l}\``).join(' · ')}

---

### 📺 Live Stats

[![Followers](https://img.shields.io/badge/👥_Followers-${p.followers}-red?style=for-the-badge)](https://github.com/${p.login}?tab=followers)
[![Stars](https://img.shields.io/badge/⭐_Stars-${stars}-yellow?style=for-the-badge)](${p.html_url})
[![Repos](https://img.shields.io/badge/📦_Repos-${p.public_repos}-green?style=for-the-badge)](${p.html_url}?tab=repositories)

<img src="https://img.shields.io/badge/Repos-${p.public_repos}-0d1117?style=for-the-badge&logo=github&logoColor=ef4444" width="200" />
<img src="https://img.shields.io/badge/Stars-${stars}-0d1117?style=for-the-badge&logo=github&logoColor=fbbf24" width="200" />
<img src="https://img.shields.io/badge/Followers-${p.followers}-0d1117?style=for-the-badge&logo=github&logoColor=ef4444" width="200" />

---

### 🏅 Top Achievements

${top.map((r, i) => `${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} [**${r.name}**](${r.html_url}) — ⭐ ${r.stargazers_count} ${r.description ? `| ${r.description}` : ''}`).join('\n')}

---

\`\`\`
🎮 Game Over? Never. Keep coding! 🎮
\`\`\`

</div>`;
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    desc: "Neon colors, futuristic ASCII art header",
    accent: "#f0abfc",
    generate: (p, repos) => {
      const langs = topLangs(repos);
      const stars = totalStars(repos);
      const top = topRepos(repos);
      return `<div align="center">

<pre>
╔═══════════════════════════════════════════════╗
║  ▄▄▄  ▄▄▄ ▄▄▄▄▄ ▄▄▄ ▄▄▄ ▄▄▄ ▄▄▄ ▄▄▄ ▄▄▄   ║
║  █   █   █ █     █   █   █   █   █   █   █   ║
║  █   █▀▀▀█ █▀▀   █   █▀▀▀█▀▀▀█   █▀▀▀█   █   ║
║  █▄▄ █   █ █▄▄   █   █   █   █▄▄ █   █   █   ║
╚═══════════════════════════════════════════════╝
</pre>

# \`<span style="color:#f0abfc">${p.name || p.login}</span>\`

<img src="${p.avatar_url}" width="130" style="border-radius:50%;border:3px solid #f0abfc;box-shadow:0 0 20px #f0abfc" />

> **"${p.bio || 'Hack the planet. Write the code. Ship it.'}"**

---

### \`> system.status\`

\`\`\`yaml
operator:  ${p.login}
location:  ${p.location || 'Unknown'}
affiliation: ${p.company || 'Freelance'}
repos:     ${p.public_repos}
reputation: ${stars} ⭐
network:   ${p.followers} connections
\`\`\`

---

### \`> skills.load()\`

${langs.map(l => `\`[${l}]\``).join(' · ')}

---

### \`> analytics.render()\`

<img src="https://img.shields.io/badge/Repos-${p.public_repos}-0d1117?style=for-the-badge&logo=github&logoColor=f0abfc" width="200" />
<img src="https://img.shields.io/badge/Stars-${stars}-0d1117?style=for-the-badge&logo=github&logoColor=f0abfc" width="200" />
<img src="https://img.shields.io/badge/Followers-${p.followers}-0d1117?style=for-the-badge&logo=github&logoColor=f0abfc" width="200" />

---

### \`> top_contracts\`

${top.map(r => `<a href="${r.html_url}"><img src="https://img.shields.io/github/stars/${p.login}/${r.name}?style=social&label=${encodeURIComponent(r.name)}" /></a>`).join(' ')}

---

<pre>
[SYS] Connection secured • ${p.login}@github • ${new Date().toISOString().split('T')[0]}
</pre>

</div>`;
    },
  },
  {
    id: "gradient",
    name: "Gradient",
    desc: "Colorful gradient stat cards and dividers",
    accent: "#f97316",
    generate: (p, repos) => {
      const langs = topLangs(repos);
      const stars = totalStars(repos);
      const top = topRepos(repos);
      return `<div align="center">

<img src="${p.avatar_url}" width="150" style="border-radius:50%;border:4px solid transparent;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(135deg,#f97316,#ec4899,#8b5cf6) border-box" />

# Hi, I'm **${p.name || p.login}** 👋

${p.bio || 'Creating beautiful things with code ✨'}

---

![Followers](https://img.shields.io/badge/👥_Followers-${p.followers}-blueviolet?style=for-the-badge&logo=github)
![Stars](https://img.shields.io/badge/⭐_Stars-${stars}-orange?style=for-the-badge)
![Repos](https://img.shields.io/badge/📦_Repos-${p.public_repos}-emerald?style=for-the-badge&logo=github)
${p.location ? `![Location](https://img.shields.io/badge/📍_${encodeURIComponent(p.location)}-pink?style=for-the-badge)` : ''}

---

### 🌈 Languages

${langs.map(l => `<img src="https://img.shields.io/badge/${encodeURIComponent(l)}-${langColor(l).replace('#', '')}?style=for-the-badge&logo=${encodeURIComponent(l.toLowerCase())}&logoColor=white" />`).join(' ')}

---

### 📈 Stats

<img src="https://img.shields.io/badge/Repos-${p.public_repos}-0d1117?style=for-the-badge&logo=github&logoColor=f97316" width="200" />
<img src="https://img.shields.io/badge/Stars-${stars}-0d1117?style=for-the-badge&logo=github&logoColor=fbbf24" width="200" />
<img src="https://img.shields.io/badge/Followers-${p.followers}-0d1117?style=for-the-badge&logo=github&logoColor=ec4899" width="200" />
<img src="https://img.shields.io/github/languages/top/${p.login}?style=for-the-badge" width="200" />

---

### ✨ Featured Projects

| Project | Description | Stars |
|---------|-------------|-------|
${top.map(r => `| [**${r.name}**](${r.html_url}) | ${r.description || '_No description_'} | ⭐ ${r.stargazers_count} |`).join('\n')}

---

<img src="https://komarev.com/ghpvc/?username=${p.login}&color=f97316&style=flat-square" />

</div>`;
    },
  },
  {
    id: "vintage",
    name: "Vintage",
    desc: "Retro monospace, typewriter feel",
    accent: "#a16207",
    generate: (p, repos) => {
      const langs = topLangs(repos);
      const stars = totalStars(repos);
      const top = topRepos(repos);
      return `<div align="center">

<pre>
╔═══════════════════════════════════════════════╗
║                                               ║
║   ${' '.repeat(Math.max(0, 20 - (p.name || p.login).length / 2))}${(p.name || p.login).toUpperCase()}   
║                                               ║
╚═══════════════════════════════════════════════╝
</pre>

> *${p.bio || 'Once a coder, always a coder.'}*

---

**Estd.** ${new Date(p.created_at).getFullYear()} · **Based in** ${p.location || 'The Internet'} · **Active Repos** ${p.public_repos}

---

### Wares (Languages)

${langs.map(l => `\`${l}\``).join(' · ')}

---

### Ledger

\`\`\`
┌──────────────────────────────────┐
│  Repositories ......... ${String(p.public_repos).padStart(4)}  │
│  Stars ............... ${String(stars).padStart(4)}  │
│  Followers ........... ${String(p.followers).padStart(4)}  │
│  Following ........... ${String(p.following).padStart(4)}  │
└──────────────────────────────────┘
\`\`\`

---

### Finest Work

${top.map((r, i) => `${i + 1}. **[${r.name}](${r.html_url})** — ${r.stargazers_count} stars${r.description ? ` — _${r.description}_` : ''}`).join('\n')}

---

<img src="https://komarev.com/ghpvc/?username=${p.login}&color=a16207&style=flat-square" />

</div>`;
    },
  },
  {
    id: "anime",
    name: "Anime",
    desc: "Colorful cards, emoji-rich, kawaii style",
    accent: "#f472b6",
    generate: (p, repos) => {
      const langs = topLangs(repos);
      const stars = totalStars(repos);
      const top = topRepos(repos);
      return `<div align="center">

# ✨ ${p.name || p.login}-chan ✨

<img src="${p.avatar_url}" width="160" style="border-radius:50%;border:4px solid #f472b6;box-shadow:0 0 15px #f472b6" />

### 🌸 ${p.bio || 'Desu~ I code cute things! 🎀'} 🌸

---

<sub>📍 ${p.location || 'Tokyo'} · 🏢 ${p.company || ' freelance~'}</sub>

---

## 💖 My Stats!

| | |
|:---:|:---:|
| 📦 Repos | **${p.public_repos}** |
| ⭐ Stars | **${stars}** |
| 👥 Followers | **${p.followers}** |
| 💕 Following | **${p.following}** |

---

## 🎨 Skills!

${langs.map(l => `![${l}](https://img.shields.io/badge/-${encodeURIComponent(l)}-${langColor(l).replace('#', '')}?style=for-the-badge&logo=${encodeURIComponent(l.toLowerCase())}&logoColor=white)`).join(' ')}

---

## 📊 GitHub Activity~ ✨

<img src="https://img.shields.io/badge/Repos-${p.public_repos}-fff5f7?style=for-the-badge&logo=github&logoColor=f472b6" width="200" />
<img src="https://img.shields.io/badge/Stars-${stars}-fff5f7?style=for-the-badge&logo=github&logoColor=f472b6" width="200" />
<img src="https://img.shields.io/badge/Followers-${p.followers}-fff5f7?style=for-the-badge&logo=github&logoColor=f472b6" width="200" />

---

## 🌟 My Favorite Projects~!

${top.map(r => `<a href="${r.html_url}"><img src="https://img.shields.io/github/stars/${p.login}/${r.name}?style=social&label=${encodeURIComponent(r.name)}" /></a>`).join(' ')}

---

### 💕 Thank you for visiting! 💕

<img src="https://komarev.com/ghpvc/?username=${p.login}&color=f472b6&style=flat-square" />

</div>`;
    },
  },
  {
    id: "nature",
    name: "Nature",
    desc: "Earth tones, tree and nature ASCII art",
    accent: "#16a34a",
    generate: (p, repos) => {
      const langs = topLangs(repos);
      const stars = totalStars(repos);
      const top = topRepos(repos);
      return `<div align="center">

<pre>
        🌳
       /  \\
      /    \\
     / CODE \\
    /________\\
    |  ${p.name || p.login}  |
    |________|
</pre>

### 🌿 ${p.bio || 'Growing code, one commit at a time.'}

---

📍 **Rooted in** ${p.location || 'Nature'} · 🌱 **Growing** ${p.public_repos} repos · 🌳 **${p.followers}** followers

---

### 🍃 Tech Garden

${langs.map(l => `\`${l}\``).join(' · 🌱 · ')} · 🌱

---

### 🌻 Growth Stats

<img src="https://img.shields.io/badge/Repos-${p.public_repos}-16a34a?style=for-the-badge&logo=github&logoColor=white" width="200" />
<img src="https://img.shields.io/badge/Stars-${stars}-eab308?style=for-the-badge&logo=github&logoColor=white" width="200" />
<img src="https://img.shields.io/badge/Followers-${p.followers}-16a34a?style=for-the-badge&logo=github&logoColor=white" width="200" />

---

### 🌲 Top Trees

${top.map(r => `🌳 [**${r.name}**](${r.html_url}) — ⭐ ${r.stargazers_count}${r.description ? ` | _${r.description}_` : ''}`).join('\n')}

---

<pre>
🌿 Keep growing, keep coding 🌿
</pre>

</div>`;
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    desc: "Blue/teal theme, wave dividers",
    accent: "#0891b2",
    generate: (p, repos) => {
      const langs = topLangs(repos);
      const stars = totalStars(repos);
      const top = topRepos(repos);
      return `<div align="center">

# 🌊 ${p.name || p.login} 🌊

<img src="${p.avatar_url}" width="140" style="border-radius:50%;border:3px solid #0891b2" />

> 🐚 *${p.bio || 'Riding the waves of technology.'}*

---

### 🧭 Navigation

| | |
|---|---|
| 📍 Location | ${p.location || 'Somewhere at sea'} |
| 🏢 Company | ${p.company || 'Open Waters'} |
| 🔭 Repos | ${p.public_repos} |
| ⭐ Stars | ${stars} |
| 🌊 Followers | ${p.followers} |

---

### ⛵ Sailing With

${langs.map(l => `![${l}](https://img.shields.io/badge/${encodeURIComponent(l)}-${langColor(l).replace('#', '')}?style=flat-square&logo=${encodeURIComponent(l.toLowerCase())}&logoColor=white)`).join(' ')}

---

### 🌊 Currents (Stats)

<img src="https://img.shields.io/badge/Repos-${p.public_repos}-001f3f?style=for-the-badge&logo=github&logoColor=0891b2" width="200" />
<img src="https://img.shields.io/badge/Stars-${stars}-001f3f?style=for-the-badge&logo=github&logoColor=fbbf24" width="200" />
<img src="https://img.shields.io/badge/Followers-${p.followers}-001f3f?style=for-the-badge&logo=github&logoColor=0891b2" width="200" />
<img src="https://img.shields.io/github/languages/top/${p.login}?style=for-the-badge" width="200" />

---

### 🐋 Deep Sea Finds

${top.map(r => `<a href="${r.html_url}"><img src="https://img.shields.io/github/stars/${p.login}/${r.name}?style=social&label=${encodeURIComponent(r.name)}" /></a>`).join(' ')}

---

<img src="https://komarev.com/ghpvc/?username=${p.login}&color=0891b2&style=for-the-badge" />

</div>`;
    },
  },
];

export default themes;
