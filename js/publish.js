/* publish.js: one-click publish. Commits content/data.json + new media to your GitHub repo; Netlify then redeploys by itself. */
"use strict";

const PUB_KEY = "garden.publish";
const pubCfg = () => { try { return JSON.parse(localStorage.getItem(PUB_KEY)) || {}; } catch (e) { return {}; } };
const pubSave = c => { try { localStorage.setItem(PUB_KEY, JSON.stringify(c)); } catch (e) { /* ignore */ } };

async function gh(cfg, path, opt = {}) {
  const r = await fetch(`https://api.github.com/repos/${cfg.repo}/${path}`, {
    method: opt.method || "GET",
    headers: { Accept: "application/vnd.github+json", Authorization: "Bearer " + cfg.token, "X-GitHub-Api-Version": "2022-11-28", ...(opt.body ? { "Content-Type": "application/json" } : {}) },
    body: opt.body ? JSON.stringify(opt.body) : undefined
  });
  if (!r.ok) {
    let msg = ""; try { msg = (await r.json()).message; } catch (e) { /* ignore */ }
    const err = new Error(`GitHub ${r.status}: ${msg}`); err.status = r.status; throw err;
  }
  return r.json();
}

function toBase64(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(",")[1] || "");
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(blob);
  });
}

async function publishNow(cfg) {
  const step = t => toast(t, true);
  step("Packing your garden…");
  const { st, media, used } = await buildBundle({ publish: true });
  step("Checking what's already online…");
  const ref = await gh(cfg, `git/ref/heads/${encodeURIComponent(cfg.branch).replace(/%2F/g, "/")}`);
  const commit = await gh(cfg, `git/commits/${ref.object.sha}`);
  const tree = await gh(cfg, `git/trees/${commit.tree.sha}?recursive=1`);
  const have = new Set(tree.tree.filter(t => t.type === "blob").map(t => t.path));
  const base = cfg.folder ? cfg.folder.replace(/^\/+|\/+$/g, "") + "/" : "";
  const items = [];
  const put = async (path, blob) => {
    const b = await gh(cfg, "git/blobs", { method: "POST", body: { content: await toBase64(blob), encoding: "base64" } });
    items.push({ path, mode: "100644", type: "blob", sha: b.sha });
  };
  const fresh = media.filter(m => !have.has(base + "content/" + m.name));
  const big = fresh.find(m => m.blob.size > 50e6);
  if (big) { const e = new Error("too big"); e.status = "big"; throw e; }
  let n = 0;
  for (const m of fresh) { step(`Uploading ${++n} of ${fresh.length + 1}…`); await put(base + "content/" + m.name, m.blob); }
  step("Uploading your pages…");
  await put(base + "content/data.json", new Blob([JSON.stringify(st, null, 1)], { type: "application/json" }));
  // drop published media nothing points to any more (only inside content/media)
  const keep = new Set([...used, ...media.map(m => m.name)].map(x => base + "content/" + x));
  let removed = 0;
  for (const p of have) if (p.startsWith(base + "content/media/") && !keep.has(p)) { items.push({ path: p, mode: "100644", type: "blob", sha: null }); removed++; }
  step("Saving…");
  const nt = await gh(cfg, "git/trees", { method: "POST", body: { base_tree: commit.tree.sha, tree: items } });
  const nc = await gh(cfg, "git/commits", { method: "POST", body: { message: "Update our garden " + new Date().toISOString().slice(0, 16).replace("T", " "), tree: nt.sha, parents: [commit.sha] } });
  await gh(cfg, `git/refs/heads/${encodeURIComponent(cfg.branch).replace(/%2F/g, "/")}`, { method: "PATCH", body: { sha: nc.sha } });
  return { uploaded: fresh.length, removed };
}

function publishSetup(after) {
  const c = pubCfg();
  const dlg = modal("Publish settings", `
    <p class="hint">Publishing saves your edits to a GitHub repository. Netlify is linked to that repo, so it updates the live site by itself a minute later. The access token stays in this browser only.</p>
    <label>GitHub repository<input name="repo" value="${esc(c.repo || "")}" placeholder="yourname/our-little-garden" autocapitalize="off" spellcheck="false"></label>
    <div class="two"><label>Branch<input name="branch" value="${esc(c.branch || "main")}" autocapitalize="off"></label><label>Site folder in repo <small>(usually empty)</small><input name="folder" value="${esc(c.folder || "")}" autocapitalize="off"></label></div>
    <label>Access token<input name="token" type="password" value="${esc(c.token || "")}" placeholder="github_pat_…" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
    <p class="hint">Token: GitHub → Settings → Developer settings → Fine-grained tokens → only this repository → Contents: Read and write.</p>`,
  fd => {
    const repo = fd.get("repo").trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/+$/, "");
    const cfg = { repo, branch: fd.get("branch").trim() || "main", folder: fd.get("folder").trim(), token: fd.get("token").trim() };
    if (!/^[\w.-]+\/[\w.-]+$/.test(cfg.repo) || !cfg.token) { toast("Add the repository (owner/name) and the token."); return; }
    pubSave(cfg);
    toast("Saved.");
    if (after) after(cfg);
  }, "wide");
  return dlg;
}

let publishing = false;
async function publish() {
  if (publishing) return;
  const cfg = pubCfg();
  if (!cfg.repo || !cfg.token) { publishSetup(c => publish()); return; }
  publishing = true;
  try {
    const r = await publishNow(cfg);
    toast(`Published! ${r.uploaded} new file${r.uploaded === 1 ? "" : "s"}. The live site updates in about a minute.`);
  } catch (e) {
    console.error(e);
    if (e.status === "big") toast("One video is over 50 MB, too big to publish this way. Trim or compress it and try again.");
    else if (e.status === 401 || e.status === 403) toast("GitHub refused the token. Check it in Publish settings.");
    else if (e.status === 404) toast("Couldn't find that repo or branch. Check Publish settings.");
    else if (e.status === 409 || e.status === 422) toast("The site changed on GitHub meanwhile. Try Publish again.");
    else toast("Couldn't publish. Check your internet and try again.");
  } finally { publishing = false; }
}
