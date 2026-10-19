// Tabs, weather, experience and work content.

const TABS = ["home", "about", "experience", "work", "books", "movies", "puzzle"];

const MORE = ["books", "movies", "puzzle"]; // grouped under the "more" tab

function showTab() {
  const name = location.hash.slice(1);
  const tab = name === "more" ? "books" : TABS.includes(name) ? name : "home";
  const navTab = MORE.includes(tab) ? "more" : tab;
  document.querySelectorAll(".view").forEach((v) => (v.hidden = v.dataset.view !== tab));
  document.querySelectorAll(".tabs a").forEach((a) => {
    if (a.dataset.tab === navTab) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.getElementById("subtabs").hidden = navTab !== "more";
  document.querySelectorAll(".subtabs a").forEach((a) => {
    if (a.dataset.sub === tab) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.dispatchEvent(new CustomEvent("tabshown", { detail: tab }));
}
window.addEventListener("hashchange", showTab);

// ---------- weather (Open-Meteo, no key needed) ----------
const WX_CODES = {
  0: "clear skies", 1: "mostly clear", 2: "partly cloudy", 3: "overcast",
  45: "fog rolling in", 48: "freezing fog",
  51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
  61: "light rain", 63: "rain", 65: "heavy rain",
  71: "light snow", 73: "snow", 75: "heavy snow",
  80: "rain showers", 81: "rain showers", 82: "heavy showers",
  95: "thunderstorms", 96: "thunderstorms", 99: "thunderstorms",
};
const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function tickClock() {
  const t = new Date().toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit",
  });
  document.getElementById("wx-time").textContent = t.toLowerCase();
}

async function loadWeather() {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=37.8716&longitude=-122.2727" +
    "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m" +
    "&temperature_unit=fahrenheit&wind_speed_unit=kn&timezone=America%2FLos_Angeles";
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const c = (await res.json()).current;
    document.getElementById("wx-temp").textContent = `${Math.round(c.temperature_2m)}°`;
    document.getElementById("wx-desc").textContent = WX_CODES[c.weather_code] ?? "mixed skies";
    const dir = COMPASS[Math.round(c.wind_direction_10m / 45) % 8];
    document.getElementById("wx-wind").textContent = `${Math.round(c.wind_speed_10m)} kn from the ${dir}`;
    document.getElementById("wx-hum").textContent = `${c.relative_humidity_2m}%`;
  } catch {
    document.getElementById("wx-desc").textContent = "weather didn't load, refresh to retry";
  }
}

// ---------- experience ----------
const JOBS = [
  {
    co: "Stealth Startup", title: "Research Engineer", note: "Series A, under NDA",
    where: "San Francisco", when: "Aug 2026 – now",
    summary: "I'm building the backend from scratch and post-training open-source models that go into production. I also build integrations for the researchers who use it, and turn what they tell me into product changes.",
  },
  {
    co: "Microsoft", title: "Data Science Intern",
    where: "Seattle", when: "May – Aug 2026",
    summary: "I built a sandboxed home for internal AI agents, plus the evals that cut down how often they made things up. On the side I ran causal inference experiments and built a model for finding new customers.",
  },
  {
    co: "Brilliant Earth", title: "Applied Science Intern",
    where: "San Francisco", when: "May – Aug 2025",
    summary: "I rebuilt the company's financial forecasting models so they missed by a lot less. I also designed and shipped a feature customers liked, and built the data pipelines PMs and engineers leaned on.",
  },
  {
    co: "Innov8ai", title: "Machine Learning Engineer Intern",
    where: "San Francisco", when: "Feb – May 2025",
    summary: "I built NLP pipelines that took data all the way from ingestion to testing and evals. Then I tuned the models until they got noticeably more accurate.",
  },
];

function renderJobs() {
  const list = document.getElementById("roles");
  const detail = document.getElementById("role-detail");
  list.innerHTML = JOBS.map((j, i) => `
    <button role="tab" data-i="${i}" aria-selected="${i === 0}">
      <span class="r-co">${j.co}</span>
      <span class="r-when">${j.when}</span>
    </button>`).join("");

  function select(i) {
    const j = JOBS[i];
    list.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b.dataset.i == i));
    detail.innerHTML = `
      <div>
        <h2>${j.title}</h2>
        <p class="role-meta">${j.co}${j.note ? ` (${j.note})` : ""}<br>${j.where}</p>
      </div>
      <p class="role-sum">${j.summary}</p>`;
  }
  list.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) select(+b.dataset.i);
  });
  select(0);
}

// ---------- research / projects / open source ----------
const WORK = {
  projects: [
    { name: "Spine", url: "https://github.com/VishnuR23/spine", where: "C++, PyTorch",
      desc: "A security platform that governs production AI agents in finance, with new defenses against prompt injection." },
    { name: "DataTool", url: "https://github.com/VishnuR23/DataTool", where: "Python, PyTorch",
      desc: "Self-improving A/B testing for frontends: it watches usage analytics, improves the UI, and recommends features." },
    { name: "Climber Coach", url: "https://github.com/VishnuR23/ClimbrerCoach", where: "Python, Go",
      desc: "Real-time computer vision that plans climbing routes and coaches climbers with live AI voice guidance." },
    { name: "Molecular Dynamics", url: "https://github.com/VishnuR23/MolecularDynamics", where: "C++",
      desc: "A molecular dynamics engine that matches NIST's published reference energies to the last digit and reproduces liquid argon experiments." },
  ],
  oss: [
    { name: "NVIDIA NemoClaw", where: "AI agents", url: "https://github.com/NVIDIA/NemoClaw",
      desc: "Found silent failures in uninstall, WSL detection, and dev setup before they reached users." },
    { name: "NVIDIA garak", where: "AI safety", url: "https://github.com/NVIDIA/garak",
      desc: "Fixed detection and config bugs across the probe, tokenizer, and selection layers of NVIDIA's LLM security scanner." },
    { name: "Microsoft PyRIT", where: "AI safety", url: "https://github.com/Azure/PyRIT",
      desc: "Fixed random-seed leaks and score-aggregation bugs across converters, scoring, and docs." },
    { name: "NVIDIA NeMo-RL", where: "Reinforcement learning", url: "https://github.com/NVIDIA-NeMo/RL",
      desc: "Fixed silent config and error-handling bugs across training backends, and added features." },
    { name: "AllenAI Open Instruct", where: "Post-training", url: "https://github.com/allenai/open-instruct",
      desc: "Fixed silent logging and timeout bugs in the training and code-grading paths, and cleaned up docs." },
    { name: "UK AISI inspect_evals", where: "AI evals", url: "https://github.com/UKGovernmentBEIS/inspect_evals",
      desc: "Fixed scoring and grading bugs in benchmarks like BrowseComp, StereoSet, BBEH, and Mind2Web." },
  ],
};

function renderWork(kind) {
  const research = kind === "research";
  document.getElementById("research-blurb").hidden = !research;
  document.getElementById("entries").hidden = research;
  document.getElementById("more-projects").hidden = kind !== "projects";
  document.querySelectorAll("[data-seg]").forEach((b) => b.setAttribute("aria-selected", b.dataset.seg === kind));
  if (research) return;
  document.getElementById("entries").innerHTML = WORK[kind].map((e) => `
    <li>
      <div class="e-name"><a href="${e.url}" target="_blank" rel="noopener">${e.name}</a></div>
      <div class="e-where">${e.where}</div>
      <p class="e-desc">${e.desc}</p>
    </li>`).join("");
}
document.querySelector(".view-work .switch").addEventListener("click", (e) => {
  const b = e.target.closest("[data-seg]");
  if (b) renderWork(b.dataset.seg);
});

// ---------- books & movies ----------
// rating is out of 5 stars.
const BOOKS_READ = [
  { title: "The Stranger", by: "Albert Camus", rating: 3 },
  { title: "The Picture of Dorian Gray", by: "Oscar Wilde", rating: 4 },
  { title: "War and Peace", by: "Leo Tolstoy", rating: 5 },
  { title: "Norwegian Wood", by: "Haruki Murakami", rating: 3 },
  { title: "Kafka on the Shore", by: "Haruki Murakami", rating: 3.5 },
  { title: "East of Eden", by: "John Steinbeck", rating: 5 },
  { title: "The Winter of Our Discontent", by: "John Steinbeck", rating: 3 },
  { title: "The Way of Kings", by: "Brandon Sanderson", rating: 4 },
];

const FILMS_RECENT = [
  { title: "Digger", rating: 4 },
  { title: "Primetime", rating: 3.5 },
  { title: "The Odyssey", rating: 4, rewatch: true },
  { title: "Once Upon a Time in Hollywood", rating: 5, rewatch: true },
];

const FILMS_FAV = [
  "The Social Network",
  "Star Wars",
  "Inherent Vice",
  "Twin Peaks: Fire Walk with Me",
  "Mulholland Drive",
];

function stars(n) {
  if (n == null) return "";
  const text = "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "");
  return `<span class="stars" aria-label="${n} out of 5 stars">${text}</span>`;
}

function renderShelves() {
  document.getElementById("books-read").innerHTML = BOOKS_READ.map((b) => `
    <li><span class="shelf-title">${b.title}</span>${stars(b.rating)}<span class="muted">${b.by}</span></li>`).join("");
  document.getElementById("films-recent").innerHTML = FILMS_RECENT.map((f) => `
    <li><span class="shelf-title">${f.title}</span>${stars(f.rating)}${f.rewatch ? `<span class="muted">rewatch</span>` : ""}</li>`).join("");
  document.getElementById("films-fav").innerHTML = FILMS_FAV.map((t) => `
    <li><span class="shelf-title">${t}</span></li>`).join("");
}

// ---------- dark mode ----------
const themeBtn = document.getElementById("theme");
function paintThemeButton() {
  themeBtn.textContent = document.documentElement.dataset.theme === "dark" ? "light mode" : "dark mode";
}
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch {}
  paintThemeButton();
});
paintThemeButton();

renderJobs();
renderShelves();
renderWork("research");
tickClock();
setInterval(tickClock, 30_000);
loadWeather();
showTab();
